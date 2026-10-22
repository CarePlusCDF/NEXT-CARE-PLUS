# Care Plus / Boost Care — integração HTTPS

Implementação local de React/Vercel → FastAPI/Render → PostgreSQL/Supabase, com pulseira e luminária por HTTPS. Os arquivos JSON de usuários antigos e a infraestrutura FIWARE/NFC foram preservados como referência; não fazem parte do fluxo ativo.

Comece pelo [guia de instalação e publicação](GUIA-IMPLEMENTACAO.md). O [roteiro de validação](TESTES-DEMONSTRACAO.md) separa testes automatizados e testes físicos.

Confira os resultados e limites no [status da implementação](STATUS-IMPLEMENTACAO.md).

Para continuar em outro computador, leia [Retomada na faculdade](RETOMADA-FACULDADE.md), com o ponto da pausa e os arquivos privados que devem ser transferidos separadamente.

Pastas:

- `Care-Plus-Front-Web-main/backend`: API, banco, regras, provisionamento e testes.
- `Care-Plus-Front-Web-main/Front-web`: site React, com o visual existente.
- `Care-Plus-Edge-main`: firmwares HTTPS e projeto PlatformIO para as duas placas, com configuração Wi-Fi pelo celular.

O usuário já configurou os serviços e validou os fluxos principais nas placas. O portal Wi-Fi foi acrescentado ao firmware para cadastrar redes sem recompilar; sua nova versão precisa ser atualizada e testada nos aparelhos. Os pacotes e senhas de configuração são privados e ficam em `artifacts/`, ignorado pelo Git. Veja o status para distinguir testes locais dos testes físicos relatados.
