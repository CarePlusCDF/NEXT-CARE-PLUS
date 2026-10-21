import json
import os
from pathlib import Path
from threading import RLock

BASE_DIR = Path(__file__).resolve().parent
USUARIOS_ARQUIVO = BASE_DIR / "usuarios.json"
BENEFICIOS_ARQUIVO = BASE_DIR / "beneficios.json"
MISSOES_GERAIS_ARQUIVO = BASE_DIR / "missoesGerais.json"

_lock = RLock()


def carregar_json(caminho, fallback):
    with _lock:
        if not caminho.exists():
            return fallback

        with caminho.open("r", encoding="utf-8") as arquivo:
            return json.load(arquivo)


def salvar_json(caminho, dados):
    with _lock:
        arquivo_temporario = caminho.with_suffix(f"{caminho.suffix}.tmp")

        with arquivo_temporario.open("w", encoding="utf-8") as arquivo:
            json.dump(dados, arquivo, indent=4, ensure_ascii=False)

        os.replace(arquivo_temporario, caminho)


def carregar_usuarios():
    return carregar_json(USUARIOS_ARQUIVO, {})


def salvar_usuarios(usuarios):
    salvar_json(USUARIOS_ARQUIVO, usuarios)


def carregar_beneficios():
    return carregar_json(BENEFICIOS_ARQUIVO, [])


def carregar_missoes_gerais():
    return carregar_json(MISSOES_GERAIS_ARQUIVO, [])
