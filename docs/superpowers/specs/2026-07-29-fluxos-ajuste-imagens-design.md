# Fluxos visuais de ajuste de ponto — especificação

## Objetivo

Criar duas imagens verticais longas, em formato de guia visual, explicando o fluxo real de solicitação de ajuste de ponto pelo funcionário e de análise pelo RH. As imagens devem parecer capturas do produto, mantendo a linguagem visual atual e destacando onde clicar e o que preencher.

## Entregáveis

- `docs/fluxo-ajuste-funcionario.html` e `docs/fluxo-ajuste-funcionario.png`.
- `docs/fluxo-ajuste-rh.html` e `docs/fluxo-ajuste-rh.png`.
- Os HTMLs são fontes editáveis e devem conter todas as telas do fluxo no mesmo arquivo vertical.
- Os PNGs devem ter 1080 px de largura, fundo claro, textos legíveis e altura suficiente para mostrar o fluxo completo sem esconder os controles.

## Conteúdo fiel ao frontend

### Funcionário

Representar as três etapas do `RequestAjustesView`: “Escolha o dia”, “Escolha o que corrigir” e “Explique o que aconteceu”. Mostrar o campo de data, a seleção de Entrada/Saída/Intervalo, os campos de horário, o campo de justificativa, a revisão da solicitação, os botões “Voltar”, “Continuar”, “Revisar solicitação” e “Enviar solicitação”, além do status “Pendente” em “Minhas solicitações de ajuste”.

### RH

Representar a triagem na aba “Ajustes” da área de solicitações: filtros de funcionário/período, filtro de status, card “Ajustes de ponto”, solicitante com nome/cargo/CPF mascarado, data, horários solicitados, justificativa, status “Pendente”, botão “Como analisar?”, e as ações “Aprovar ajuste” e “Rejeitar”. Mostrar também o diálogo de rejeição com motivo obrigatório e a confirmação de aprovação.

## Direção visual

- Usar a mesma base visual do produto: azul primário, cards brancos, bordas suaves, fundo cinza muito claro, badges de status e botões arredondados.
- A imagem é um guia, não uma nova tela do produto: usar números, setas e textos explicativos fora dos componentes para orientar o leitor.
- Usar dados fictícios apenas para tornar o exemplo legível: “Mariana Alves”, 26/07/2026, 08:00, 12:00, 13:00 e 17:30.
- Não adicionar ações ou estados que não existem no fluxo implementado.

## Validação

- Abrir os dois HTMLs em navegador/renderizador local em viewport de 1080 px.
- Conferir que nenhum painel, botão ou chamada explicativa foi cortado.
- Conferir que os PNGs têm exatamente 1080 px de largura e são legíveis em visualização vertical.
