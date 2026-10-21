import random
from storage import carregar_missoes_gerais, carregar_usuarios, salvar_usuarios

def gerar_missoes_gerais(carteirinha=None):

    if carteirinha:
        usuarios = carregar_usuarios()

        usuario = usuarios.get(carteirinha)

        if not usuario:
            return []

        if "missoesGeraisAtivas" in usuario and usuario["missoesGeraisAtivas"]:
            return usuario["missoesGeraisAtivas"]

    missoes = carregar_missoes_gerais()

    missoes_sorteadas = random.sample(
        missoes,
        min(3, len(missoes))
    )

    for index, missao in enumerate(missoes_sorteadas):

        missao["id"] = index + 1

    if carteirinha:
        usuario["missoesGeraisAtivas"] = missoes_sorteadas

        salvar_usuarios(usuarios)

    return missoes_sorteadas
