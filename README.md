# Care Plus / Boost Care — integração HTTPS

Implementação local de React/Vercel → FastAPI/Render → PostgreSQL/Supabase, com pulseira e luminária por HTTPS. Os arquivos JSON de usuários antigos e a infraestrutura FIWARE/NFC foram preservados como referência; não fazem parte do fluxo ativo.

Comece pelo [guia de instalação e publicação](GUIA-IMPLEMENTACAO.md). O [roteiro de validação](TESTES-DEMONSTRACAO.md) separa testes automatizados e testes físicos.

Confira os resultados e limites no [status da implementação](STATUS-IMPLEMENTACAO.md).

Pastas:

- `Care-Plus-Front-Web-main/backend`: API, banco, regras, provisionamento e testes.
- `Care-Plus-Front-Web-main/Front-web`: site React, com o visual existente.
- `Care-Plus-Edge-main`: firmwares HTTPS e projeto PlatformIO para as duas placas.

As credenciais e os endereços remotos ainda precisam ser preenchidos. Nenhum deploy, banco remoto ou aparelho foi alterado por esta implementação.
