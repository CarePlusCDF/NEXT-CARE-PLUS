"""Grava o pacote privado Care Plus; atualizar preserva a fila LittleFS."""
import argparse
import hashlib
import importlib.metadata
import json
from pathlib import Path
import re
import subprocess
import sys


def load_package(root):
    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    for name, expected in manifest["sha256"].items():
        path = (root / name).resolve()
        if root not in path.parents or not path.is_file():
            raise ValueError(f"Arquivo ausente/invalido: {name}")
        if hashlib.sha256(path.read_bytes()).hexdigest() != expected:
            raise ValueError(f"Arquivo alterado/incompleto: {name}. Extraia novamente o ZIP.")
    return manifest


def flash_command(root, manifest, board, port, initial):
    if not re.fullmatch(r"COM[1-9][0-9]*", port, re.IGNORECASE):
        raise ValueError("Informe a porta do aparelho, por exemplo COM5.")
    config = manifest["boards"][board]
    if initial and not config.get("initial"):
        raise ValueError("Este pacote e somente de atualizacao. Retire --primeira-instalacao; a fila deve ser preservada.")
    images = config["initial"] if initial else config["update"]
    command = [sys.executable, "-m", "esptool", "--chip", config["chip"],
               "--port", port, "--baud", "115200", "--before", "default_reset",
               "--after", "hard_reset", "write_flash", "-z", "--flash_mode", "dio",
               "--flash_freq", config["frequency"], "--flash_size", "4MB"]
    for address, filename in images:
        if filename not in manifest["sha256"]:
            raise ValueError(f"Imagem sem verificacao: {filename}")
        command.extend([address, str(root / filename)])
    return command


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--listar", action="store_true", help="Lista portas USB/serial.")
    parser.add_argument("--verificar", action="store_true", help="Confere o pacote sem acessar placas.")
    parser.add_argument("--placa", choices=["pulseira", "luminaria"])
    parser.add_argument("--porta")
    parser.add_argument("--primeira-instalacao", action="store_true",
                        help="Instalacao inicial. Na pulseira, inicializa o LittleFS vazio.")
    parser.add_argument("--simular", action="store_true", help="Mostra o comando sem gravar.")
    args = parser.parse_args()
    if args.listar:
        from serial.tools import list_ports
        ports = sorted(list_ports.comports(), key=lambda p: p.device)
        for port in ports:
            print(f"{port.device}: {port.description}")
        if not ports:
            print("Nenhuma porta encontrada. Confira cabo USB de dados e modo BOOT.")
        return 0
    root = Path(__file__).resolve().parent
    manifest = load_package(root)
    if args.verificar:
        print("Pacote integro. Nenhuma placa foi acessada.")
        return 0
    if not args.placa or not args.porta:
        parser.error("Use --placa pulseira (ou luminaria) --porta COMx; veja LEIA-ME.md.")
    command = flash_command(root, manifest, args.placa, args.porta, args.primeira_instalacao)
    if args.simular:
        print(subprocess.list2cmdline(command))
        return 0
    if importlib.metadata.version("esptool") != "4.9.0":
        raise ValueError("Instale a versao preparada: python -m pip install -r requirements.txt")
    if args.primeira_instalacao and args.placa == "pulseira":
        print("PRIMEIRA instalacao: inicializa a memoria da fila vazia.")
        print("Se esta pulseira ja usou o firmware HTTPS, cancele e atualize sem essa opcao.")
        if input("Para a primeira instalacao, digite INSTALAR: ").strip() != "INSTALAR":
            print("Gravacao cancelada.")
            return 1
    print(f"Gravando {args.placa} em {args.porta}. Aguarde sem desconectar o USB.")
    result = subprocess.run(command, check=False)
    if result.returncode == 0:
        print("Gravacao concluida. Se nao iniciar, solte BOOT e aperte RESET/RST uma vez.")
        print("Aguarde a conexao e confira o aparelho no Connect+ do site.")
    return result.returncode


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nOperacao interrompida. Nao considere a gravacao concluida.")
        sys.exit(1)
    except (ValueError, OSError, ImportError, importlib.metadata.PackageNotFoundError) as exc:
        print(f"Erro: {exc}", file=sys.stderr)
        sys.exit(1)
