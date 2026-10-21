# Entrega local — 21/10/2026

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
| Backend `pytest` | 7 testes passaram; um aviso de depreciação da dependência TestClient/AnyIO, sem falha. SQLite temporário. |
| API HTTP real local | Migração, health, cadastro, sessão demo, provisionamento, ingestão de passos e reenvio idempotente passaram. |
| Frontend `npm run build` | Passou. |
| Frontend `npm run lint` | Passou. |
| Firmware `pulseira` | Compilado com sucesso para `esp32-c3-devkitm-1`: flash 976.244 bytes e RAM estática 52.740 bytes. |
| Firmware `luminaria` | Compilado com sucesso para `esp32dev`: flash 936.653 bytes e RAM estática 47.248 bytes. |
| LittleFS inicial | Imagem construída com sucesso (`buildfs`), sem gravação em aparelho. |
| Prévia visual no navegador | Não executada: nenhum navegador habilitado no ambiente. |
| Supabase/Render/Vercel reais | Não configurados ou acessados. |
| Gravação e testes físicos | Não executados. |

As compilações usaram configuração de exemplo, sem segredos. Os binários devem ser recompilados depois de preencher os dados reais. Os números de RAM são estáticos, não medição de pico durante TLS ou gravação da fila.

Os banners originais foram preservados. As cópias WebP usadas pelo site têm largura de 1.280 px no mobile e 1.920 px no desktop, somando aproximadamente 3 MB em vez dos 37 MB anteriores. Paleta, tipografia e classes visuais existentes foram mantidas; conferir apresentação visual no navegador antes da feira.

## Limites e próximos passos

Os testes locais não comprovam locks ou SSL no PostgreSQL/Supabase, rede da feira, calibração do MPU6050, resposta dos botões ou RGB físico. O roteiro cobre esses pontos. A fila tem 128 registros; saturação e falhas de armazenamento são explícitas, mas precisam de validação em hardware. Não há vibração, NFC, envio de SOS a contatos ou análise facial.

1. Siga `GUIA-IMPLEMENTACAO.md` para configurar Supabase, Render e Vercel.
2. Crie a conta, provisione os dois aparelhos e preencha redes, URL, CA, IDs, tokens e geração inicial.
3. Recompile, faça a instalação inicial do LittleFS e grave os aparelhos nas portas corretas.
4. Execute `TESTES-DEMONSTRACAO.md`, especialmente queda de rede/energia, troca para hotspot e reset com aparelho offline.

