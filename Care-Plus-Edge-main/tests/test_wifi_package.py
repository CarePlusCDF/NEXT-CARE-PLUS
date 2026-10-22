"""Host tests for update safety and private portal credentials (no real secrets)."""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import tempfile
import unittest
from unittest.mock import patch
import zipfile


TOOLS = Path(__file__).resolve().parents[1] / 'tools'


def module(name, filename):
    spec = importlib.util.spec_from_file_location(name, TOOLS / filename)
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


pack = module('wifi_pack', 'preparar-pacote-wifi.py')
flash = module('wifi_flash', 'gravar.py')


class WifiPackageTests(unittest.TestCase):
    def test_portal_password_is_domain_separated_and_reproducible(self):
        ssid, password = pack.portal_access('pulseira-001', 'example-token')
        self.assertEqual(ssid, 'CarePlus-pulseira-001')
        self.assertEqual(password, hashlib.sha256(b'careplus-wifi-portal-v1:example-token').hexdigest()[:20])
        self.assertNotEqual(password, hashlib.sha256(b'example-token').hexdigest()[:20])
        self.assertEqual(len(pack.portal_access('x' * 80, 'example-token')[0]), 32)

    def test_private_output_cannot_be_written_into_source_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            edge = Path(temp) / 'Edge'
            with self.assertRaisesRegex(ValueError, 'subdiretorio de artifacts'):
                pack.prepare(edge, edge / 'public')

    def test_legacy_initial_bundle_remains_usable(self):
        manifest = {'boards': {'pulseira': {'chip': 'esp32c3', 'frequency': '80m',
                    'initial': [['0x290000', 'littlefs.bin']], 'update': [['0x10000', 'firmware.bin']]}},
                    'sha256': {'littlefs.bin': 'unused', 'firmware.bin': 'unused'}}
        cmd = flash.flash_command(Path.cwd(), manifest, 'pulseira', 'COM5', True)
        self.assertIn('0x290000', cmd)

    def test_update_bundle_integrity_and_only_application_writes(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            edge = root / 'Edge'
            config = edge / 'firmware/include'
            config.mkdir(parents=True)
            (config / 'CareConfig.h').write_text('''
static const char *WIFI_SSIDS[] = {"Casa", "Celular"};
static const char *WIFI_PASSWORDS[] = {"senha-casa", "senha-celular"};
static const char *DEVICE_ID = "pulseira-001";
static const char *DEVICE_TOKEN = "example-token-band";
static const char *DEVICE_ID = "luminaria-001";
static const char *DEVICE_TOKEN = "example-token-lamp";
''', encoding='utf-8')
            (edge / 'tools').mkdir()
            (edge / 'tools/gravar.py').write_bytes((TOOLS / 'gravar.py').read_bytes())
            (edge / 'tools/LEIA-ME-ATUALIZACAO-WIFI.md').write_text('Guide', encoding='utf-8')
            for board, device, token in (('pulseira', 'pulseira-001', 'example-token-band'),
                                         ('luminaria', 'luminaria-001', 'example-token-lamp')):
                build = edge / '.pio/build' / board
                build.mkdir(parents=True)
                data = [pack.MARKER, device.encode(), token.encode(), b'Casa', b'Celular', b'senha-casa', b'senha-celular']
                (build / 'firmware.bin').write_bytes(b'\0'.join(data) + b'\0')
                partition = lambda offset, size, label: struct.pack('<HBBII16sI', 0x50AA, 0, 0, offset, size, label, 0)
                (build / 'partitions.bin').write_bytes(partition(0x10000, 0x140000, b'app0') +
                    partition(0x290000, 0x160000, b'spiffs') + b'\xff' * 32)
            output = root / 'artifacts/Update'
            archive = pack.prepare(edge, output)
            original_archive = archive.read_bytes()
            with patch.object(zipfile.ZipFile, 'writestr', side_effect=OSError('simulated interruption')):
                with self.assertRaises(OSError):
                    pack.prepare(edge, output)
            self.assertEqual(archive.read_bytes(), original_archive)
            manifest = flash.load_package(output)
            self.assertTrue(manifest['update_only'])
            with zipfile.ZipFile(archive) as zipped:
                self.assertIsNone(zipped.testzip())
                self.assertFalse(any('littlefs' in name or 'bootloader' in name or 'CareConfig.h' in name for name in zipped.namelist()))
            for board in ('pulseira', 'luminaria'):
                with self.assertRaisesRegex(ValueError, 'somente de atualizacao'):
                    flash.flash_command(output, manifest, board, 'COM5', True)
                cmd = flash.flash_command(output, manifest, board, 'COM5', False)
                index = cmd.index('4MB') + 1
                self.assertEqual(cmd[index:], ['0x10000', str(output / board / 'firmware.bin')])
                with self.assertRaises(ValueError):
                    flash.flash_command(output, manifest, board, 'COM5 & echo x', False)
            firmware = output / 'pulseira/firmware.bin'
            firmware.write_bytes(firmware.read_bytes() + b'corrupted')
            with self.assertRaisesRegex(ValueError, 'alterado'):
                flash.load_package(output)
            # A source/configuration change after compilation cannot produce a bundle.
            original = (config / 'CareConfig.h').read_text(encoding='utf-8')
            (config / 'CareConfig.h').write_text(original.replace('senha-casa', 'outra-senha'), encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'configuracao diferente'):
                pack.prepare(edge, output)


if __name__ == '__main__':
    unittest.main()
