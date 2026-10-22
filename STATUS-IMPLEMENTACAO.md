# Entrega local — 21/10/2026

Atualização em 22/10/2026: o usuário configurou Supabase, Render e Vercel e confirmou login e ativação do modo demonstração no site publicado. A API pública respondeu `{"status":"ok"}`. O site está em `https://next-care-plus-gamma.vercel.app` e a API em `https://booscare-api.onrender.com`.

Nenhum IoT está rodando ou configurado nesta etapa. Concluir primeiro as validações do site/backend; depois seguir com provisionamento, firmware e testes físicos. O nome mostrado em Connect+ identifica a conta autenticada. O rótulo local foi corrigido de “Conectado em” para “Conta”, sem indicar comunicação de dispositivo inexistente; essa correção ainda precisa ser publicada.

## Arquivos de entrada

- API: `Care-Plus-Front-Web-main/backend/main.py`, `database.py`, `domain.py`, `manage.py`.
- Esquema: `Care-Plus-Front-Web-main/backend/migrations/001_initial.sql`.
- Publicação: `Care-Plus-Front-Web-main/render.yaml`, `.env.example` do backend e do frontend, `vercel.json` existente.
- Site: `src/services/CareContext.jsx`, cliente central em `api.js`, controles em `components/DeviceControls.jsx` e páginas existentes integradas.
- Pulseira: `Care-Plus-Edge-main/pulseira/pulseira.ino`.
- Luminária: `Care-Plus-Edge-main/led_monitor/led_monitor.ino`.
- Configuração dos aparelhos: `Care-Plus-Edge-main/firmware/include/config.example.h` → `CareConfig.h` local, ignorado pelo Git.
- Compilação: `Care-Plus-Edge-main/platformio.ini`.

## Verificações executadas

| Verificação | Resultado |
| --- | --- |
| Backend `pytest` | 14 testes passaram, incluindo configuração guiada e caracteres especiais da senha; um aviso de depreciação TestClient/AnyIO, sem falha. Banco SQLite temporário e arquivos de configuração de teste. |
| API HTTP real local | Migração, health, cadastro, sessão demo, provisionamento, ingestão de passos e reenvio idempotente passaram. |
| Frontend `npm run build` | Passou. |
| Frontend `npm run lint` | Passou. |
| Firmware `pulseira` | Compilado com sucesso para `esp32-c3-devkitm-1`: flash 976.244 bytes e RAM estática 52.740 bytes. |
| Firmware `luminaria` | Compilado com sucesso para `esp32dev`: flash 936.653 bytes e RAM estática 47.248 bytes. |
| LittleFS inicial | Imagem construída com sucesso (`buildfs`), sem gravação em aparelho. |
| Prévia visual no navegador | Captura de Connect+ enviada pelo usuário conferida. Navegação interativa pelo agente não executada; nenhum navegador habilitado no ambiente. |
| Supabase/Render/Vercel reais | Publicados/configurados pelo usuário. Health da API conferido; usuário confirmou login e demonstração no site publicado. |
| Gravação e testes físicos | Não executados. |

As compilações usaram configuração de exemplo, sem segredos. Os binários devem ser recompilados depois de preencher os dados reais. Os números de RAM são estáticos, não medição de pico durante TLS ou gravação da fila.

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

1. Conclua as verificações do site/backend e publique as correções locais pendentes.
2. Depois, provisione os dois aparelhos para a conta escolhida e preencha redes, URL, CA, IDs, tokens e geração inicial.
3. Recompile, faça a instalação inicial do LittleFS e grave os aparelhos nas portas corretas.
4. Execute `TESTES-DEMONSTRACAO.md`, especialmente queda de rede/energia, troca para hotspot e reset com aparelho offline.

