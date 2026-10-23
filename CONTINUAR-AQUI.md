# Continuar o projeto Care Plus

Atualizado em 22/10/2026. Leia este arquivo primeiro; depois consulte RETOMADA-FACULDADE.md, STATUS-IMPLEMENTACAO.md e GUIA-IMPLEMENTACAO.md para historico e arquitetura. O trecho inicial de RETOMADA-FACULDADE.md descreve uma pausa antiga: use o estado abaixo como referencia atual.

## Estado confirmado

- Site: https://next-care-plus-gamma.vercel.app/ ; API: https://booscare-api.onrender.com .
- A pulseira principal ESP32-C3 Super Mini funciona no hotspot, com e sem USB, apos receber a bateria antes usada na reserva. Na ultima gravacao estava na COM19, MAC 8c:d0:b2:a9:5b:d2. Identifique a porta de novo antes de qualquer upload.
- A luminaria funciona no hotspot e no site. Na ultima listagem estava na COM32. Missoes concluiram e a luminaria respondeu.
- A pulseira reserva (ultimo MAC 30:ed:a0:5b:f4:d4, antes COM60) tem o botao cancelar no GPIO20; a principal usa GPIO10. A reserva nao conectou a dois hotspots nem com programa Wi-Fi minimo, que registrou motivo 201 (rede nao encontrada). Alimentacao USB medida em 3,3 V e 5,05 V; sem causa fisica conclusiva. O firmware completo da reserva foi restaurado. Nao assumir que ela esta operacional.
- As duas pulseiras usam a mesma identidade pulseira-001. Manter somente uma ligada por vez. A luminaria pode operar junto com a principal.

## Ultima mudanca e gravacao

- O firmware da pulseira em Care-Plus-Edge-main/pulseira/pulseira.ino gera um pulso de vibracao de 150 ms ao reconhecer cada botao. Ao manter SOS por 1,5 s, registra o evento; enquanto SOS estiver ativo, repete a vibracao a cada 7 s. O estado recebido do backend usa desired.cor=vermelha para manter SOS; apos encerrar no site, a repeticao para na proxima sincronizacao bem-sucedida. Ainda nao houve teste fisico do motor ou do encerramento.
- Care-Plus-Edge-main/platformio.ini habilita CARE_VIBRATION_ENABLED=1 somente em env:pulseira. env:pulseira_reserva mantem o GPIO7 desabilitado e define CARE_CANCEL_PIN=20. Ambos os ambientes compilaram com sucesso.
- A pedido do usuario, o firmware com vibracao habilitada foi gravado apenas na principal (COM19; MAC conferido). O gravador verificou os hashes. O monitor serial indicou que o programa executava; nenhum botao foi acionado durante a verificacao.
- O motor vibracall 1027 de 3 V esta ligado diretamente entre GPIO7 e GND, sem transistor nem diodo. Essa ligacao pode sobrecarregar o GPIO; o usuario foi informado e pediu a ativacao mesmo assim. Se a pulseira reiniciar, cair do Wi-Fi ou aquecer ao vibrar, desligar o motor e corrigir o circuito com driver. Nao afirmar que o teste fisico passou sem retorno do usuario.
- O upload nao apagou a NVS nem a particao LittleFS. Nao repetir uploadfs em atualizacoes comuns.

## Proximos passos com o usuario

1. Confirmar se um toque curto em qualquer botao produz uma vibracao perceptivel e se a pulseira continua online.
2. Segurar SOS por pelo menos 1,5 s; conferir vibracao a cada 7 s e o alerta no site. Encerrar o alerta no site e confirmar que a repeticao para apos sincronizar. Observar se ha reset ou perda de Wi-Fi.
3. A reserva continua como investigacao separada de hardware/antena/energia. Nao gravar firmware nela supondo que seja a COM19.
4. A caminhada real e a calibracao do pedometro ainda nao foram comprovadas.

## Arquivos privados e comandos

Care-Plus-Edge-main/firmware/include/CareConfig.h e ACESSO-WIFI-PRIVADO.md sao locais e ignorados pelo Git. Contem credenciais; nunca copiar seus valores para commits, logs ou respostas. A compilacao em outro computador exige recriar CareConfig.h a partir do arquivo privado local e de config.example.h. .pio, .vscode e compile_commands.json sao gerados/ignorados.

Da raiz do repositorio, para compilar:

~~~powershell
cd Care-Plus-Edge-main
..\.venv-pio\Scripts\pio.exe run -e pulseira -e pulseira_reserva
~~~

Antes de gravar, listar as portas e conferir a identidade da placa. Para a principal, quando a porta correta estiver confirmada:

~~~powershell
..\.venv-pio\Scripts\pio.exe run -e pulseira -t upload --upload-port COM19
~~~

COM19 e apenas a ultima porta observada, nao uma garantia futura. Nao enviar env:pulseira_reserva para a principal.
