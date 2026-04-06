# Engify (Frontend)

Sistema web para gestão de atividades de uma organização parceira, com foco em acompanhamento de projetos e tarefas.

## Tecnologias

- React + TypeScript (`vite`)
- TailwindCSS
- React Router
- React Query

## Funcionalidades principais

- Autenticação e controle de acesso (rotas protegidas e perfis por função)
- Projetos (“Obras”) com responsável e prazo (`data_entrega`)
- Tarefas (“Items”) por projeto, com atribuição de responsável e mudança de status
- Quadro Kanban por projeto (drag-and-drop)
- Calendário de prazos (por `data_entrega`) com exportação `.ics` para importar no Google Calendar/Outlook

## Requisitos do trabalho (mapeamento)

O enunciado pede um **Sistema Gerenciador de Tarefas Online**. No Engify, o mapeamento fica assim:

- Cadastro e autenticação: páginas públicas de login/registro/recuperação e sessão via token.
- Criação de projetos com prazos e membros:
  - Projeto = **Obra**, com prazo em `data_entrega` e responsável.
  - Membros são gerenciados por convites no time (papéis: admin/engenheiro/financeiro/cliente).
- Criação, atribuição, acompanhamento e conclusão de tarefas:
  - Tarefa = **Item** (por obra), com `responsavel_id` e `status`.
- Kanban:
  - Colunas: `planejamento` → `em_andamento` → `finalizado`.
- Integração com calendário:
  - Tela de calendário de prazos + **exportação `.ics`** dos prazos das obras.

## Rodando localmente

Pré-requisitos: Node.js 18+ (recomendado).

1) Instale dependências:

```bash
npm install
```

2) Configure o `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

3) Rode o projeto:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## Observações para entrega (faculdade)

- Documento extensionista: caracterização da organização parceira, problema, objetivos e público beneficiado.
- Gestão do projeto: link do Trello/Jira/ClickUp com escopo, tarefas, responsáveis, riscos e prazos.
- Vídeo (≈ 5 min): contexto do parceiro, demonstração do sistema (login, obras, itens/kanban, calendário/ICS) e melhorias futuras.

