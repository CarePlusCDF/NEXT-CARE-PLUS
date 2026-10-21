from datetime import date


def _normalizar_historico_missoes(usuario):
    historico = usuario.get("missoesPorDia")

    if not isinstance(historico, dict):
        historico = {}

    historico_normalizado = {}

    for dia, quantidade in historico.items():
        try:
            historico_normalizado[str(dia)] = max(0, int(quantidade))
        except (TypeError, ValueError):
            historico_normalizado[str(dia)] = 0

    usuario["missoesPorDia"] = historico_normalizado

    return historico_normalizado


def _registrar_contagem_do_dia(usuario, dia, quantidade):
    if not dia:
        return

    historico = _normalizar_historico_missoes(usuario)

    try:
        quantidade = max(0, int(quantidade))
    except (TypeError, ValueError):
        quantidade = 0

    historico[str(dia)] = max(historico.get(str(dia), 0), quantidade)


def preparar_progresso_usuario(usuario):
    if not usuario:
        return usuario

    hoje = str(date.today())

    usuario.setdefault("missoesConcluidasHoje", 0)
    usuario.setdefault("ultimoDiaMissoes", hoje)
    _normalizar_historico_missoes(usuario)
    ultimo_dia_missoes = usuario.get("ultimoDiaMissoes")

    if usuario.get("missoesConcluidasHoje", 0) > 0:
        _registrar_contagem_do_dia(
            usuario,
            ultimo_dia_missoes or hoje,
            usuario.get("missoesConcluidasHoje", 0),
        )

    if ultimo_dia_missoes != hoje:
        usuario["missoesConcluidasHoje"] = 0
        usuario["ultimoDiaMissoes"] = hoje
        usuario["missoesPorDia"].setdefault(hoje, 0)

    usuario.setdefault("streak", 0)
    usuario.setdefault("ultimoDiaStreak", "")
    usuario.setdefault("streakDiasAcendidos", [])

    ultimo_dia_streak = usuario.get("ultimoDiaStreak")

    if (
        ultimo_dia_streak
        and ultimo_dia_streak not in usuario["streakDiasAcendidos"]
    ):
        usuario["streakDiasAcendidos"].append(ultimo_dia_streak)

    for dia in usuario["streakDiasAcendidos"]:
        _registrar_contagem_do_dia(usuario, dia, 3)

    return usuario


def registrar_missao_concluida(usuario):
    preparar_progresso_usuario(usuario)

    usuario["missoesConcluidasHoje"] += 1
    hoje = str(date.today())
    _registrar_contagem_do_dia(
        usuario,
        hoje,
        usuario["missoesConcluidasHoje"],
    )

    if (
        usuario["missoesConcluidasHoje"] >= 3
        and usuario.get("ultimoDiaStreak") != hoje
    ):
        usuario["streak"] += 1
        usuario["ultimoDiaStreak"] = hoje

        if hoje not in usuario["streakDiasAcendidos"]:
            usuario["streakDiasAcendidos"].append(hoje)
