> Integração atual: consulte o [guia HTTPS](../GUIA-IMPLEMENTACAO.md). A documentação abaixo descreve a versão original; FIWARE/MQTT/NFC e instruções de limpeza não fazem parte da execução ativa.

# Boost Care - Care Plus

Aplicação web desenvolvida como parte do Challenge Care Plus, projeto interdisciplinar do 1º ano de Engenharia de Software da FIAP. O projeto integra as disciplinas de Front-End Design e Web Development nas Sprints 2 e 3.

## Sobre o Projeto

O Boost Care é uma funcionalidade gamificada integrada ao ecossistema Care Plus, plano de saúde empresarial. A proposta transforma hábitos de saúde preventiva em uma jornada gamificada, onde o usuário completa missões diárias, acumula pontos e troféus, sobe de nível e desbloqueia benefícios reais com parceiros como Nubank, iFood e Amazon.

## Tecnologias Utilizadas

- React 19
- Vite 8
- Bootstrap 5
- React Router DOM
- React Icons

## Estrutura do Projeto

```
src/
  components/
    TopBar.jsx
    Bottomnav.jsx
  routes/
    HomePage.jsx
    LGPD.jsx
    Onboarding.jsx
    Cadastro.jsx
    Inicial.jsx
    Missoes.jsx
    Ranking.jsx
    Impulso.jsx
    Beneficios.jsx
    Mind.jsx
    Connect.jsx
    Scan.jsx
    Noticias.jsx
    Perfil.jsx
  assets/
    flux.png
  style/
    bootstrap.css
  App.jsx
  main.jsx
  index.css
```

## Fluxo de Navegação

1. **Home** — Tela inicial do Care Plus com acesso rápido ao Boost Care
2. **LGPD** — Termo de consentimento de dados com explicação completa sobre coleta, uso e controle pelo usuário conforme a Lei Geral de Proteção de Dados
3. **Onboarding** — Três slides explicativos sobre o Boost Care, Impulso+ e Missões
4. **Cadastro** — Formulário em dois passos para coleta de informações pessoais (peso, altura) e hábitos (nível de atividade, qualidade do sono, nível de energia)
5. **Inicial** — Dashboard principal com missões ativas, benefícios, Mind+, Connect+, Scan Diário e Notícias
6. **Missões** — Mapa de missões, streak, missões Connect+, missões personalizadas, desafio semanal e Impulso+
7. **Ranking** — Classificação semanal entre usuários com pódio e lista completa
8. **Impulso+** — Mascote Flux, progresso semanal e sistema de streak
9. **Benefícios** — Categorias Bronze/Prata, benefícios ativos e disponíveis por parceiro
10. **Mind+** — Apoio psicológico, dúvidas frequentes, pronto atendimento e CVV
11. **Connect+** — Métricas da pulseira (passos e hidratação) e conquistas exclusivas
12. **Scan Diário** — Simulação de scan facial com abertura de caixa surpresa
13. **Notícias** — Feed de notícias de saúde com destaque e listagem
14. **Perfil** — Dados do usuário, gráfico de missões diárias, troféus e informações pessoais

## Funcionalidades

- Navegação completa entre todas as telas via React Router DOM
- Persistência de dados do usuário via localStorage
- Formulário de cadastro em dois passos com validação
- Barras de progresso dinâmicas nas missões
- Sistema de streak e gamificação
- Ranking semanal entre usuários
- Simulação de scan diário com feedback visual
- Integração conceitual com pulseira IoT (passos e hidratação)
- Interface responsiva para mobile, tablet e desktop
- Design system completo baseado na paleta oficial da Care Plus


## Como Executar

Clone o repositório:

```bash
git clone https://github.com/CarePlusCDF/Care-Plus-Front-Web.git
```
Acesse a pasta do projeto:

```bash
cd front-web
```

**Frontend**

Instale as dependências:

```bash
npm install
```

Execute em modo de desenvolvimento:

```bash
npm run dev
```

**Backend**

Acesse a pasta do backend:

```bash
cd backend
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Execute a API:

```bash
uvicorn main:app --reload
```

A API estará disponível em:

```bash
http://localhost:8000
```

## Integrantes

## Equipe
| Nome |
|------|
| João Gonzales  | 
| Gabriel Ardito | 
| João Sarracine | 
| Felipe Menezes | 


## Disciplinas Contempladas

- Front-End Design — Layout responsivo, Bootstrap, Flexbox, HTML semântico, componentes modernos
- Web Development — React, Vite, componentes reutilizáveis, props, localStorage, JavaScript moderno, React Router DOM

