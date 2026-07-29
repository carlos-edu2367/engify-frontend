# Fluxos visuais de ajuste de ponto Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar duas imagens verticais longas, fiéis ao frontend, explicando passo a passo o fluxo do funcionário e do RH para ajustes de ponto.

**Architecture:** Criar dois documentos HTML independentes dentro de `docs/`, cada um com seu próprio CSS inline e uma coluna de guia contendo painéis de interface, anotações e conectores. Renderizar cada HTML em PNG usando um navegador local, preservando os HTMLs como fontes editáveis.

**Tech Stack:** HTML sem dependências, CSS, Chromium/Playwright ou renderizador local disponível, PowerShell para verificações.

## Global Constraints

- As artes devem ter largura final de 1080 px.
- O fluxo do funcionário deve conter as três etapas reais e o status após o envio.
- O fluxo do RH deve conter filtros, listagem, ajuda, aprovação e rejeição com motivo.
- A linguagem visual deve seguir o frontend atual: azul primário, cards, badges, botões e bordas suaves.
- Os PNGs não podem cortar controles, textos ou anotações.

---

### Task 1: Arte do fluxo do funcionário

**Files:**
- Create: `docs/fluxo-ajuste-funcionario.html`
- Create: `docs/fluxo-ajuste-funcionario.png`

**Interfaces:**
- Consumes: textos e estados de `src/components/features/rh/employee/RequestAjustesView.tsx`.
- Produces: um HTML autônomo e um PNG vertical com as telas “Escolha o dia”, “Escolha o que corrigir”, “Explique o que aconteceu” e “Minhas solicitações de ajuste”.

- [ ] **Step 1: Montar o documento HTML autônomo**
  Criar uma página com cabeçalho “Como solicitar um ajuste de ponto”, legenda de uso e painéis sequenciais. Reproduzir os campos de data/horário, cards selecionáveis, textarea, resumo e botões reais, destacando cada área com chamadas numeradas.

- [ ] **Step 2: Renderizar e conferir a arte**
  Abrir o arquivo em viewport de 1080 px, capturar a página inteira e conferir visualmente que os quatro painéis e suas anotações estão completos.

- [ ] **Step 3: Salvar o PNG final**
  Exportar para `docs/fluxo-ajuste-funcionario.png` mantendo a largura de 1080 px.

### Task 2: Arte do fluxo do RH

**Files:**
- Create: `docs/fluxo-ajuste-rh.html`
- Create: `docs/fluxo-ajuste-rh.png`

**Interfaces:**
- Consumes: textos e estados de `src/components/features/rh/AdminRhView.tsx`, `src/components/features/rh/rh-shared.tsx` e `docs/rh-ajustes-ponto-orientacao.md`.
- Produces: um HTML autônomo e um PNG vertical com a triagem, ajuda, aprovação e rejeição.

- [ ] **Step 1: Montar o documento HTML autônomo**
  Criar uma página com o fluxo “Abrir solicitações”, “Encontrar o pedido”, “Como analisar?”, “Aprovar” e “Rejeitar”. Mostrar o card de ajuste com nome do solicitante, data, horários, justificativa, badge pendente e botões de decisão.

- [ ] **Step 2: Renderizar e conferir a arte**
  Abrir o arquivo em viewport de 1080 px, capturar a página inteira e revisar a ordem visual, legibilidade e presença dos diálogos de decisão.

- [ ] **Step 3: Salvar o PNG final**
  Exportar para `docs/fluxo-ajuste-rh.png` mantendo a largura de 1080 px.

### Task 3: Verificação final

**Files:**
- Verify: `docs/fluxo-ajuste-funcionario.html`
- Verify: `docs/fluxo-ajuste-funcionario.png`
- Verify: `docs/fluxo-ajuste-rh.html`
- Verify: `docs/fluxo-ajuste-rh.png`

- [ ] **Step 1: Validar dimensões e arquivos**
  Confirmar que os quatro arquivos existem e que cada PNG tem largura de 1080 px.

- [ ] **Step 2: Revisar os HTMLs**
  Confirmar que os textos dos fluxos correspondem ao frontend implementado e que não existem placeholders ou controles cortados.

- [ ] **Step 3: Commitar apenas os entregáveis**
  Usar `git status --short`, adicionar somente os dois HTMLs, os dois PNGs e os documentos de especificação/plano, e criar um commit descritivo.
