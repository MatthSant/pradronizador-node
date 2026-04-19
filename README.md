# 🛠️ Padronizador de Dados Históricos (Node Edition)

Interface robusta baseada em **Next.js** para padronização, limpeza e consolidação de lotes de dados históricos (Transações, Eventos e Pesquisas). O sistema foi desenhado para garantir integridade estrutural máxima antes da importação para bancos de dados ou análise via IA.

---

## 🗺️ Mapa de Arquivos (Project Structure)

### 📂 `src/app` (App Router)
- **`layout.tsx` & `page.tsx`**: Ponto de entrada e dashboard de seleção de módulo.
- **`processor/[type]`**: Rota dinâmica que gerencia o ciclo de vida do processamento:
  - `Upload` → `Mapeamento` → `Status Mapping` → `Audit Review` → `Exportação`.

### 📂 `src/components` (Modular UI)
- **`MappingInterface.tsx`**: Interface inteligente de "De/Para" com suporte a `Fuzzy Matching` e atalhos de plataforma.
- **`StatusNormalizer.tsx`**: Módulo para normalização manual de status desconhecidos em tempo real.
- **`FixedValueInjector.tsx`**: Injetor de tags fixas (ex: `field_source`) para enriquecimento de dados.
- **`CustomFieldManager.tsx`**: Gerenciador de IDs dinâmicos para pesquisas (Survey).

### 📂 `src/lib` (Intelligence & Core)
- **`constants.ts`**: "Cérebro" do sistema. Contém o dicionário de chaves técnicas (`FIELD_DESCRIPTIONS`) e atalhos para plataformas (`HARD_MAPPINGS` - ex: Hotmart/SCK).
- **`normalization.ts`**: Funções de sanidade:
  - `mapStatus`: Padronização de estados de compra.
  - `normalizeDate`: Conversor universal para formato Postgres (`YYYY-MM-DD`).
  - `cleanEmail` & `cleanSurrogates`: Higiene de strings e caracteres especiais.
- **`processor.ts`**: Motor de processamento via **PapaParse** e **XLSX**.

### 📂 `src/providers`
- **`PipelineContext.tsx`**: Context API que mantém o estado unificado do lote entre os 6 passos da aplicação.

---

## 📦 Packages & Tech Stack
- **Next.js 16 (App Router)**: Framework de alta performance.
- **Framer Motion**: Transições fluidas entre os steps do pipeline.
- **PapaParse**: Parsing de CSV otimizado para grandes volumes no browser.
- **XLSX (SheetJS)**: Suporte a arquivos Excel/Google Sheets.
- **Lucide React**: Iconografia técnica e minimalista.
- **React Dropzone**: Drag-and-drop intuitivo para arquivos.

---

## 🤖 Protocolo MCP (Model Context Protocol)
Este projeto atua como um **Data Provider de Alta Fidelidade** para o ecossistema MCP. No contexto de ferramentas para agentes de IA:

1.  **Soberania de Contexto**: Ao padronizar colunas dispersas em chaves técnicas determinísticas (`field_email`, `field_transaction_code`), o sistema garante que LLMs consigam realizar análises estatísticas sem erros de alucinação causados por headers inconsistentes.
2.  **Preparação Neural**: A saída exportada segue um padrão estrito, ideal para ser consumido por servidores MCP que expõem ferramentas de busca e processamento de dados estruturados.

---

## 🛡️ Segurança e Proteção de Dados (Privacy First)

O Padronizador Node foi construído sob o paradigma de **Soberania de Dados**. Isso significa que seus dados históricos sensíveis nunca deixam o seu computador.

1.  **Processamento 100% Local (Air-Gapped ETL)**: Todo o motor de parsing (`PapaParse` e `XLSX`) e as regras de normalização rodam integralmente na memória do seu navegador. Não há backend que receba ou armazene seus arquivos.
2.  **Protocolo Anti-Exfiltração (CSP)**: O projeto utiliza uma **Content Security Policy (CSP)** rigorosa no `next.config.mjs` que bloqueia fisicamente o envio de dados para domínios externos:
    *   `connect-src 'self'`: Impede que scripts se conectem a APIs, trackers ou servidores externos.
    *   `form-action 'self'`: Garante que formulários não possam enviar dados para fora da aplicação.
    *   `default-src 'self'`: Isolamento total de recursos.
3.  **Higiene de Memória**: Uma vez que a aba é fechada ou o processo é reiniciado, todos os dados temporários carregados na RAM do navegador são descartados.

---

## ⚖️ Principais Regras de Negócio

### 1. Normalização de Status (Transactions)
O sistema agrupa dezenas de variações de plataformas (ex: "paga", "authorized", "paid", "concluída") nos 4 estados fundamentais via `TRANS_STATUS_MAP`:
- `approved`, `pending`, `cancelled`, `refunded`.

### 2. Automação de Mapeamento (Hard Mappings)
Reconhecimento instantâneo de colunas complexas da Hotmart/SCK, como:
- `Código do produto + Produto + Faturamento líquido...` → `field_product`
- `Faturamento líquido` → `field_net_value`

### 3. Sanitização de Dados
- **Datas**: Conversão automática de formatos BR (`DD/MM/YYYY`) para compatibilidade com BI.
- **Emails**: Força minúsculas, remove espaços e limpa caracteres "surrogates" que costumam quebrar CSVs tradicionais.

---

## 🚀 Como Executar
1. Instale as dependências: `npm install`
2. Inicie o servidor local: `npm run dev`
3. Acesse `http://localhost:3000`

---
*Documentação gerada para o projeto Estruturando Dados Históricos.*
