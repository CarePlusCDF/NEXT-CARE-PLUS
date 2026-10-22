# Retomada na faculdade

## Ponto exato da pausa

O site publicado é https://next-care-plus-gamma.vercel.app/ e a API é https://booscare-api.onrender.com. Para usar o sistema publicado, basta navegador e internet; não é necessário iniciar npm ou uvicorn.

O portal de configuração Wi-Fi pelo celular foi implementado e as duas versões compilaram. Passaram o teste nativo da lógica, quatro testes da página e quatro testes do pacote. O usuário confirmou a atualização da luminária na COM4, após entrar no modo de gravação com BOOT e EN/RESET, e retorno online. A atualização da pulseira foi orientada na COM5; confirmar a conclusão dela antes de diagnosticar ausência do portal. As COM podem mudar: sempre listar e identificar no computador em uso.

**Próximo teste pendente:** deixar as duas redes conhecidas indisponíveis, manter alimentação USB e aguardar 60–90 segundos. No iPhone, procurar `CarePlus-pulseira-001`, conectar com a senha do arquivo privado e abrir http://192.168.4.1. Primeiro confirmar que a página abriu. Depois religar uma rede de internet, testar senha errada/cancelamento e salvar a rede correta. Repetir na luminária, confirmar persistência após reinício, fallback, eventos e cores. Os testes físicos anteriores são da versão anterior do gerenciador; repetir os principais após esta atualização.

## Abrir o projeto em outro computador

Com Git instalado, em uma pasta do seu usuário:

```powershell
git clone https://github.com/CarePlusCDF/NEXT-CARE-PLUS.git
cd NEXT-CARE-PLUS
```

Se já houver uma cópia, confira o trabalho local e execute `git pull --ff-only` nessa cópia. Abra esta pasta no editor e leia este arquivo, `STATUS-IMPLEMENTACAO.md` e `GUIA-IMPLEMENTACAO.md`.

## O que não vem pelo GitHub

Credenciais não são commitadas. Transfira em canal privado, somente se necessário:

- `artifacts/CarePlus-WiFi-Celular-PRIVADO.zip`: firmware já compilado, ferramenta e instruções de atualização.
- `ACESSO-WIFI-PRIVADO.md`, dentro desse pacote: senhas das redes locais de configuração. São diferentes das senhas de internet e dos tokens da API.
- `Care-Plus-Edge-main/firmware/include/CareConfig.h`: necessário apenas se forem recompilar o firmware com as credenciais atuais.

O colega já recebeu o pacote; use essa cópia ou transfira a cópia local. Não publique os arquivos privados no GitHub. Para testar pelo site e atualizar com o ZIP pronto, não é necessário levar o `.env` do banco. Ambientes `.venv`, `.venv-pio`, `.venv-flash` não devem ser copiados entre PCs; prepare-os novamente quando necessários.

No Windows, para gravar usando o ZIP, extraia em pasta nova, abra PowerShell nela e execute:

```powershell
py -m venv .venv-flash
.\.venv-flash\Scripts\python -m pip install -r requirements.txt
.\.venv-flash\Scripts\python gravar.py --verificar
.\.venv-flash\Scripts\python gravar.py --listar
```

Depois use a COM identificada para a placa correta. O pacote novo é somente atualização; não usar primeira instalação, `uploadfs` ou apagamento total. Consulte o `LEIA-ME.md` do pacote para os comandos de gravação. A fila LittleFS e a configuração NVS devem ser preservadas.

## Ligações e limites a lembrar

- Pulseira ESP32-C3 Super Mini: MPU6050 SDA1/SCL3, endereço 0x68; botões ao GND: água5, confirmar4, cancelar10, SOS21. GPIO7 desativado; nenhum LED no GPIO10.
- BOOT/RESET da pulseira estão inacessíveis por causa da soldagem. A gravação inicial funcionou automaticamente. Não orientar apertá-los nem improvisar contato em pontos soldados.
- Luminária ESP32 comum: RGB R25/G26/B27, configuração atual para cátodo comum; BOOT e EN/RESET acessíveis.
- Bateria: lítio GZ902540, 3,7 V nominal/800 mAh, B+/B− do TP4056; OUT+ no 5V da ESP32; componentes pelo 3V3. Confirmar OUT−/GND. Sem USB, componentes acendem, mas a pulseira fica offline. Medir alimentação com multímetro e investigar antes de alterar ligações; causa não comprovada.
- Sem powerbank, a caminhada real foi adiada até resolver a alimentação. Dez passos simulados somaram dez, e o total não zerou após 60 s parado; isso ainda não comprova calibração em caminhada.
- Hotspot do iPhone funcionou com Permitir Acesso a Outros e Maximizar Compatibilidade. Redes com portal web de login não são suportadas.
- O alerta do antivírus sobre Zig não foi diagnosticado. Esse compilador não integra o firmware ou o ZIP e não é necessário para os testes físicos/gravação. Não restaurar ou executar por causa deste roteiro.

Os testes anteriores confirmaram água, missão sem duplicar pontos, cancelamento sem apagar progresso, SOS, confirmação de cor, troca entre redes, fila após queda de rede/energia e descarte de eventos antigos após reset. O reset continua somente no site, com confirmação.
