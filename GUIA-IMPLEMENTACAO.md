# Instalação e decisões da implementação

## O que foi implementado

A API recebe atividades diretamente da pulseira e atualiza progresso, conclusões e pontos dentro da mesma transação PostgreSQL. Fechar o site não interrompe a evolução. A luminária consulta a cor desejada e confirma a revisão que aplicou; o site compartilha uma consulta de estado a cada 2,5 segundos, sem recarregar páginas e sem sobrepor consultas. O ranking consulta o banco separadamente nesse intervalo.

O bloqueio `SELECT FOR UPDATE` da conta serializa ingestão, conclusão, resgate e reset, inclusive entre processos da API. Uma chave única por dispositivo/evento evita recontagem. Um lançamento único no extrato impede duplicação de pontos. Saldo disponível e total ganho são separados; resgate só reduz saldo. O SQLite é uma opção explícita para desenvolvimento, nunca o banco do Render.

O login agora pede carteirinha e senha de pelo menos oito caracteres. Senhas usam scrypt; sessões duram sete dias e apenas seus hashes são persistidos. Os aparelhos usam credenciais independentes, vinculadas a uma única conta. Alterar a carteirinha no corpo de uma requisição não dá acesso a outra conta. A conta não é vinculada via NFC.

## Regras escolhidas

São padrões de implementação configuráveis, não decisões anteriores atribuídas ao usuário:

| Meta | Diário | Demonstração |
| --- | --- | --- |
| Passos | 5.000 | 20 |
| Água | 3.000 ml | 440 ml |
| Missões manuais | 1 | 1 |
| Água por BTN1 | 220 ml | 220 ml |

Nenhuma meta concluída: apagada; uma: amarela; duas: azul; três: verde. Os dois objetivos automáticos valem 50 troféus cada. A meta manual usa os pontos da missão escolhida, sem bônus duplicado. A antiga meta de média diária foi substituída pela meta manual para compor três objetivos independentes; a média continua visível como indicador.

As missões de hábitos preservam as regras do catálogo original. Cada conta recebe três personalizadas e três gerais por dia, com IDs estáveis. Concluídas não são regeneradas no mesmo dia. BTN2 conclui a missão selecionada; não deve ser usado antes de a pulseira receber a seleção. BTN3 cancela apenas essa seleção. Tokens de seleção impedem que um aperto offline confirme outra missão escolhida depois. Sem seleção, a API registra `no_selection`; seleção trocada gera `selection_changed`; ambos são resultados finais, sem pontos.

BTN4 requer 1,5 segundo pressionado. SOS fica vermelho até “Encerrar alerta SOS” no site. É um alerta interno do protótipo, sem envio a contatos. Soltar e apertar novamente é necessário para qualquer botão repetir. A hipótese inicial é botão conectado ao GND com pull-up interno; `BUTTON_ACTIVE_LOW` permite adequar a montagem. Confira a ligação real. RGB usa cátodo comum por padrão; ajuste `RGB_COMMON_ANODE` se necessário.

O dia é definido em `America/Sao_Paulo`. Eventos offline com relógio válido entram no dia de captura; sem relógio, entram no dia de recebimento. A API retorna horários Unix em UTC e datas do dia brasileiro. As conquistas são calculadas com atividade persistida: primeiro passo, meta de passos, meta de água e três metas no mesmo dia. O ranking usa total ganho no modo ativo; diário e demonstração não se misturam. Participantes têm ID público opaco e apenas primeiro nome.

O Scan é uma interação demonstrativa: concede 20 troféus uma vez por dia e sessão, verificados no servidor. Não usa câmera, análise facial, escudos ou multiplicadores. Benefícios do catálogo são resgates internos demonstrativos; não emitem vouchers de parceiros. Notícias e serviços sem integração estão identificados como ilustrativos.

## 1. Executar localmente

Na pasta raiz, PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\python -m pip install -r Care-Plus-Front-Web-main/backend/requirements-dev.txt
cd Care-Plus-Front-Web-main/backend
$env:DATABASE_URL = 'sqlite:///care-local.db'
..\..\.venv\Scripts\python manage.py migrate
..\..\.venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Outro terminal, na raiz:

```powershell
cd Care-Plus-Front-Web-main/Front-web
npm ci
npm run dev
```

Abra `http://localhost:5173`, crie uma conta e abra Connect+. Não use dados pessoais reais para a demonstração. No desenvolvimento a API usa `http://localhost:8000`; na publicação `VITE_API_URL` é obrigatório. Em produção nenhum fallback aponta para o computador de quem abriu o site.

O arquivo `backend/.env.example` contém os parâmetros. Se criar `backend/.env`, copie os exemplos e substitua os valores. As variáveis de ambiente do processo prevalecem. Não apague `care-local.db` para demonstrar reset: use o site.

## 2. Supabase

Crie um único projeto e copie a conexão PostgreSQL em **Connect → Session pooler**, compatível com IPv4. Configure `DATABASE_URL` no backend. A aplicação usa SQLAlchemy + psycopg diretamente, sem chave de serviço no navegador ou firmware. Escape caracteres especiais da senha na URL.

Para configurar localmente sem escapar a senha à mão, pare a API com `Ctrl+C` e, na pasta `backend`, execute:

```powershell
..\..\.venv\Scripts\python manage.py configure-database
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
..\..\.venv\Scripts\python manage.py migrate
```

O primeiro comando pede a URI do Session pooler (pode conter `[YOUR-PASSWORD]`) e depois a senha do banco. As duas entradas ficam ocultas ao colar/digitar. Ele cria/atualiza apenas `DATABASE_URL` em `backend/.env`, codifica a senha e exige SSL. Não envie a senha no chat. O `Remove-Item Env:DATABASE_URL` limpa a variável temporária do PowerShell usada no teste com SQLite, para que o próximo comando use o `.env`. A migração deve mostrar `Esquema atualizado.`; depois reinicie o Uvicorn. Os dados anteriores do SQLite não são importados automaticamente para o projeto Supabase.

Exemplo de formato, com valores fictícios:

```text
postgresql+psycopg://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:5432/postgres?sslmode=require
```

`sslmode=require` cifra a conexão. Para validar também identidade/cadeia do banco, baixe a CA na configuração de SSL do Supabase e use `sslmode=verify-full&sslrootcert=/caminho/ca.pem`, disponibilizando esse arquivo no ambiente do backend. O segredo `DATABASE_URL` fica somente no Render.

Execute `python manage.py migrate` contra esse banco. O bootstrap é idempotente, não apaga tabelas existentes. A versão SQL equivalente está em `backend/migrations/001_initial.sql`; execute apenas um dos caminhos. As tabelas `care_*` têm RLS habilitado e acesso revogado para `anon` e `authenticated`; este projeto não usa Supabase Auth ou acesso direto pelo cliente. A conexão da API precisa ser o proprietário das tabelas. Uma role mais restrita exigiria políticas próprias, não configuradas aqui.

O estado de cada sessão guarda dias, missões, conquistas derivadas e resgates em JSON transacional. Contas, dispositivos, sessões de login, sessões de progresso, eventos e extrato de pontos são tabelas separadas. Todos os dados mutáveis ficam no PostgreSQL. Os JSONs `beneficios.json` e `missoesGerais.json` são catálogos, não arquivos de persistência de usuários.

Referências oficiais consultadas: [conexão PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres), [SSL](https://supabase.com/docs/guides/platform/ssl-enforcement), [RLS e checklist](https://supabase.com/docs/guides/deployment/going-into-prod).

## 3. Render e Vercel

Se publicar o repositório Front-Web separadamente, o `render.yaml` já considera `backend` como raiz. Se publicar a pasta Care-Plus inteira como monorepo, altere `rootDir` para `Care-Plus-Front-Web-main/backend` e selecione esse Blueprint. Não há requisito de FIWARE, MQTT, Docker Compose ou NFC.

Render:

1. Crie um Web Service Python ligado ao repositório.
2. Root Directory: `backend` (ou o caminho completo do monorepo acima).
3. Build: `pip install -r requirements.txt`.
4. Start: `python manage.py migrate && uvicorn main:app --host 0.0.0.0 --port $PORT`.
5. Preencha `DATABASE_URL` e `CORS_ORIGINS`, com a origem exata do site, sem barra final. Várias origens são separadas por vírgula.
6. Verifique a URL HTTPS `/health` e `/docs`.

Vercel:

1. Importe o projeto e escolha `Front-web` como raiz (ou `Care-Plus-Front-Web-main/Front-web` no monorepo).
2. Framework: Vite; build `npm run build`; saída `dist`.
3. Configure `VITE_API_URL=https://SUA-API.onrender.com` antes do build.
4. Publique e inclua a URL final em `CORS_ORIGINS` do Render. Mudanças em `VITE_API_URL` exigem novo build.
5. Teste login e recarga direta de `/connect`; o `vercel.json` preserva as rotas React.

O Render gratuito suspende serviços após 15 minutos sem tráfego e a retomada pode levar cerca de um minuto; o sistema de arquivos é efêmero. Esses comportamentos constam na [documentação do Render](https://render.com/docs/free). Abra `/health` e o site antes da apresentação e verifique a disponibilidade do projeto Supabase no painel. Não dependa de arquivo SQLite no serviço publicado. Veja também [FastAPI no Render](https://render.com/docs/deploy-fastapi) e [Vite na Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## 4. Provisionar os aparelhos

Depois de criar a conta pelo site, execute no ambiente configurado para o mesmo banco:

```powershell
python manage.py device --account 123456 --id pulseira-001 --kind band
python manage.py device --account 123456 --id luminaria-001 --kind lamp
```

Cada comando mostra uma credencial exclusiva e `initial_generation`. Guarde esses valores no `CareConfig.h` local. Uma conta aceita uma pulseira e uma luminária. O comando recusa sobrescrever associação ou ID existente. Não use senha da conta nem credencial do Supabase nos aparelhos.

Use `Care-Plus-Edge-main/firmware/include/CareConfig.h`, já preparado localmente com a URL pública da API e valores de exemplo. Em outra cópia do projeto, crie esse arquivo copiando `config.example.h`. Preencha as duas redes e suas senhas. No bloco `CONFIG_IDF_TARGET_ESP32C3`, preencha o token e a geração inicial da pulseira; no bloco `else`, os da luminária. A compilação seleciona automaticamente os IDs e as credenciais corretos para cada placa. Ajuste polaridade dos botões/RGB à montagem. O arquivo privado é ignorado pelo Git.

O arquivo público `ApiRootCA.h`, incluído pela configuração, fornece `ROOT_CA` com seis raízes de confiança: Google Trust Services R1–R4 e ISRG X1/X2. Foram obtidas dos repositórios oficiais [Google Trust Services](https://pki.goog/roots.pem) e [Let's Encrypt](https://letsencrypt.org/certificates/); as impressões SHA-256 estão no cabeçalho. O código usa `setCACert` e mantém validação de certificado, hostname e horário. O aparelho precisa de horário NTP válido para TLS. A conexão real e a compatibilidade da cadeia do domínio publicado precisam ser confirmadas na rede dos ESP32. A inspeção TLS deste computador mostrou uma cadeia intermediada pelo Norton; essa CA local não foi incluída no firmware. Se a cadeia pública mudar para uma CA fora do conjunto, obtenha a raiz adequada da autoridade oficial e atualize o cabeçalho. O guia oficial da [Espressif](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html) descreve as APIs Wi-Fi usadas.

## 5. Compilar e gravar

O projeto PlatformIO fixa Arduino-ESP32 2.0.17 via plataforma espressif32 6.12.0 e bibliotecas ArduinoJson, Adafruit MPU6050/Unified Sensor. Use ambiente separado para PlatformIO, pois suas dependências Python diferem das da API:

```powershell
python -m venv .venv-pio
.\.venv-pio\Scripts\python -m pip install platformio==6.1.18
cd Care-Plus-Edge-main
..\.venv-pio\Scripts\python -m platformio run -e pulseira
..\.venv-pio\Scripts\python -m platformio run -e luminaria
```

Para gravação, adicione `-t upload --upload-port COMx` ao ambiente correspondente. Não foi feita gravação automática. Pulseira: ESP32-C3 Super Mini, alvo `esp32-c3-devkitm-1`, USB CDC ligado; luminária: ESP32 Dev Module, alvo `esp32dev`. Confirme a porta na sua máquina.

**Somente na primeira instalação** da pulseira, antes de registrar atividade, crie o filesystem LittleFS com `platformio run -e pulseira -t uploadfs --upload-port COMx`. O firmware não formata automaticamente. Não repita uploadfs ao atualizar firmware: ele substitui a fila persistida. Monitor: `platformio device monitor --port COMx --baud 115200`.

Também é possível abrir os `.ino` na IDE Arduino com essas bibliotecas e o suporte ESP32 instalado; mantenha a estrutura `firmware/include` e a configuração local. PlatformIO é o caminho reproduzível usado para a compilação.

Pinagem ativa:

- Pulseira: MPU6050 SDA1/SCL3, 100 kHz, endereço 0x68; água5, confirmar4, cancelar10, SOS21.
- GPIO10 só é entrada do BTN3. Nenhum LED é acionado nele. GPIO7 permanece sem configuração/acionamento; não há servo.
- Luminária: vermelho25, verde26, azul27.

### Gravação pelo colega em outro computador Windows

Os aparelhos estão com um colega e o Wi-Fi dele já foi configurado. O pacote local `artifacts/CarePlus-Gravacao-Windows-PRIVADO.zip` contém os firmwares compilados e um `LEIA-ME.md` com os comandos. Envie somente esse ZIP em canal privado. Os binários contêm credenciais e estão ignorados pelo Git. Não é necessário enviar `.env` ou a senha do banco.

No Windows do colega, extraia o ZIP, prepare Python/esptool e identifique a porta USB nesse computador. Grave primeiro a pulseira e confira sua comunicação no site. A primeira instalação inclui LittleFS vazio; a atualização grava só a aplicação. Não repita a inicialização quando já houver eventos pendentes. Alterações posteriores de Wi-Fi, tokens ou firmware exigem recompilar e gerar um pacote novo.

### Configurar o Wi-Fi pelo celular — novo firmware

O firmware agora inclui uma página local em cada aparelho. É necessário atualizar as duas placas uma vez com o pacote **`artifacts/CarePlus-WiFi-Celular-PRIVADO.zip`**. A versão anterior já testada nas placas não tem essa página. A nova versão foi compilada e teve testes locais; ainda deve ser validada fisicamente após gravar.

O pacote contém `LEIA-ME.md`, `gravar.py` e **`ACESSO-WIFI-PRIVADO.md`**, com os nomes e as senhas exclusivas das redes de configuração. Compartilhe somente com o responsável pelos aparelhos. Essas senhas não são os tokens da API. Nunca publique o ZIP ou o arquivo de acesso.

No Windows do colega, extraia o ZIP em uma pasta nova e siga o `LEIA-ME.md`. A gravação é somente da aplicação, sem primeira instalação. O pacote rejeita `--primeira-instalacao` e não contém LittleFS ou imagens de apagamento. Nas portas de exemplo já usadas:

```powershell
py -m venv .venv-flash
.\.venv-flash\Scripts\python -m pip install -r requirements.txt
.\.venv-flash\Scripts\python gravar.py --verificar
.\.venv-flash\Scripts\python gravar.py --listar
.\.venv-flash\Scripts\python gravar.py --placa pulseira --porta COM5
.\.venv-flash\Scripts\python gravar.py --placa luminaria --porta COM4
```

Confira as COM antes de executar. Grave uma placa por vez e confira que voltou a funcionar nas redes atuais antes de iniciar o teste do portal.

Para cadastrar a rede da feira:

1. Mantenha o aparelho alimentado. Deixe indisponíveis as duas redes conhecidas, inclusive o hotspot salvo. Após cerca de **60 segundos sem comunicação válida com a API**, surge a rede `CarePlus-...` correspondente ao aparelho.
2. No celular, conecte à rede do aparelho usando a senha do arquivo privado. Mantenha a conexão mesmo com o aviso de rede sem internet.
3. Abra **http://192.168.4.1** em Safari/Chrome. Se a tela automática do celular não funcionar, use o navegador e esse endereço explícito.
4. Escolha **Rede principal** ou **Rede alternativa / celular**. Busque redes próximas ou digite o SSID, inclusive de rede oculta, e informe a senha. São aceitas redes de 2,4 GHz com senha comum; rede aberta precisa ser marcada explicitamente.
5. Toque em **Salvar e testar conexão**. Em até 60 segundos o aparelho tenta Wi-Fi, horário NTP e acesso autenticado à API HTTPS. A rede é salva em NVS somente após resposta válida e commit de armazenamento. Se falhar ou cancelar, as redes anteriores são preservadas. Abra a API/site antes para despertar o Render, se necessário.
6. Aguarde **Rede salva e comunicação com a API confirmada**. Volte à conexão habitual do celular e confira o site. A rede de configuração encerra cerca de 30 segundos após o salvamento. Se houver interrupção durante troca de canal, reconecte à mesma rede CarePlus e reabra a página.
7. Repita no outro aparelho. Pulseira e luminária têm configurações e senhas locais independentes.

As redes salvas no portal sobrevivem a reinício e atualização normal e **prevalecem sobre os valores de `CareConfig.h`**. Cada salvamento altera apenas a posição escolhida. Para trocar essas redes depois, abra o portal novamente; editar o cabeçalho não substitui a configuração NVS já salva. O progresso, tokens, fila persistida e reset exclusivo pelo site permanecem separados da configuração de rede.

A página e a busca de redes rodam em uma tarefa separada da leitura dos sensores/botões e da comunicação HTTPS. Não há combinação de botões de função nem necessidade de BOOT/RST para abrir a configuração. O HTTP local só é aceito pela rede de configuração, com proteção contra requisições de outra origem; a senha Wi-Fi digitada não é devolvida nas respostas ou logs. O acesso ao backend continua HTTPS com validação de CA.

Para gerar outro pacote depois de modificar e recompilar o firmware, partindo da raiz:

```powershell
.\.venv-pio\Scripts\python -m platformio run -d Care-Plus-Edge-main -e pulseira -e luminaria
.\.venv-pio\Scripts\python Care-Plus-Edge-main/tools/preparar-pacote-wifi.py
```

O gerador confere a presença do portal nos binários, configuração compilada, tamanho e tabela de partições. Ele cria o ZIP privado e as senhas locais em `artifacts/`, sem acessar placas ou imprimir credenciais. A NVS usa o namespace `care-wifi` e um blob versionado com CRC, separado de LittleFS. Referências: [Preferences/NVS](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/preferences.html) e [modos Wi-Fi STA/AP](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html). A conexão real AP+STA, o navegador do celular e o consumo de memória sob TLS exigem teste nas placas.

### Trocar o Wi-Fi pelo código — alternativa antes de salvar redes no portal

**Após configurar pelo celular, use o portal para novas trocas:** os valores salvos em NVS prevalecem sobre o cabeçalho. O procedimento abaixo altera os valores iniciais compilados, usados quando não há configuração NVS válida.

Leve o computador com o projeto completo, `CareConfig.h` privado e o ambiente `.venv-pio` já preparado, além dos cabos USB de dados. O computador que tem apenas o ZIP de gravação não tem o projeto/ferramentas de compilação; o ZIP antigo continua contendo as redes antigas.

Ao receber as credenciais, em `firmware/include/CareConfig.h`, troque somente a primeira entrada de `WIFI_SSIDS` pelo nome da rede e a primeira de `WIFI_PASSWORDS` pela senha. Preserve a segunda rede do hotspot já testado e as credenciais dos dispositivos. Salve o arquivo.

No PowerShell, partindo da raiz Care-Plus:

```powershell
cd Care-Plus-Edge-main
..\.venv-pio\Scripts\python -m platformio device list
```

Conecte e identifique cada placa. Os exemplos abaixo usam as últimas portas relatadas; substitua conforme a listagem do computador usado. Execute um comando por vez e confira o sucesso. Cada comando recompila e grava a respectiva placa:

```powershell
..\.venv-pio\Scripts\python -m platformio run -e pulseira -t upload --upload-port COM5
..\.venv-pio\Scripts\python -m platformio run -e luminaria -t upload --upload-port COM4
```

Essa atualização mantém a tabela de partições atual e não grava LittleFS. Não execute `uploadfs` ou apagamento total: a fila já está instalada. Feche os monitores seriais antes de gravar. Na pulseira, BOOT/RST estão inacessíveis; a gravação inicial funcionou por controle automático. Se falhar, interrompa o procedimento e use o hotspot já testado até diagnosticar; não improvise contato em pontos soldados.

Depois de cada gravação, confira status online, a cor solicitada/aplicada da luminária e um único toque de água com acréscimo de 220 ml. Comandos de atualização via PlatformIO exigem o projeto e as ferramentas no mesmo computador ao qual a placa está conectada. Para manter o trabalho em dois computadores, é necessário gerar e transferir um ZIP novo após recompilar; editar `CareConfig.h` não atualiza um ZIP já existente.

O procedimento atende redes Wi-Fi comuns com nome/senha. Uma rede da feira que exija aceitar termos ou login em página web não é suportada pelo firmware atual; nesse caso, use o hotspot de 2,4 GHz com credenciais já gravadas.

## Rede, fila e reinício

As leituras rodam no `loop()` e HTTPS em tarefa FreeRTOS separada, compatível com o C3 de um núcleo. Tentativas Wi-Fi alternam redes após 12 segundos; três falhas reais de API também disparam alternativa, com intervalo de pelo menos 20 segundos. Não volta automaticamente à principal enquanto a alternativa funciona. Redes com portal de login não são suportadas; use o hotspot de 2,4 GHz.

No iPhone, em Ajustes → Acesso Pessoal, ative Permitir Acesso a Outros e, quando disponível, Maximizar Compatibilidade (2,4 GHz/WPA2). Mantenha a tela aberta durante a conexão inicial. O nome e a senha precisam corresponder exatamente à segunda rede compilada nos aparelhos. Esse cenário foi confirmado pelo usuário com os aparelhos online em 22/10/2026. Para testar a volta, religue a rede principal antes de desligar o hotspot. Referências: [conexão ao Acesso Pessoal](https://support.apple.com/pt-br/119837) e [modo de compatibilidade](https://support.apple.com/pt-br/guide/security/secfd166f620/web).

Cada aperto é persistido antes de envio. Passos consecutivos ainda não enviados podem ser agrupados, até mil por registro e sem atravessar o dia brasileiro. Antes de enviar, o registro é selado: o mesmo ID nunca muda de conteúdo em reenvios. Até 32 registros vão em cada requisição. ACK do servidor remove cada registro; perda da resposta causa reenvio idempotente.

LittleFS armazena duas cópias com versão e CRC da geração e fila. Reinício recupera a última cópia válida. Geração e limpeza da fila são gravadas juntas, evitando atribuir eventos antigos à sessão nova após queda de energia. Evento cuja gravação foi interrompida antes do commit pode não ter sido salvo. O firmware informa falha de armazenamento e não formata nem finge registrar.

A fila comporta **128 registros**, não 128 passos: passos podem ser agregados. Se ficar cheia, os registros existentes são preservados, o monitor informa os novos eventos não salvos e o próximo diagnóstico marca `queueFull`. Esse indicador fica latched até reinício da demonstração para não esconder a ocorrência. Conecte e esvazie a fila; capacidade finita não permite registrar indefinidamente offline. A persistência frequente prioriza a demonstração e a recuperação de energia; valide desempenho e desgaste antes de uso prolongado.

O pedômetro usa magnitude, filtro de gravidade, limiar, rearme e mínimo de 350 ms. Precisa de calibração na pulseira real; não é um instrumento clínico. A janela de inatividade de 30 segundos só zera `stepsWindow`; ela não altera a fila nem a contagem diária do backend.

“Online” significa mensagem recebida nos últimos 15 segundos. A cor tem confirmação recente apenas se geração/revisão/cor coincidem e a confirmação tem até 15 segundos. A luminária apaga após 15 segundos sem resposta da API; ao reconectar, consulta o estado atual e reaplica. A confirmação prova escrita de GPIO informada pelo firmware, não leitura óptica do LED.

## Reset da demonstração

Use Connect+ ou Missões → **Reiniciar demonstração** → confirmar. A API exige autenticação, modo demonstração, geração esperada e a confirmação `REINICIAR`. Não existe reset por botões nem endpoint IoT capaz de apagar progresso.

O reset cria uma nova sessão/geração. Passos, água, missões, saldo, total ganho, recompensas Scan, resgates demonstrativos e SOS da nova sessão começam zerados. A sessão anterior fica arquivada para auditoria, sem aparecer no estado/ranking ativo. Cadastro, senha, vínculo/configuração e credenciais dos aparelhos são preservados. O histórico do modo diário permanece separado e reaparece ao sair da demonstração.

Aparelhos offline aparecem com “sincronização da sessão pendente”. Ao reconectar com geração antiga, o servidor rejeita todo o lote e retorna a geração atual. A pulseira invalida sua fila antiga e confirma a geração no próximo contato. A luminária recebe a cor inicial e confirma depois de aplicar. O site nunca considera esse contato anterior como confirmação da sessão nova.

## Dados antigos

Os arquivos existentes `usuarios.json` e outros JSONs de progresso não são importados automaticamente. Para importar explicitamente uma conta, use `python manage.py import-user --file usuarios.json --account NUMERO`. O comando pede uma senha nova e preserva perfil, saldo, total histórico e benefícios; recusa sobrescrever conta. Leituras e conclusões antigas não verificadas não são reprocessadas nem premiadas. Os arquivos de origem permanecem intactos.

## Estado da validação em 22/10/2026

Supabase, Render e Vercel foram configurados pelo usuário. As duas placas foram gravadas pelo colega e apareceram online. O usuário confirmou: BTN1/água, BTN2/seleção com pontos sem repetição, BTN3/cancelamento sem perda de progresso, SOS, cor física e confirmação da luminária, queda de rede com reenvio único, hotspot do iPhone e retorno ao Wi-Fi principal, reset com invalidação de evento antigo offline e recuperação de evento pendente após corte completo de USB e bateria. O total de passos não zerou após 60 segundos parado. Os resultados são relatos de testes acompanhados por chamada; detalhes em `STATUS-IMPLEMENTACAO.md`.

Pendências da montagem:

1. Atualizar as duas placas com a versão do portal Wi-Fi e executar o roteiro específico no celular. Os testes físicos anteriores não comprovam esta versão nova.
2. Resolver a alimentação autônoma da pulseira. A bateria via TP4056/entrada 5V mantém componentes acesos, mas a pulseira fica offline sem USB. Conferir conexões e tensões com multímetro; a causa ainda não foi comprovada. O usuário deixou essa medição para quando tiver o instrumento disponível.
3. Avaliar e calibrar o pedômetro durante caminhada real. Dez passos simulados somaram dez eventos, mas isso não comprova precisão de caminhada. Sem powerbank, o usuário adiou essa avaliação até resolver a bateria.
4. Medir atraso, estabilidade e autonomia em uso prolongado e na rede da apresentação. O intervalo de consulta não garante latência em Render suspenso ou rede instável. Resgates de benefícios e comportamento diário completo ainda não foram confirmados manualmente no site publicado.

BOOT e RESET/RST da pulseira estão inacessíveis devido à soldagem; a gravação funcionou sem apertá-los. Para desligamento completo, o usuário confirmou conseguir interromper USB e bateria por chave/conector. Atualizações de firmware devem preservar LittleFS; o reset da demonstração continua exclusivamente pelo site, com confirmação.
