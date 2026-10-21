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

Copie `Care-Plus-Edge-main/firmware/include/config.example.h` para `CareConfig.h`. Compile/grave cada aparelho com seu próprio `DEVICE_ID`, `DEVICE_TOKEN` e geração; no exemplo os IDs mudam automaticamente pelo alvo da placa, mas os tokens precisam ser trocados entre as duas gravações. Preencha as duas redes e `API_BASE` HTTPS. Ajuste polaridade dos botões/RGB à montagem.

Preencha `ROOT_CA` com a CA raiz que valida a cadeia TLS do domínio real da API. Confira o emissor/cadeia desse domínio e obtenha a raiz no site oficial da autoridade certificadora. O código usa `setCACert` e nunca desabilita validação. O aparelho precisa de horário NTP válido para TLS. A validação real do certificado depende do domínio publicado e permanece pendente até configurá-lo. O guia oficial da [Espressif](https://docs.espressif.com/projects/arduino-esp32/en/latest/api/wifi.html) descreve as APIs Wi-Fi usadas.

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

## Rede, fila e reinício

As leituras rodam no `loop()` e HTTPS em tarefa FreeRTOS separada, compatível com o C3 de um núcleo. Tentativas Wi-Fi alternam redes após 12 segundos; três falhas reais de API também disparam alternativa, com intervalo de pelo menos 20 segundos. Não volta automaticamente à principal enquanto a alternativa funciona. Redes com portal de login não são suportadas; use o hotspot de 2,4 GHz.

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

## O que falta preencher/validar

1. Projeto Supabase e `DATABASE_URL`; deploy Render e origem CORS; deploy Vercel e URL da API.
2. Conta de demonstração e provisionamento dos dois aparelhos.
3. Duas redes, senhas, CA TLS do domínio publicado, tokens e geração inicial no `CareConfig.h`.
4. Polaridade dos quatro botões e do RGB; calibração dos passos; teste físico com a fila, hotspot, energia e reset offline.
5. Medição de atraso real. O intervalo de consulta não é garantia de latência em Render suspenso ou rede instável.

Não houve acesso a serviços remotos, uso de credenciais reais, migração remota, gravação de aparelho ou teste físico. A prévia visual no navegador depende de um navegador habilitado no ambiente; build/lint não substituem essa conferência.
