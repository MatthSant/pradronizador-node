# Guia de Dados: Tabela de Transações (Vendas)

---

A base de todo o estudo financeiro e de retenção. Esta tabela é responsável por registrar todas as compras (e tentativas de compras, cancelamentos, etc.) realizadas.

Esta tabela sozinha corresponde ao **Nível 1 de Maturidade de Dados** do nosso estudo.

<aside>
ℹ️

## **Cuidados gerais com a base de dados:**

---

1. **Deve conter TODAS as transações do negócio:** Não filtre apenas vendas provenientes de Tráfego Pago ou apenas de uma conta específica. Precisamos da visão global (orgânico, base, afiliados, tudo) para que o estudo de LTV e Receita seja fidedigno à realidade financeira da empresa.
2. **Cestas de Produtos (Múltiplos itens no mesmo Carrinho):** Caso o cliente compre mais de um produto num único checkout (ex: Produto A + Order Bump B), exporte **uma linha separada para cada produto**. O sistema entenderá que fazem parte da mesma cesta porque ambas as linhas compartilharão o mesmo `field_transaction_code` (ID do Pedido) e o mesmo `field_transaction_date`.
3. **Formatação Monetária:** Valores numéricos (`field_transaction_value`, `field_net_value`) devem vir limpos, sem símbolos de moeda e usando ponto para decimais (Ex: `197.50` ao invés de `R$ 197,50`). Exportar isso como String corrompe os cálculos de Receita.
4. **Parcelamentos vs Assinaturas:** Para **Parcelamentos Padrão** (sem risco de inadimplência após a aprovação, ex: cartão de crédito parcelado), **NÃO** crie uma linha para cada parcela (Ex: 12 linhas de R$100 geradas para 1 venda parcelada); exporte apenas o valor total e use o campo `field_installments` para informar as vezes. Porém, se for uma **Assinatura/Recorrência** (plano com risco de cancelamento/inadimplência contínua), **CADA renovação deve ser uma nova linha**, utilizando o campo `field_charge_amount` para indicar a ordem dessa cobrança (Ex: `1` para o primeiro mês, `2` para o segundo).
5. **Fuso Horário (Timezone):** É vital que o `field_transaction_date` seja exportado nativamente em UTC ou com o offset de fuso explícito (`YYYY-MM-DD HH:MM:SS-03:00`). Desalinhamentos entre o banco de dados e as ferramentas de anúncio arruínam a atribuição.
6. **Padronização de Moedas:** Todos os valores (`field_transaction_value`, `field_net_value`, etc) devem vir **convertidos para uma única moeda** padrão da empresa (ex: tudo em Reais). Não calcule LTV misturando transações de R$ 100 com transações de $ 100 Dólares puras sem conversão no mesmo banco.
7. **UTMs como "Last-Click" da Conversão:** As UTMs exportadas na linha devem representar a origem imediata/final *daquela conversão específica (seja ela um evento de lead, contato ou uma compra)*. Não arraste a primeira UTM do lead para todos os eventos seguintes dele. *Exemplo prático de um lead na jornada:*
    - *Entrou no Funil A ➔ Salve UTMs do Funil A.*
    - *Anos depois, entrou no Funil B ➔ Salve UTMs do Funil B nessa conversão.*
    - *Comprou no Funil B ➔ Salve as UTMs do Funil B na compra.*
</aside>

<aside>
🧙‍♀️

## **O que essa tabela desbloqueia?**

---

Se enviada com qualidade, nos permite realizar estudos avançados de inteligência de retenção e faturamento:

- **Curva de LTV (Lifetime Value) e Recompra:** Projeções focadas de LTV e Receita em tempos curtos, médios e longos (ex: 1, 3, 6, 12 e 24 meses).
- **Classificação RFM (Recency, Frequency, Monetary):** Segmentação de clientes de acordo com quando, quanto e o quão frequentemente eles compram (possibilitando estratégias ultra segmentadas por grupo).
- **Migração de Bases e Upgrade:** O quanto a aquisição de um primeiro produto primário (De Entrada) alavanca a migração da base para o Upside, traçando o LTV por produto central.
- **Afinidade de Produtos:** Quais produtos ou serviços são frequentemente comprados em sequência, ajudando a traçar "esteiras ideais".
</aside>

---

## **📌 Formato de Envio**

---

Recomendado: Arquivo `.CSV` (separador: `,`), encoding UTF-8. (Veja o arquivo modelo `Template_Transacoes.csv` anexo).

[Template_Transacoes.csv](Template_Transacoes.csv)

# **📝 Dicionário de Dados Necessários (De/Para Detalhado)**

---

Para garantir o perfeito entendimento entre as metas de negócio e a engenharia de dados, detalhamos abaixo o De/Para exato das colunas solicitadas:

### **🔴 Bloco 1: O Núcleo (Obrigatório - Padrão)**

---

Sem estes dados, a transação sequer pode ser contabilizada nos cálculos básicos de receita.

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual é o verdadeiro LTV médio de um cliente ao longo de 12 meses?*
- *Quanto tempo (em dias) meu cliente demora em média para comprar o segundo produto (Ciclo de Recompra)?*
- *Qual grupo de clientes gasta mais e com mais frequência na nossa base principal (Matriz RFM)?*

| Informação Solicitada (Negócio) | Coluna Correspondente | Tipo e Formato | Por que precisamos disso? |
| --- | --- | --- | --- |
| **ID Único do Lead/Cliente** |  `field_email`, `field_cpf` e `field_phone` | **Obrigatório.** String. | Usado como a "Regra de Ouro". Permite cruzar quando esse cliente entrou (Lead) e quem ele é (Pesquisa), mapeando todo o LTV atrelado à mesma pessoa. |
| **Nome do Cliente** | `field_name` | **Recomendado/Enriquecimento.** String. | Humaniza a leitura bruta da base e elimina a necessidade cega de cruzar com os leads apenas para descobrir *quem* gastou X. |
| **Código da Transação/Pedido** | `field_transaction_code` | **Obrigatório.** String. | Identificador único daquela compra (ID do Pedido). Essencial para evitar a duplicidade de valores caso a base seja exportada duas vezes. |
| **Data e Hora da Transação** | `field_transaction_date` | **Obrigatório.** Timestamp (`YYYY-MM-DD HH:MM:SS`). | Fundamental para colocar as compras em linha do tempo cronológica. Necessário para medir o "Ciclo de Recompra" (dias entre a compra A e B). |
| **Produto Vendido** | `field_product` (Nome) e `field_product_code` (Código Único do Produto) | **Obrigatório.** String (Padronizada). | Agrupa o LTV e dita as "Esteiras Ideais". Se nomes de produtos vierem escritos de 3 formas diferentes, as quebras de funil serão prejudicadas. |
| **Quantidade Comprada** | `field_quantity` | **Obrigatório.** Inteiro. | Impede distorções no Ticket Médio e na margem de lucro caso o cliente compre múltiplas unidades do mesmo item na mesma compra. |
| **Valor Transacionado (Bruto)** | `field_transaction_value` | **Obrigatório.** Float/Numérico (ex: `197.50`). | Define a receita. O modelo RFM (Recency, Frequency, Monetary) usa este campo para qualificar quão valioso o cliente é na matriz. |
| **Valor Líquido e Taxas** | `field_net_value` e `field_marketplace_comission` | **Recomendado/Enriquecimento.** Float/Numérico. | Desconta a taxa da plataforma (Ex: Gateway de Pagamento, App de E-commerce, Intermediador) para termos a visão do Lucro Real e ROI sem ilusões de faturamento bruto. |
| **Status da Transação** | `field_transaction_status` | **Obrigatório.** String (Ex: `Aprovado`, `Estornado`). | Exclui pagamentos falhos e chargebacks do modelo de receita, calculando um ROI verdadeiro. |
| **Data de Cancelamento/Churn** | `field_cancellation_date` | **Recomendado/Enriquecimento.** Timestamp. | Marca o fim do ciclo de LTV e alerta para problemas de retenção do produto. |

### **🟡 Bloco 2: O Desbloqueio Analítico (Opcional/Enriquecimento)**

---

Estes não impedem o registro da venda, mas **são o coração da inteligência de Tráfego e Otimização.**

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual canal (Meta vs Google) e campanha específica traz os clientes com maior taxa de retenção no longo prazo?*
- *O público alvo que entrou por uma oferta agressiva (cupom) tem piores taxas de LTV lá na frente?*
- *Compradores que parcelam em até 12x no cartão geram mais ou menos LTV residual (Upsell) que compradores via PIX?*

| Informação Solicitada (Negócio) | Coluna Correspondente (SQL) | Tipo e Formato | Por que precisamos disso? |
| --- | --- | --- | --- |
| **Origem e Campanhas (UTMs)** | `utm_source` (Canal), `utm_medium` (Público), `utm_campaign` (Campanha), `utm_content` (Criativo), `utm_term` | **Opcional/Enriquecimento**. | Mapeia o LTV e Custos Alvo (CAC) de volta ao Canal, Público e Criativo exato de Tráfego Pago que originou a compra. |
| **Tag de Funil / Oferta** | `conversion` | **Opcional/Enriquecimento** | Diferencia se a mesma pessoa comprando o "Produto/Serviço X" entrou por uma campanha promocional agressiva ou fluxo padrão. Impacta a taxa de retenção. |
| **Oferta do Checkout** | `field_offer` e `field_offer_code` | **Opcional/Enriquecimento**. | Essencial para distinguir vendas do mesmíssimo item sob termos diferentes (Ex: "Produto X - Oferta Black Friday" vs "Produto X - Preço Normal"). |
| **Gateway / Plataforma** | `field_source` | **Opcional**. | Diz *por onde* a venda foi processada (Ex: Loja Física, E-commerce, Gateway Online). Vital quando o negócio escala e migra margens/taxas entre canais. |
| **Tipo de Cobrança** | `field_charge_type` | **Opcional** | Identifica se foi um resgate de 'Trial' grátis, uma assinatura contínua ou uma compra avulsa (pagamento único). |
| **Profissional / Vendedor / Atendente** | `field_seller` ou `field_professional_id` | **Opcional** | Identifica quem realizou a venda ou serviço (Médico, Consultor, Vendedor, Afiliado). Essencial para comparar qual profissional gera clientes com maior LTV e retenção. |
| **Meio de Pagamento** | `field_payment_method` | **Opcional**(PIX, Boleto, Cartão). | Permite cruzar taxas de aprovação, churn de assinaturas por pagamento falho no cartão vs boletos abandonados. |
| **Parcelamento** | `field_installments` | **Opcional**(Inteiro, ex: `12`). | Usado para projeções de fluxo de caixa futuro e impactos de antecipação. |
| **Ordem de Recorrência** | `field_charge_amount` | **Opcional**(Inteiro, ex: `2`). | Identifica se a venda é a 1ª, 2ª ou enésima cobrança de uma assinatura. Crucial para medir Churn Rate mensal. |
| **Tipo de Transação** | `field_transaction_type` | **Opcional**. | Identifica se a esteira funcionou (Ex: Order Bump, Upsell, Cross-sell, Assinatura). |
| **Cupom de Desconto** | `field_coupon` | **Opcional**. | Identifica se LTV é afetado por ofertas agressivas. |

### **🟢 Bloco 3: O Detalhamento de Endereço e Logística (Opcional/Enriquecimento)**

---

Estes campos permitem a compreensão física da base, essenciais para negócios com operação híbrida, logística física ou expansão de unidades para novas regiões.

💡 **Exemplos de perguntas que este bloco responde:**

- *Os clientes da microrregião ou bairro X gastam, em média, mais do que a média estadual global?*
- *Onde devemos concentrar nossa próxima campanha de outdoor local ou expansão física com base na densidade de alto LTV?*

| Informação Solicitada (Negócio) | Coluna Correspondente (SQL) | Tipo e Formato | Por que precisamos disso? |
| --- | --- | --- | --- |
| **CEP / Zip Code** | `field_zip_code` | **Opcional/Enriquecimento** | Traça mapas de calor exatos para direcionamento logístico e expansão de infraestrutura (ex: Abertura de novas Centrais de Consulta). |
| **Estado e Cidade** | `field_state` e `field_city` | **Opcional/Enriquecimento** | Viabiliza cálculos de LTV comparativos regionais (Ex: "A base de SP gasta mais que a base do RJ?"). |
| **Bairro** | `field_neighborhood` | **Opcional/Enriquecimento** | Permite recortes por faturamento a nível de micro-região e comportamento de consumo local. |

---