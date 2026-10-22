# Entrega local — 21/10/2026

Atualização em 22/10/2026: o usuário configurou Supabase, Render e Vercel e confirmou login e ativação do modo demonstração no site publicado. A API pública respondeu `{"status":"ok"}`. O site está em `https://next-care-plus-gamma.vercel.app` e a API em `https://booscare-api.onrender.com`.

Os fluxos principais do site/backend foram validados. O usuário confirmou o provisionamento de `pulseira-001` e `luminaria-001` e preencheu a configuração local. Uma consulta somente de leitura confirmou que os dois tokens correspondem aos dispositivos, pertencem à mesma conta e usam a geração ativa. Os dois firmwares foram recompilados; os componentes estão com um amigo do usuário, em outro computador Windows, e o Wi-Fi dele já está configurado. O colega gravou a pulseira na COM5 e o usuário confirmou status online e atualização de passos no site. O usuário também confirmou dois toques no BTN1 somando 440 ml e concluindo a missão de água. O usuário confirmou também a conclusão da missão selecionada pelo BTN2, sem repetir pontos no segundo toque. O usuário confirmou que BTN3 cancelou somente a seleção e preservou o progresso. O usuário confirmou o SOS pelo BTN4 e o encerramento do alerta pelo site. A versão anterior passou pelos testes físicos descritos abaixo; a luminária também ficou online e acendeu após trocar a porta USB. O usuário confirmou que cor física, solicitada e aplicada coincidem; SOS levou ao vermelho e o encerramento retornou à cor das metas. Nenhum aparelho foi gravado ou testado pelo agente. O nome mostrado em Connect+ identifica a conta autenticada. A correção de “Conectado em” para “Conta” foi publicada e conferida no JavaScript servido pela Vercel; a API pública continuou respondendo `{"status":"ok"}` após a publicação.

## Configuração Wi-Fi pelo celular — nova entrega em 22/10/2026

Atualização física em andamento: no computador do colega, o pacote novo passou na verificação. A gravação da luminária na COM4 inicialmente falhou antes da escrita por modo de boot incorreto (0x13); após entrada manual com BOOT e EN/RESET, o usuário confirmou conclusão e retorno online. Próximo passo: abrir o portal da pulseira no iPhone e verificar a página local. A validação física do portal ainda não foi concluída.

Retomada após interrupção: o usuário relatou alerta do antivírus envolvendo Zig e reinício do computador. A causa do alerta não foi determinada; Zig não foi restaurado nem executado novamente. Os fontes e as duas imagens compiladas permaneceram salvos; o ZIP final estava vazio e foi recriado. O empacotador agora verifica um arquivo temporário antes de substituir o ZIP final; teste de interrupção confirmou preservação do pacote anterior. Quatro testes da página e quatro do pacote passaram nesta retomada. ZIP final conferido (integridade, hashes, imagens iguais às compilações, somente aplicação e primeira instalação bloqueada), sem Zig, EXE ou DLL. O pacote tem aproximadamente 1,3 MB. Ainda falta gravar esta atualização nas placas e testar no celular.

Implementado nas duas versões do firmware: após cerca de 60 segundos sem resposta válida da API, cada aparelho abre sua rede local protegida por senha. A página em `http://192.168.4.1` lista redes, permite SSID manual/oculto, configura principal ou alternativa, testa Wi-Fi/NTP/HTTPS e salva em NVS somente após validar a API. Senha incorreta, timeout, cancelamento e falha de armazenamento preservam as redes anteriores. O portal encerra cerca de 30 segundos após salvar. As senhas exclusivas ficam no arquivo privado do pacote, sem exibição no chat ou logs.

O gerenciador usa uma tarefa própria para Wi-Fi, HTTP local e DNS, independente do `loop()` de sensores/botões e da tarefa HTTPS. Resultados da API são associados à tentativa de conexão para não validar uma rede nova com resposta atrasada da anterior. A configuração usa um único blob versionado com CRC no namespace `care-wifi`, separado da fila LittleFS. Redes salvas pelo portal prevalecem sobre os valores iniciais de `CareConfig.h`. Não há reset de progresso nem combinação nova de botões.

Verificação local: teste nativo C++ da lógica/CRC/rollback/timeout passou; quatro testes Node executando o script real da página passaram; quatro testes Python do pacote, credenciais locais e proteção de atualização passaram. As duas versões foram compiladas para as mesmas placas e partições. O pacote privado fica em `artifacts/CarePlus-WiFi-Celular-PRIVADO.zip`, com guia, imagens e arquivo `ACESSO-WIFI-PRIVADO.md`. O comando de gravação aceita somente atualização da aplicação, preservando NVS/LittleFS e recusando primeira instalação.

**Ainda não gravado nem testado fisicamente nesta nova versão.** Os testes físicos relatados abaixo são da versão anterior. Após atualizar, conferir página no iPhone, busca AP+STA, senha errada/cancelamento, salvamento/reinício, preservação da outra rede, fila durante configuração, botões/SOS e confirmação da luminária. Pico de memória e comportamento do rádio/TLS precisam de medição nas placas. Alimentação autônoma e caminhada real continuam pendentes.

## Arquivos de entrada

- API: `Care-Plus-Front-Web-main/backend/main.py`, `database.py`, `domain.py`, `manage.py`.
- Esquema: `Care-Plus-Front-Web-main/backend/migrations/001_initial.sql`.
- Publicação: `Care-Plus-Front-Web-main/render.yaml`, `.env.example` do backend e do frontend, `vercel.json` existente.
- Site: `src/services/CareContext.jsx`, cliente central em `api.js`, controles em `components/DeviceControls.jsx` e páginas existentes integradas.
- Pulseira: `Care-Plus-Edge-main/pulseira/pulseira.ino`.
- Luminária: `Care-Plus-Edge-main/led_monitor/led_monitor.ino`.
- Configuração dos aparelhos: `Care-Plus-Edge-main/firmware/include/config.example.h` → `CareConfig.h` local, ignorado pelo Git.
- Compilação: `Care-Plus-Edge-main/platformio.ini`.
- Portal Wi-Fi: `firmware/include/CareWifi.h`, `CareWifiCore.h`, `CareWifiPage.h` e `CareDeviceConfig.h`, dentro do projeto Edge.
- Pacote de atualização privado: `Care-Plus-Edge-main/tools/preparar-pacote-wifi.py`; testes em `Care-Plus-Edge-main/tests`.
- HTTPS: `Care-Plus-Edge-main/firmware/include/ApiRootCA.h`, com seis CAs públicas oficiais. A configuração local separa as credenciais das duas placas, preenchidas pelo usuário. Usuário confirmou ambos os aparelhos online e a correspondência das cores da luminária na rede do colega.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Backend `pytest` | 14 testes passaram, incluindo configuração guiada e caracteres especiais da senha; um aviso de depreciação TestClient/AnyIO, sem falha. Banco SQLite temporário e arquivos de configuração de teste. |
| API HTTP real local | Migração, health, cadastro, sessão demo, provisionamento, ingestão de passos e reenvio idempotente passaram. |
| Frontend `npm run build` | Passou. |
| Frontend `npm run lint` | Passou. |
| Firmware `pulseira` | Recompilado com a configuração local preenchida em 22/10/2026 para `esp32-c3-devkitm-1`: versão com portal: flash 1.053.896 bytes e RAM estática 53.260 bytes; teste físico desta versão ainda pendente. |
| Firmware `luminaria` | Recompilado com a configuração local preenchida em 22/10/2026 para `esp32dev`: versão com portal: flash 1.010.117 bytes e RAM estática 47.768 bytes; teste físico desta versão ainda pendente. |
| CAs dos firmwares | Seis certificados PEM dos repositórios oficiais, com hashes SHA-256 conferidos. A CA local do antivírus não foi incluída. Usuário confirmou comunicação dos dois ESP32 com o backend HTTPS na rede do colega. |
| LittleFS inicial | Imagem construída e incluída na primeira gravação da pulseira pelo colega; usuário confirmou funcionamento dos eventos após a instalação. Usuário confirmou recuperação de um toque pendente após desligar USB e bateria, reconectar pelo USB e restabelecer a rede, sem duplicação após espera. |
| Prévia visual no navegador | Captura de Connect+ enviada pelo usuário conferida. Navegação interativa pelo agente não executada; nenhum navegador habilitado no ambiente. |
| Supabase/Render/Vercel reais | Publicados/configurados pelo usuário. Health da API conferido; usuário confirmou login e demonstração no site publicado. |
| Pacote Windows privado | Preparado em `artifacts/CarePlus-Gravacao-Windows-PRIVADO.zip`. ZIP, hashes, comandos, limites das imagens e preservação da fila nas atualizações conferidos sem hardware. Usuário confirmou instalação da ferramenta e verificação do pacote no Windows do colega, com Python 3.13.7. |
| Gravação e testes físicos | Em 22/10/2026, usuário confirmou primeira gravação da pulseira na COM5 pelo colega, status online no site e passos atualizando ao movimentar. BTN1 confirmado: dois toques somaram 440 ml e concluíram a missão de água. BTN2 confirmado: missão selecionada concluída e pontos não repetidos no segundo toque. BTN3 confirmado: seleção cancelada, missão não concluída e progresso preservado. SOS confirmado: alerta e cor solicitada vermelha, seguido de encerramento pelo site e retorno à cor das metas. Luminária gravada, online e acesa após trocar a porta USB. Cor física, solicitada e aplicada coincidiram; transição para vermelho no SOS e retorno às metas confirmados. Queda de rede com reenvio único do evento e conexão pelo hotspot do iPhone confirmadas pelo usuário. Retorno à rede principal e novo toque de água também confirmados. Reset com evento pendente offline confirmado: evento antigo descartado, água permaneceu em 0 após reconectar e toque novo registrou 220 ml. Contagem preservada após inatividade confirmada: de 67 para 77 após dez passos simulados e sem zerar após 60 segundos parada. Fila após corte de energia confirmada: toque pendente recuperado e enviado uma única vez. Alimentação autônoma por bateria e calibração em caminhada real ainda pendentes, adiadas pelo usuário até verificar a alimentação. |

### Teste físico acompanhado — 22/10/2026

Rede alternativa: após orientar a ativação de Permitir Acesso a Outros e Maximizar Compatibilidade no iPhone, o usuário confirmou que os aparelhos ficaram online e estão funcionando pelo hotspot do celular. Os SSIDs e senhas atuais haviam sido conferidos nos binários do ZIP de ambas as placas, sem exibir credenciais, e a API pública respondeu `{"status":"ok"}` na verificação. Não houve nova gravação. O usuário confirmou depois o retorno ao Wi-Fi principal, com as duas placas online, recuperação/confirmação da cor e um toque de BTN1 acrescentando 220 ml.

O usuário confirmou o teste de queda das duas redes: aparelhos offline, luminária apagada, um toque de água guardado enquanto offline e enviado ao reconectar, acréscimo de 220 ml sem nova alteração após espera, e recuperação/confirmação da cor da luminária. O teste manteve USB e a mesma sessão. Isso valida o cenário relatado de reconexão e reenvio sem duplicação; a persistência após corte completo foi confirmada depois em teste separado. Conexão pelo hotspot e retorno à rede principal foram confirmados em seguida. O usuário confirmou em seguida o reset pelo site com evento de água pendente offline: após reconectar, água permaneceu em 0, luminária confirmou apagada e somente o toque novo registrou 220 ml. Isso valida a invalidação da geração antiga no cenário testado. O usuário informou 67 passos antes, 77 após dez passos simulados e confirmou que o total não zerou após 60 segundos parado. Isso valida a preservação do acumulado nesse intervalo, sem comprovar precisão em caminhada real. O usuário confirmou poder interromper USB e bateria sem alterar soldas e confirmou o teste subsequente: um toque pendente foi recuperado após desligamento completo e enviado uma única vez ao restabelecer a rede, sem novo acréscimo após espera. Sem powerbank disponível, o usuário adiou explicitamente a caminhada real até resolver a alimentação por bateria. Próxima etapa: medir a alimentação com multímetro quando disponível e, após estabilizar a operação autônoma, avaliar passos reais.

Os aparelhos estão com o colega em outro computador Windows; o usuário acompanha o site por chamada. Resultados relatados pelo usuário:

- Pulseira gravada inicialmente na COM5, incluindo LittleFS. Online no site e enviando passos ao movimentar; calibração ainda pendente.
- BTN1: um toque registrou a quantidade esperada; dois toques somaram 440 ml e concluíram a missão de água.
- BTN2: missão selecionada no site concluída com premiação; segundo toque não repetiu pontos.
- BTN3: cancelou somente a seleção, mantendo a missão sem conclusão e preservando progresso e saldo.
- BTN4: SOS recebido, cor solicitada vermelha e encerramento pelo site com retorno à cor das metas.
- Reconectar a pulseira ao USB restabeleceu o status online. Em teste separado, um toque de água pendente offline sobreviveu ao corte de USB e bateria e foi enviado uma única vez após religar pelo USB e restabelecer a rede.
- Luminária gravada na COM4. Após trocar a porta USB do computador, acendeu e apareceu online. O usuário atribuiu a falha anterior à porta USB e pediu desconsiderar os erros anteriores; diagnóstico do monitor serial encerrado. O usuário confirmou em seguida que cor física, solicitada e aplicada coincidem, que SOS acende vermelho e que encerrar o alerta retorna à cor das metas, com confirmação atualizada no site.

BOOT e RESET/RST da pulseira ficaram inacessíveis devido à soldagem. A gravação e os testes online ocorreram sem apertá-los; adaptar futuras instruções a essa restrição. Os quatro botões de função são acessíveis. Na luminária, BOOT e EN/RESET estão acessíveis.

Alimentação por bateria permanece pendente: célula de lítio GZ902540, 3,7 V nominal e 800 mAh, ligada em B+/B− do TP4056; OUT+ chega ao pino 5V da ESP32-C3 e os demais componentes usam o 3V3 da placa. OUT−/GND ainda precisa ser confirmado explicitamente. Sem USB, os componentes ficam acesos, mas a pulseira aparece offline. Não há multímetro disponível hoje; o usuário pode medir amanhã. Hipótese não comprovada: margem insuficiente no regulador ou queda sob carga. Continuar pelo USB até conferir as tensões; nenhum regulador específico da Super Mini foi identificado.

As últimas compilações usaram a configuração privada preenchida pelo usuário. Os binários em `.pio/` contêm credenciais e devem permanecer locais; o diretório e `CareConfig.h` estão ignorados pelo Git. Os números de RAM são estáticos, não medição de pico durante TLS ou gravação da fila. O usuário confirmou que os botões ligam os GPIOs ao GND; `BUTTON_ACTIVE_LOW=true` corresponde a essa montagem.

Os banners originais foram preservados. As cópias WebP usadas pelo site têm largura de 1.280 px no mobile e 1.920 px no desktop, somando aproximadamente 3 MB em vez dos 37 MB anteriores. Paleta, tipografia e classes visuais existentes foram mantidas; conferir apresentação visual no navegador antes da feira.

## Limites e próximos passos

### Validação manual do site publicado — confirmada pelo usuário em 22/10/2026

- Login e ativação do modo demonstração funcionaram com Supabase/Render/Vercel.
- Concluir missão manual concedeu os pontos esperados; conclusão e saldo permaneceram após atualizar. A cor solicitada acompanhou a meta manual, sem confirmação física da luminária.
- Scan concedeu a recompensa diária sem repetir os pontos ao tentar novamente; missão e saldo permaneceram após sair e entrar na conta.
- Cancelar o reset preservou os dados. Confirmar o reset zerou o progresso demonstrativo, preservou cadastro e permaneceu salvo após atualizar a página.
- Uma segunda conta começou zerada; ao retornar à primeira, o saldo e a conclusão dela permaneceram. O progresso das contas ficou separado.
- Selecionar uma missão manual em Connect+ permaneceu salvo após atualizar, sem conceder pontos nem concluir a missão. Cancelar pelo seletor permaneceu salvo e preservou saldo e conclusões anteriores.

Esses resultados foram relatados pelo usuário durante a navegação no site publicado. Nenhum aparelho IoT foi executado, provisionado ou testado fisicamente nessa validação. Os fluxos principais do site foram conferidos; publicar as correções locais pendentes antes de avançar para os aparelhos. Resgates de benefícios e comportamento diário completo têm cobertura de software, mas ainda não foram confirmados manualmente no site publicado.

Os testes locais não comprovam locks ou SSL no PostgreSQL/Supabase, rede da feira, calibração do MPU6050, resposta dos botões ou RGB físico. O roteiro cobre esses pontos. A fila tem 128 registros; saturação e falhas de armazenamento são explícitas, mas precisam de validação em hardware. Não há vibração, NFC, envio de SOS a contatos ou análise facial.

1. Envie o ZIP privado somente ao colega com os aparelhos. Não publique os binários, pois contêm credenciais.
2. No Windows dele, siga o guia do pacote para preparar a ferramenta e identificar a porta da pulseira. Provisionamento e configuração já foram feitos.
3. Faça a primeira instalação da pulseira com LittleFS; depois valide a luminária. Atualizações futuras devem preservar a fila.
4. Execute `TESTES-DEMONSTRACAO.md`, especialmente queda de rede/energia, troca para hotspot e reset com aparelho offline.

