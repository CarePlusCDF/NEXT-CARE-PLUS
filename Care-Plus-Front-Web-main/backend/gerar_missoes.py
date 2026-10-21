import random
from progresso import preparar_progresso_usuario, registrar_missao_concluida
from storage import carregar_usuarios, salvar_usuarios


def gerar_missoes(carteirinha):

    usuarios = carregar_usuarios()

    usuario = usuarios.get(carteirinha)

    if not usuario:
        return []
    
    if "missoesAtivas" in usuario and usuario["missoesAtivas"]:
        return usuario["missoesAtivas"]

    missoes = []

    atividade = usuario["atividadeFisica"]
    sentado = usuario["tempoSentado"]
    distancia = usuario["distanciaDia"]
    agua = usuario["agua"]
    sono = usuario["sono"]
    celular = usuario["celular"]
    pausas = usuario["pausas"]
    cafeina = usuario["cafeina"]
    ar_livre = usuario["arLivre"]
    refeicoes = usuario["refeicoes"]

    # atividade física
    if atividade == "0":
        missoes.append({
            "titulo": "Comece com 1 dia de atividade física essa semana",
            "trofeus": 50
        })

    elif atividade == "1_2":
        missoes.append({
            "titulo": "Aumente para 3 dias de atividade física",
            "trofeus": 40
        })

    else:
        missoes.append({
            "titulo": "Mantenha sua rotina ativa hoje",
            "trofeus": 30
        })

    # tempo sentado
    if sentado == "mais_8h":
        missoes.append({
            "titulo": "Levante e caminhe 5 minutos agora",
            "trofeus": 40
        })

    elif sentado == "5_8h":
        missoes.append({
            "titulo": "Faça uma pausa para alongamento",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Continue se movimentando ao longo do dia",
            "trofeus": 20
        })

    # distância
    if distancia == "menos_1":
        missoes.append({
            "titulo": "Caminhe pelo menos 1 km hoje",
            "trofeus": 40
        })

    elif distancia == "1_3":
        missoes.append({
            "titulo": "Tente alcançar 3 km hoje",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Excelente nível de movimento hoje",
            "trofeus": 20
        })

    # água
    if agua == "menos_1":
        missoes.append({
            "titulo": "Beba pelo menos 2 L de água hoje",
            "trofeus": 40
        })

    elif agua == "1_2":
        missoes.append({
            "titulo": "Tente atingir 3 L de água hoje",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Continue se hidratando bem",
            "trofeus": 20
        })

    # sono
    if sono == "menos_5":
        missoes.append({
            "titulo": "Durma pelo menos 7h hoje",
            "trofeus": 50
        })

    elif sono == "5_7":
        missoes.append({
            "titulo": "Tente dormir mais",
            "trofeus": 40
        })

    else:
        missoes.append({
            "titulo": "Excelente rotina de descanso",
            "trofeus": 20
        })

    # celular
    if celular == "mais_8":
        missoes.append({
            "titulo": "Reduza 1h de tela hoje",
            "trofeus": 50
        })

    elif celular == "5_8":
        missoes.append({
            "titulo": "Tente diminuir o tempo de tela",
            "trofeus": 40
        })

    else:
        missoes.append({
            "titulo": "Ótimo controle de tela",
            "trofeus": 20
        })

    # pausas
    if pausas == "0":
        missoes.append({
            "titulo": "Faça uma pausa agora",
            "trofeus": 40
        })

    elif pausas == "1_3":
        missoes.append({
            "titulo": "Aumente suas pausas durante o dia",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Continue fazendo pausas regulares",
            "trofeus": 20
        })

    # cafeína
    if cafeina == "mais_5":
        missoes.append({
            "titulo": "Reduza o consumo de cafeína hoje",
            "trofeus": 40
        })

    elif cafeina == "3_5":
        missoes.append({
            "titulo": "Tente diminuir um pouco a cafeína",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Bom controle de cafeína",
            "trofeus": 20
        })

    # ar livre
    if ar_livre == "0_15":
        missoes.append({
            "titulo": "Passe pelo menos 15 min ao ar livre",
            "trofeus": 40
        })

    elif ar_livre == "15_30":
        missoes.append({
            "titulo": "Tente passar 30 min fora hoje",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Excelente contato com ambiente externo",
            "trofeus": 20
        })

    # refeições
    if refeicoes == "1_2":
        missoes.append({
            "titulo": "Faça pelo menos 3 refeições hoje",
            "trofeus": 40
        })

    elif refeicoes == "3":
        missoes.append({
            "titulo": "Mantenha alimentação equilibrada",
            "trofeus": 30
        })

    else:
        missoes.append({
            "titulo": "Continue equilibrando sua alimentação",
            "trofeus": 20
        })

    missoes_sorteadas = random.sample(
    missoes,
    min(3, len(missoes))
)

    for index, missao in enumerate(missoes_sorteadas):

        missao["id"] = index + 1
        missao["concluida"] = False

    usuario["missoesAtivas"] = missoes_sorteadas

    salvar_usuarios(usuarios)

    return missoes_sorteadas

def concluir_missao(carteirinha, id_missao):

    usuarios = carregar_usuarios()

    usuario = usuarios[carteirinha]
    usuario.setdefault("trofeus", 0)
    usuario.setdefault("trofeusAcumulados", usuario.get("trofeus", 0))
    preparar_progresso_usuario(usuario)

    missoes = usuario["missoesAtivas"]

    novas_missoes = []

    for missao in missoes:

        if missao["id"] == id_missao:

            usuario["trofeus"] += missao["trofeus"]
            usuario["trofeusAcumulados"] += missao["trofeus"]
            registrar_missao_concluida(usuario)

        else:

            novas_missoes.append(missao)




    usuario["missoesAtivas"] = novas_missoes

    salvar_usuarios(usuarios)
    if len(usuario["missoesAtivas"]) == 0:

        return gerar_missoes(carteirinha)

    return usuario["missoesAtivas"]

