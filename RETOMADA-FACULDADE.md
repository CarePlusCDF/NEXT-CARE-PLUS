# Retomada na faculdade

> Estado atual em [CONTINUAR-AQUI.md](CONTINUAR-AQUI.md). As etapas abaixo incluem historico de testes anteriores.

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

## Pulseira reserva instalada neste computador

Foi criado o ambiente PlatformIO `pulseira_reserva`, herdando todas as funcionalidades de `pulseira`, com `CARE_CANCEL_PIN=20`. A original continua com cancelar no GPIO10. As duas versoes compilaram com sucesso. A reserva foi identificada na COM60 (ESP32-C3, MAC 30:ed:a0:5b:f4:d4), recebeu LittleFS inicial e firmware completo, com hashes verificados. Nao repetir uploadfs nas proximas atualizacoes. Confirmar sempre a porta atual.

A reserva usa a mesma identidade e credenciais de pulseira-001; manter apenas uma pulseira ligada. O usuario confirmou a original desligada durante a instalacao. O LED GPIO7 do programa de teste nao foi incorporado: segue o comportamento do firmware completo original. Os contadores locais do programa de teste nao sao importados para o site.

Pendentes apos esta gravacao: confirmar online pelo hotspot, agua, confirmar/cancelar (GPIO20), SOS, passos, fila e funcionamento somente com bateria. O teste anterior de bateria foi com programa local sem Wi-Fi/HTTPS e nao comprova autonomia com o firmware completo.

Atualizacao do diagnostico da reserva: firmware completo e LittleFS instalados na COM60. Com iPhone e segundo hotspot, a reserva nao ficou online; a luminaria conectou. A pulseira original foi ligada sozinha e conectou no mesmo hotspot junto com a luminaria. O firmware normal da original (cancelar GPIO10) foi gravado temporariamente na reserva e ela continuou alternando as redes sem conectar. Portanto a mudanca GPIO20 nao explica a falha. O firmware normal da reserva, com cancelar GPIO20 e sem diagnosticos temporarios de Wi-Fi, foi restaurado na COM60; hash de gravacao confirmado. A causa fisica ainda nao foi comprovada: verificar antena ESP32-C3, proximidade de metal/bateria e tensao 3V3/5V durante tentativas de Wi-Fi. O programa de teste anterior nao usava Wi-Fi/HTTPS. Manter apenas uma pulseira ligada, pois compartilham pulseira-001. A original esta funcional; reserva nao validada online.

Diagnostico adicional da reserva: em USB, 3V3=3,3 V e 5V=5,05 V com bateria desligada. A NVS foi lida em 0x9000/0x5000 (copia privada em .pio ignorada); namespace care-wifi presente, mas sem chave settings, portanto nao ha rede salva pelo portal substituindo CareConfig.h. Um firmware Wi-Fi minimo, sem sensores, fila ou API, usando a rede principal compilada, foi gravado temporariamente na COM60 e registrou repetidamente motivo 201 (rede nao encontrada), sem obter IP. O firmware completo com cancelar GPIO20 foi recompilado/restaurado e hash verificado. Isso aponta para falha especifica da reserva no radio/conexao ou condicao fisica, ainda nao comprovada. A pulseira original e a luminaria conectaram no mesmo hotspot. A porta USB anterior parou de reconhecer conexao; COM60 reapareceu em outra porta. Nenhuma alteracao de NVS/LittleFS ou apagamento total foi feita neste diagnostico.

Atualizacao: apos trocar a bateria da reserva pela bateria da principal, o usuario confirmou que a pulseira principal funciona com e sem USB. A reserva continua sem validacao de Wi-Fi. O firmware agora inclui pulsos de vibracao de 150 ms em cada botao e a cada 7 s durante SOS; o estado SOS segue a cor vermelha recebida do backend e para apos encerrar no site e sincronizar. GPIO7 permanece desabilitado por padrao (CARE_VIBRATION_DRIVER_READY=0), porque o motor 1027 3 V esta ligado diretamente entre GPIO7 e GND. Instalar driver de transistor/MOSFET e diodo de retorno antes de habilitar, gravar e testar; nenhuma placa foi gravada com esta alteracao.

Atualizacao posterior: a pedido do usuario, GPIO7 foi habilitado somente no build da pulseira principal (CARE_VIBRATION_ENABLED=1). A reserva permanece desabilitada. A principal foi identificada na COM19 pelo MAC 8c:d0:b2:a9:5b:d2, compilada e gravada com hash verificado; LittleFS/NVS nao foram apagados. Monitor serial mostrou execucao normal. O motor 1027 3 V continua ligado diretamente GPIO7-GND, sem transistor/diodo; a montagem tem risco de sobrecorrente e deve ser substituida por driver. Falta confirmar vibracao no toque/SOS e parada apos encerrar no site.
