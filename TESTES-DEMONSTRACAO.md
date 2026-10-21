# Validação e roteiro físico

## Testes de software

Na raiz:

```powershell
.\.venv\Scripts\python -m pytest Care-Plus-Front-Web-main/backend/tests -q
cd Care-Plus-Front-Web-main/Front-web
npm run build
npm run lint
```

A suíte cobre ingestão sem navegador, duplicação de lote, pontos concorrentes, missão inexistente com pontos forjados, Scan concorrente, seleção antiga, cancelamento, SOS, confirmação da luminária, reset com fila antiga, preservação do histórico normal, saldo versus total ganho e isolamento de contas. Por padrão usa SQLite descartável em diretório de teste; isso não comprova conectividade com Supabase nem substitui a validação de locks no PostgreSQL de destino.

## Preparação da apresentação

Configure banco, API, site e firmwares pelo guia. Abra `/health` para aquecer a API, faça login na conta de demonstração e confirme que pulseira/luminária aparecem online, sem sincronização pendente. A luminária começa apagada. Confira botões ligados ao GND e RGB antes de gravar as opções de polaridade.

## Roteiro com os aparelhos

| Teste | Resultado esperado |
| --- | --- |
| Andar e parar por mais de 30 s | Passos aumentam e não caem quando a janela de inatividade termina. Calibrar com contagem manual. |
| Segurar BTN1 por 5 s | Uma confirmação de 220 ml. Soltar e apertar de novo acrescenta outra. |
| Selecionar missão no site, aguardar sincronização e apertar BTN2 | Missão conclui uma vez e seus pontos aparecem. Repetir não dá bônus. |
| Selecionar outra missão e apertar BTN3 | Seleção limpa; passos, água, pontos e conclusão anterior permanecem. |
| Completar uma, duas e três metas | Solicitada amarela, azul e verde respectivamente; aplicada confirma a mesma cor. |
| Segurar BTN4 por 1,5 s e continuar segurando | Um SOS, vermelho solicitado/confirmado, alerta no site. Encerrar no site restaura cor do progresso. |
| Fechar o navegador, caminhar/beber água e reabrir | Progresso avança sem o site e reaparece salvo. |
| Desligar internet e registrar atividades | Sensor/botões continuam; monitor informa fila. Após retorno, processa sem duplicação. |
| Reiniciar pulseira antes de enviar a fila | Recupera eventos persistidos com mesmos IDs, preserva progresso já confirmado. |
| Testar principal e hotspot separadamente | Rede alternativa funciona mesmo quando Wi-Fi associa, mas a API fica inacessível. |
| Desligar luminária ou interromper API | Site deixa de mostrar confirmação recente; luminária apaga depois de 15 s sem resposta. |
| Reiniciar demonstração com pulseira offline | Site pede confirmação; zera estado e informa sincronização pendente. Fila antiga é invalidada ao retornar. |
| Repetir confirmação de reset por clique duplo/requisição antiga | Só uma geração é criada para aquela confirmação; a tentativa antiga recebe conflito. |
| Criar outra conta | Não recebe passos/água/SOS da conta com os aparelhos. |
| Abrir Scan duas vezes/em dois navegadores | No máximo 20 troféus por dia/sessão. Mostra recompensa persistida. |
| Resgatar benefício duas vezes | Débito único; total histórico não diminui. Benefício é demonstrativo. |
| Sair da demonstração | Progresso do modo diário reaparece intacto. |

Registre horário do gesto, horário de atualização no site e da confirmação da luminária para medir atraso. Compare com a última comunicação do aparelho, não apenas com o horário da consulta do navegador.

## Diagnóstico rápido

- **API sem atualização:** confira `/health`, URL da API, CORS e disponibilidade do banco. Durante retomada do Render a fila permanece no aparelho.
- **Pulseira offline:** confira serial 115200, rede 2,4 GHz, tokens, URL HTTPS, relógio NTP e CA. Associação Wi-Fi não comprova acesso à API.
- **LittleFS indisponível na primeira instalação:** use uploadfs antes de registrar atividade. Em instalação existente, preserve a memória e investigue; não formate para corrigir um erro genérico.
- **Fila cheia:** restaure acesso à API. O diagnóstico registra que houve saturação; novos eventos não salvos são informados no serial.
- **HTTP 401 no aparelho:** ID/token não correspondem ao provisionamento.
- **HTTP 409 no aparelho:** ID foi reutilizado com conteúdo diferente; preserve a fila para diagnóstico. Não edite manualmente os IDs.
- **Missão não confirma:** espere sincronização; verifique `no_selection`, `selection_changed` ou `selection_expired` no monitor.
- **Cor solicitada sem aplicada:** verifique a luminária, polaridade RGB e rede; não interprete estado desejado como confirmação física.
- **Passos excessivos/insuficientes:** ajuste `STEP_TRIGGER`, `STEP_REARM` e `STEP_MIN_MS` com teste de caminhada real.

Compilar não comprova ligação elétrica, calibração, vida útil do armazenamento, conectividade da feira ou funcionamento ponta a ponta. Esses testes físicos permanecem obrigatórios antes da apresentação de 24/10/2026.
