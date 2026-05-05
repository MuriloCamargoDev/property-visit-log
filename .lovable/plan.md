# Plano: Simplificar app para envio via WhatsApp (sem login)

## Objetivo
Transformar o app num formulário público, sem autenticação, que coleta os dados da visita e envia tudo formatado via WhatsApp para o gerente.

## Mudanças

### 1. Remover toda autenticação e telas extras
- Remover `AuthProvider`, `LoginPage`, `SignupPage`, `ProfilePage`, `MapPage`, `DashboardPage` do roteamento.
- Simplificar `src/App.tsx` para renderizar apenas o formulário de visita.
- Manter os arquivos no projeto por enquanto (não quebra nada), mas podem ser removidos posteriormente.
- Não remover tabelas do banco — apenas deixar de usá-las no fluxo principal (sem impacto, app continua funcionando offline-first).

### 2. Novo formulário simplificado (`VisitFormPage`)
Campos solicitados:
- Nome do Cliente
- Data da visita (com Shadcn DatePicker)
- Quantidade de visitas (1 a 10) — gera N abas/cards
- Para cada visita: **Setor**, **Cidade** (dropdown com cidades de Goiás já existente), **Valor** (CurrencyInput já existente em R$)
- Feedback do cliente (textarea)
- Nome do corretor (input simples — necessário pois não há mais login)

Mantém o aviso: *"se possível tentem enviar no mesmo dia da visita..."*

### 3. Configuração do número do gerente
- Adicionar um campo/constante com o número do WhatsApp do gerente.
- **Pergunta:** preciso que você me informe o número do gerente (com DDD e código do país, ex: `+55 62 9XXXX-XXXX`). Posso deixar como variável editável no código por enquanto.

### 4. Botão "Enviar via WhatsApp"
Ao clicar:
- Valida os campos.
- Monta a mensagem formatada:
  ```text
  📩 Nova visita registrada!

  👤 Corretor: <nome>
  📋 Cliente: <nome do cliente>
  📅 Data: <dd/mm/aaaa>

  🏠 Visita 1
  📍 Setor: <setor>
  📍 Cidade: <cidade>
  💲 Valor: R$ <valor>

  🏠 Visita 2
  ...

  📝 Feedback: <feedback>
  ```
- Abre `https://wa.me/<numero>?text=<mensagem encodeURIComponent>` em nova aba.

### 5. Layout das múltiplas visitas
Usar componente Tabs do Shadcn (`@/components/ui/tabs`) para criar abas dinâmicas (Visita 1, Visita 2, ...) conforme a quantidade informada — atende ao pedido "abra novas abas".

## Arquivos afetados
- `src/App.tsx` — remover roteamento de auth, deixar só o form.
- `src/pages/VisitFormPage.tsx` — reescrever sem dependência de `useAuth`, sem Supabase, com Tabs e botão WhatsApp.
- Reaproveitar: `PropertyFields` (ou substituir por Tabs), `CurrencyInput`, `goias-cities.ts`.

## Itens fora do escopo
- Não toca em banco de dados, edge functions, Google Sheets/Drive.
- Histórico/dashboard/mapa ficam desativados (sem login, não há a quem atribuir).

## Pergunta antes de implementar
Qual é o número de WhatsApp do gerente que receberá as mensagens?
