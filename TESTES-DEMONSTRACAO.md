# Validação e roteiro físico

## Testes de software

Na raiz:

```powershell
.\.venv\Scripts\python -m pytest Care-Plus-Front-Web-main/backend/tests -q
cd Care-Plus-Front-Web-main/Front-web
npm run build
npm run lint
```

A suíte cobre ingestão sem navegador, duplicação de lote, pontos concorrentes, missão inexistente com pontos forjados, Scan concorrente, seleção antiga, cancelamento, SOS, confirmação da luminária, reset com fila antiga, preservação do histórico normal, saldo versus total ganho e isolamento de contas. Por padrão usa SQLite descartável em diretório de teste; isso não comprova conectividade com Supabase nem substitui a validação de locks no PostgreSQL de destino.

## Testes locais do portal Wi-Fi

Na raiz, execute os testes da página e do pacote privado:

```powershell
node --test Care-Plus-Edge-main/tests/wifi_page_test.mjs
.\.venv-pio\Scripts\python -m unittest discover -s Care-Plus-Edge-main/tests -p test_wifi_package.py -v
```

O teste nativo `Care-Plus-Edge-main/tests/wifi_core_test.cpp` usa o mesmo cabeçalho `CareWifiCore.h` do firmware e foi executado com sucesso na validação anterior. O compilador de testes Zig 0.13.0 havia sido obtido de ziglang.org, com SHA-256 conferido; posteriormente o usuário relatou alerta do antivírus envolvendo `zig.exe` e reinício do computador. A causa do alerta não foi determinada. Na retomada, esse executável não foi restaurado, baixado nem executado novamente. Ele não é necessário para usar, configurar ou gravar os aparelhos e não integra o ZIP de atualização. Para uma nova execução desse teste nativo, utilize um compilador C++11 ou posterior aprovado no ambiente, incluindo `Care-Plus-Edge-main/firmware/include`.

Cobertura: limites de SSID/senha, rede aberta explícita, CRC/versão/corrupção do blob, recuperação dos dados, timeout com rollover de relógio, cancelamento, resultado de conexão antiga, falha de armazenamento, preservação da outra rede, salvamento único, CSRF nas requisições da página, SSIDs contendo HTML renderizados como texto, validação do pacote e atualização restrita à aplicação. Os testes locais não simulam rádio, DHCP ou gravação física da NVS.

## Preparação da apresentação

Configure banco, API, site e firmwares pelo guia. Abra `/health` para aquecer a API, faça login na conta de demonstração e confirme que pulseira/luminária aparecem online, sem sincronização pendente. A luminária começa apagada. Confira botões ligados ao GND e RGB antes de gravar as opções de polaridade.

## Roteiro com os aparelhos

| Teste | Resultado esperado |
| --- | --- |
| Andar e parar por mais de 30 s | Passos aumentam e não caem quando a janela de inatividade termina. Calibrar com contagem manual. |
| Segurar BTN1 por 5 s | Uma confirmação de 220 ml. Soltar e apertar de novo acrescenta outra. |
| Selecionar missão no site, aguardar sincronização e apertar BTN2 | Missão conclui uma vez e seus pontos aparecem. Repetir não dá bônus. |
| Selecionar outra missão e apertar BTN3 | Seleção limpa; passos, água, pontos e conclusão anterior permanecem. |
| Completar uma, duas e três metas | Solicitada amarela, azul e verde respectivamente; aplicada confirma a mesma cor. |
| Segurar BTN4 por 1,5 s e continuar segurando | Um SOS, vermelho solicitado/confirmado, alerta no site. Encerrar no site restaura cor do progresso. |
| Fechar o navegador, caminhar/beber água e reabrir | Progresso avança sem o site e reaparece salvo. |
| Desligar internet e registrar atividades | Sensor/botões continuam; monitor informa fila. Após retorno, processa sem duplicação. |
| Reiniciar pulseira antes de enviar a fila | Recupera eventos persistidos com mesmos IDs, preserva progresso já confirmado. |
| Testar principal e hotspot separadamente | Rede alternativa funciona mesmo quando Wi-Fi associa, mas a API fica inacessível. |
| Desligar luminária ou interromper API | Site deixa de mostrar confirmação recente; luminária apaga depois de 15 s sem resposta. |
| Reiniciar demonstração com pulseira offline | Site pede confirmação; zera estado e informa sincronização pendente. Fila antiga é invalidada ao retornar. |
| Repetir confirmação de reset por clique duplo/requisição antiga | Só uma geração é criada para aquela confirmação; a tentativa antiga recebe conflito. |
| Criar outra conta | Não recebe passos/água/SOS da conta com os aparelhos. |
| Abrir Scan duas vezes/em dois navegadores | No máximo 20 troféus por dia/sessão. Mostra recompensa persistida. |
| Resgatar benefício duas vezes | Débito único; total histórico não diminui. Benefício é demonstrativo. |
| Sair da demonstração | Progresso do modo diário reaparece intacto. |

Registre horário do gesto, horário de atualização no site e da confirmação da luminária para medir atraso. Compare com a última comunicação do aparelho, não apenas com o horário da consulta do navegador.

## Portal Wi-Fi — testes físicos após a atualização

Os testes anteriores com o usuário foram feitos antes desta versão do gerenciador de rede. Após atualizar, repetir água, seleção/cancelamento, SOS, cor confirmada, fallback e fila para conferir regressões.

| Teste | Resultado esperado |
| --- | --- |
| Atualizar uma placa preservando a instalação existente | Inicializa nas redes atuais; progresso/fila permanecem. Nenhum `uploadfs` ou apagamento total. |
| Deixar as duas redes conhecidas indisponíveis por cerca de 60 s | Surge a rede CarePlus do aparelho; acesso exige a senha privada. Não requer apertar botões físicos. |
| Conectar o celular à rede local e abrir http://192.168.4.1 | Página funciona sem internet, busca redes de 2,4 GHz e aceita SSID digitado/rede oculta. |
| Informar senha errada ou rede sem acesso à API | Após timeout, erro legível; redes anteriores não são substituídas. É possível corrigir e tentar novamente. |
| Cancelar uma tentativa de conexão | Retoma redes anteriores, sem alterar a fila ou progresso. |
| Salvar rede principal válida | Confirma a API e salva; alternativa fica preservada. Portal encerra após cerca de 30 s. |
| Desligar completamente e religar após salvar | Credenciais do portal são recuperadas da NVS e o aparelho reconecta sem recompilar. |
| Salvar alternativa e desligar principal | Alternativa salva funciona; religar principal e desligar alternativa restaura conexão. |
| Apertar BTN1 durante busca/configuração e reconectar | Sensor/botões continuam; toque chega uma vez e permanece após reinício. |
| Abrir o IP da placa pela rede principal em outro aparelho | Página/API de configuração não ficam acessíveis por essa interface. |
| Requisição local de alteração sem nonce válido ou com origem diferente | HTTP 403; configuração preservada. |
| Interromper energia durante salvamento NVS | Ao religar, recupera configuração válida anterior ou nova, sem apagar fila/progresso; repetir conexão e comparar com resultado do commit. |

Não registre senhas/tokens no relatório compartilhado. Use o arquivo privado de acesso do pacote para cada placa. Rede Wi-Fi com portal de login/autenticação empresarial permanece fora do suporte atual.

## Diagnóstico rápido

- **API sem atualização:** confira `/health`, URL da API, CORS e disponibilidade do banco. Durante retomada do Render a fila permanece no aparelho.
- **Pulseira offline:** confira serial 115200, rede 2,4 GHz, tokens, URL HTTPS, relógio NTP e CA. Associação Wi-Fi não comprova acesso à API.
- **Portal Wi-Fi não aparece:** aguarde 60 s sem resposta válida da API e confira se uma das redes antigas/hotspot ainda está funcionando. Se o aparelho consegue acessar a API, ele não precisa abrir o portal. Consulte a rede e senha no arquivo privado e mantenha alimentação estável.
- **Mudança no CareConfig.h não trocou a rede:** uma configuração já salva no portal prevalece em NVS. Altere a rede pelo celular novamente.
- **Página perde conexão ao testar rede:** AP e STA compartilham o rádio/canal; reconecte à mesma rede CarePlus e reabra o endereço. Se a rede foi salva, o portal fecha após cerca de 30 s e o estado deve aparecer no site.
- **LittleFS indisponível na primeira instalação:** use uploadfs antes de registrar atividade. Em instalação existente, preserve a memória e investigue; não formate para corrigir um erro genérico.
- **Fila cheia:** restaure acesso à API. O diagnóstico registra que houve saturação; novos eventos não salvos são informados no serial.
- **HTTP 401 no aparelho:** ID/token não correspondem ao provisionamento.
- **HTTP 409 no aparelho:** ID foi reutilizado com conteúdo diferente; preserve a fila para diagnóstico. Não edite manualmente os IDs.
- **Missão não confirma:** espere sincronização; verifique `no_selection`, `selection_changed` ou `selection_expired` no monitor.
- **Cor solicitada sem aplicada:** verifique a luminária, polaridade RGB e rede; não interprete estado desejado como confirmação física.
- **Passos excessivos/insuficientes:** ajuste `STEP_TRIGGER`, `STEP_REARM` e `STEP_MIN_MS` com teste de caminhada real.

Compilar não comprova ligação elétrica, calibração, vida útil do armazenamento, conectividade da feira ou funcionamento ponta a ponta. Esses testes físicos permanecem obrigatórios antes da apresentação de 24/10/2026.
