# Care Plus — atualização com configuração Wi-Fi pelo celular

Este pacote é PRIVADO e contém credenciais dentro dos binários. Compartilhe somente com o colega responsável pelas placas. Não publique o ZIP ou `ACESSO-WIFI-PRIVADO.md`.

## Atualizar no Windows

As duas placas já precisam ter a primeira instalação Care Plus HTTPS. Este pacote grava somente a aplicação. LittleFS (fila de eventos), NVS e tabela de partições são preservados. Não há imagem de filesystem nem opção de primeira instalação neste pacote.

1. Extraia o ZIP em uma pasta nova. Abra PowerShell nessa pasta.
2. Prepare a ferramenta, sem precisar ativar o ambiente ou alterar ExecutionPolicy:

```powershell
py -m venv .venv-flash
.\.venv-flash\Scripts\python -m pip install -r requirements.txt
.\.venv-flash\Scripts\python gravar.py --verificar
.\.venv-flash\Scripts\python gravar.py --listar
```

3. Feche monitores seriais/Arduino e identifique a porta de cada placa. As COM abaixo são exemplos das últimas portas usadas. Execute um comando por vez, escolhendo a placa correta:

```powershell
.\.venv-flash\Scripts\python gravar.py --placa pulseira --porta COM5
.\.venv-flash\Scripts\python gravar.py --placa luminaria --porta COM4
```

Aguarde a conclusão sem desconectar. Não use `--primeira-instalacao`, `uploadfs` ou apagamento total. O script rejeita a primeira instalação neste pacote. A pulseira foi gravada anteriormente sem apertar BOOT/RESET, que estão inacessíveis. Na luminária, se ficar em Connecting, segure BOOT e solte quando iniciar a gravação. Após sucesso, EN/RESET é necessário somente se ela não iniciar automaticamente. O firmware novo tenta primeiro as redes salvas e mantém os botões/pinos existentes.

## Cadastrar o Wi-Fi pelo celular

1. Ligue o aparelho. Para abrir a configuração, deixe indisponíveis as duas redes conhecidas; desligue temporariamente o hotspot se ele estiver salvo. Mantenha as placas alimentadas pelo USB enquanto a bateria da pulseira não estiver validada.
2. Após cerca de 60 segundos sem comunicação válida com a API, o aparelho abre uma rede local. O nome e a senha exclusivos de cada aparelho estão em **ACESSO-WIFI-PRIVADO.md**. Nenhum botão físico precisa ser apertado.
3. No Wi-Fi do celular, conecte à rede `CarePlus-...` do aparelho que vai configurar. Aceite permanecer conectado mesmo sem internet. Abra **http://192.168.4.1** no navegador. Se a tela automática do celular não abrir ou funcionar, use Safari/Chrome e digite esse endereço com `http://`.
4. Escolha **Rede principal** ou **Rede alternativa / celular**. Toque em **Buscar redes próximas** e selecione a rede de 2,4 GHz; também é possível digitar o nome de uma rede oculta. Digite a senha. Para uma rede aberta, marque explicitamente **Esta rede não tem senha**.
5. Toque em **Salvar e testar conexão**. Aguarde até 60 segundos. O aparelho precisa conectar e receber resposta autenticada da API HTTPS antes de salvar. Em caso de senha errada, rede sem internet, falha da API ou da memória, as redes anteriores são mantidas e a página permite corrigir. O Render pode precisar despertar: abra o site/API antes do teste ou repita após a retomada.
6. Quando aparecer **Rede salva e comunicação com a API confirmada**, volte ao Wi-Fi habitual do celular e confira o aparelho online no site. A rede local encerra cerca de 30 segundos após salvar. A troca de canal AP/STA pode interromper a página brevemente; reconecte à mesma rede CarePlus e reabra o endereço se necessário.
7. Repita no outro aparelho. Configurar a pulseira não configura automaticamente a luminária.

As redes ficam na memória NVS após reinício e passam a ter prioridade sobre os valores antigos compilados em `CareConfig.h`. Salvar uma posição preserva a outra. Alterar o cabeçalho e atualizar a aplicação não substitui redes que já foram salvas no portal; para mudá-las, use a página novamente. Atualizações futuras devem continuar preservando a NVS.

Sensores e botões continuam funcionando e os eventos seguem na fila persistente durante a configuração. A página local não concede pontos, não acessa dados da conta, não mostra tokens e não reinicia o progresso. Reset continua somente no site com confirmação. A senha da rede de configuração é diferente da senha das redes de internet e do token da API. Mantenha a alimentação estável ao salvar; a configuração só é confirmada depois do commit em NVS.

Não são suportadas redes de 5 GHz, autenticação empresarial ou login/aceite em página web. No iPhone usado como hotspot, habilite **Permitir Acesso a Outros** e **Maximizar Compatibilidade**, quando disponível.

## Conferir antes da feira

- Atualizar primeiro uma placa, confirmar funcionamento normal e depois atualizar a outra.
- Abrir o portal sem redes conhecidas, conferir que uma senha errada não altera as redes anteriores e que o cancelamento funciona.
- Salvar a rede principal correta, conferir status online/cor aplicada e reiniciar completamente para comprovar que a rede nova permaneceu salva.
- Alterar a alternativa preservando a principal e testar o hotspot.
- Registrar um toque de água enquanto configura e conferir envio único ao recuperar a conexão.
- Confirmar que outro aparelho da rede principal não consegue acessar as rotas de configuração.

O código foi verificado por compilação/testes locais; a página no celular, rádio AP+STA, armazenamento e consumo de memória sob TLS precisam ser conferidos nas placas reais após esta atualização.
