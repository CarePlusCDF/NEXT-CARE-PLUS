"""Empacota os dois firmwares ja compilados, sem gravar ou inicializar placas."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import struct
import zipfile


MARKER = b"careplus-wifi-portal-v1:"


def literals(source, name, array=False):
    if array:
        match = re.search(r"\b" + name + r"\[\]\s*=\s*\{([^}]+)\}", source, re.S)
        if not match:
            raise ValueError(f"Nao foi possivel ler {name}.")
        return [json.loads(s) for s in re.findall(r'"(?:\\.|[^"\\])*"', match.group(1))]
    return [json.loads(s) for s in re.findall(r"\b" + name + r'\s*=\s*("(?:\\.|[^"\\])*")', source)]


def portal_access(device_id, token):
    ssid = "CarePlus-" + re.sub(r"[^a-zA-Z0-9_-]", "-", device_id)[:23]
    password = hashlib.sha256(MARKER + token.encode()).hexdigest()[:20]
    return ssid, password


def prepare(edge, output):
    output = output.resolve()
    private_root = (edge.parent / "artifacts").resolve()
    if private_root not in output.parents:
        raise ValueError("Use um subdiretorio de artifacts para manter o pacote privado fora do Git.")
    source = (edge / "firmware/include/CareConfig.h").read_text(encoding="utf-8")
    ids, tokens = literals(source, "DEVICE_ID"), literals(source, "DEVICE_TOKEN")
    ssids, passwords = literals(source, "WIFI_SSIDS", True), literals(source, "WIFI_PASSWORDS", True)
    if any(len(values) != 2 for values in (ids, tokens, ssids, passwords)):
        raise ValueError("Confira a configuracao das duas placas e das duas redes.")
    if any(not token or token.startswith("PASTE") for token in tokens):
        raise ValueError("Preencha as credenciais privadas antes de compilar.")
    files, boards, access = {}, {}, []
    # Assemble entirely in memory first: a mismatch must not leave a mixed bundle.
    for index, (board, chip, frequency) in enumerate((("pulseira", "esp32c3", "80m"), ("luminaria", "esp32", "40m"))):
        build = edge / ".pio/build" / board
        data = (build / "firmware.bin").read_bytes()
        if MARKER not in data:
            raise ValueError(f"Recompile {board}: o binario nao contem o portal Wi-Fi.")
        expected = [ids[index], tokens[index], *ssids, *passwords]
        if any(value and value.encode() + b"\0" not in data for value in expected):
            raise ValueError(f"Recompile {board}: configuracao diferente do binario.")
        parts = {}
        raw = (build / "partitions.bin").read_bytes()
        for i in range(0, len(raw), 32):
            magic, _, _, offset, size, label, _ = struct.unpack("<HBBII16sI", raw[i:i + 32])
            if magic != 0x50AA:
                break
            parts[label.rstrip(b"\0").decode()] = (offset, size)
        if parts.get("app0") != (0x10000, 0x140000) or parts.get("spiffs") != (0x290000, 0x160000):
            raise ValueError("Tabela de particoes diferente da instalacao existente.")
        if len(data) > parts["app0"][1]:
            raise ValueError(f"Firmware {board} excede a particao.")
        name = f"{board}/firmware.bin"
        files[name] = data
        boards[board] = {"chip": chip, "frequency": frequency, "update": [["0x10000", name]]}
        ssid, password = portal_access(ids[index], tokens[index])
        access.append(f"## {board.capitalize()}\n\nRede: `{ssid}`\n\nSenha da rede local: `{password}`\n\nPagina: http://192.168.4.1\n")
    files["gravar.py"] = (edge / "tools/gravar.py").read_bytes()
    files["LEIA-ME.md"] = (edge / "tools/LEIA-ME-ATUALIZACAO-WIFI.md").read_bytes()
    files["requirements.txt"] = b"esptool==4.9.0\npyserial==3.5\n"
    files["ACESSO-WIFI-PRIVADO.md"] = ("# Acesso local aos aparelhos — PRIVADO\n\n"
        "Compartilhe apenas com quem configura estes aparelhos. Estas senhas abrem as redes locais de configuracao; nao sao os tokens da API.\n\n"
        + "\n".join(access)).encode("utf-8")
    manifest = {"format": 1, "update_only": True, "created": datetime.now(timezone.utc).isoformat(),
                "boards": boards, "sha256": {name: hashlib.sha256(data).hexdigest() for name, data in sorted(files.items())}}
    files["manifest.json"] = (json.dumps(manifest, indent=2, ensure_ascii=False) + "\n").encode("utf-8")
    output.mkdir(parents=True, exist_ok=True)
    for name, data in files.items():
        target = output / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    archive = output.with_suffix(".zip")
    temporary = archive.with_suffix(".zip.part")
    with zipfile.ZipFile(temporary, "w", zipfile.ZIP_DEFLATED) as z:
        for name, data in sorted(files.items()):
            z.writestr(name, data)
    with zipfile.ZipFile(temporary) as z:
        if z.testzip() is not None:
            raise ValueError("Falha na verificacao do ZIP; pacote anterior preservado.")
    temporary.replace(archive)
    return archive


if __name__ == "__main__":
    edge = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=edge.parent / "artifacts/CarePlus-WiFi-Celular-PRIVADO")
    args = parser.parse_args()
    try:
        result = prepare(edge, args.output)
        print(f"Pacote PRIVADO criado: {result} ({result.stat().st_size} bytes).")
        print("Somente atualizacao da aplicacao: LittleFS e NVS preservados. Nenhuma placa acessada.")
        print("Senhas locais em ACESSO-WIFI-PRIVADO.md dentro do pacote. Nao publique o ZIP.")
    except (ValueError, OSError, json.JSONDecodeError) as exc:
        parser.exit(1, f"Erro: {exc}\n")
