# Guia de Dados: Tabela de Eventos/Leads

---

Onde registramos a entrada histórica dos seus clientes (mesmo antes de comprarem) e as conversões chave ao longo da jornada (ex: entrou por formulário promocional, depois viu catálogo interativo).

Juntar esta tabela à Tabela de Transações nos eleva ao **Nível 2 de Maturidade de Dados**.

<aside>
ℹ️

## **Cuidados gerais com a base de dados:**

---

1. **Sanitização de Chaves Primárias Relacionais:** O campo `field_email` deve vir sempre normalizado em **letras minúsculas e sem espaços no início/fim** (TRIM). Documentos como `field_cpf` ou `field_phone` devem conter apenas números. Isso evita que falhas em formulários tratem `Joao@email.com` e `joao@email.com` como duas pessoas diferentes, partindo o LTV no meio.
2. **Eventos Orgânicos Importam:** Assim como nas transações, não inclua restrições na query para trazer "Apenas leads contendo UTM". Precisamos de todos os leads orgânicos para o balanço comparativo e modelagem de atribuição linear.
3. **Timestamp do Evento (Não da Atualização):** A coluna `data` deve refletir o instante que o lead fez a submissão, e não a data em que a linha no banco SQL foi modificada ou sincronizada por uma integração técnica (o clássico erro de *updated_at* puxado como se fosse um *created_at*).
4. **UTMs como "Last-Click" da Conversão:** As UTMs exportadas na linha devem representar a origem imediata/final *daquela conversão específica (seja ela um evento de lead, contato ou uma compra)*. Não arraste a primeira UTM do lead para todos os eventos seguintes dele. *Exemplo prático de um lead na jornada:*
    - *Entrou no Funil A ➔ Salve UTMs do Funil A.*
    - *Anos depois, entrou no Funil B ➔ Salve UTMs do Funil B nessa conversão.*
    - *Comprou no Funil B ➔ Salve as UTMs do Funil B na compra.*
</aside>

<aside>
🧙‍♀️

## **O que essa tabela desbloqueia?**

---

Quando conectamos essa jornada de leads com as finanças sob a ótica da nossa metodologia, passamos a dominar a tração:

- **Diagnóstico Completo de Tráfego Pago e Canais:** Visão da performance do funil de ponta a ponta (Captação, Qualificação e Conversão Final).
- **Projeção de Custos Alvo Limitantes (CPL e CPMQL):** Saber com extrema precisão qual o teto financeiro ideal que suporta a conta de Custo Por Lead, considerando a longo prazo.
- **Correlacionamento de Aquisição x Retorno Positivo:** Evidenciar onde o custo do Lead gerou "upside" em Receita.
- **Consistência de Tracking:** Uma análise clara de onde estamos tendo perdas de rastreamento ou dados sujos.
</aside>

---

## **📌 Formato de Envio**

---

Recomendado: Arquivo `.CSV` (separador: `,`), encoding UTF-8. (Veja o arquivo modelo `Template_Leads_Eventos.csv` anexo).

[Template_Leads_Eventos.csv](Template_Leads_Eventos.csv)

# **📝 Dicionário de Dados Necessários (De/Para Detalhado)**

---

Para clareza técnica na extração, abaixo consta o cruzamento entre as informações mapeadas nas análises de negócio e as colunas correspondentes no banco:

### **🔴 Bloco 1: O Núcleo (Obrigatório Padrão)**

---

A fundação absoluta. Sem estes dados, sequer sabemos que o lead existe ou o que ele fez no sistema.

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual grupo de leads tem a conversão mais rápida para a primeira compra?*
- *Qual evento inicial de captura (ex: cadastro em newsletter vs formulário de orçamento direto) atrai os clientes com maior LTV posterior na esteira ideal?*

| Informação Solicitada (Negócio) | Coluna Correspondente (Banco SQL) | Tipo / Detalhamento |
| --- | --- | --- |
| **ID único do Lead/Cliente** | `field_user_id`, `id`, `field_email` e `field_phone` | Obrigatório (ID Universal de cruzamento - Pelo menos email preenchido) |
| **Data do Evento de Inscrição/Conversão** | `data` | Obrigatório (Formato Timestamp) |
| **Tipo do Evento** | `field_conversion_type` | Obrigatório (Ex: "Lead", "PageView", "Schedule"). Evita contagem duplicada de cliques misturados com leads reais. |
| **Tag de Funil / Nome do Evento** | `field_conversion` | Obrigatório (Ex: "Incriação no Lançamento A", "Precheckout no Lançamento B", "Cadastro na ISCA C"). |

### **🟡 Bloco 2: Atribuição de Tráfego e Otimização de CRM (Estratégico)**

---

Estes campos não impedem o rastreio do lead, mas **turbinam a otimização de campanhas** e a performance da equipe de vendas front-line.

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual campanha e criativo específico (UTM) trouxe os leads que mais retornaram em múltiplas compras num período de 6 meses?*
- *Em qual etapa do meu pipeline comercial (Contato, Agendamento ou Show) os leads gerados pelo "Canal A" costumam travar e esfriar?*
- *Considerando nossa taxa real de conversão financeira, qual o teto absoluto (CPL e CPMQL alvo) que podemos pagar por um lead no Meta Ads sem fechar no prejuízo?*

| Informação Solicitada (Negócio) | Coluna Correspondente (Banco SQL) | Tipo / Detalhamento |
| --- | --- | --- |
| **Nome do Lead (Opcional)** | `field_name` | **Opcional/Enriquecimento** (Facilita visualização no CRM) |
| **UTMs de Origem do Lead** | `utm_source` (Canal), `utm_medium` (Público), `utm_campaign` (Campanha), `utm_content` (Criativo), `utm_term` | **Opcional/Enriquecimento**(Obrigatório para ROI/CAC de Tráfego Pago e visão de Criativo) |
| **URLs Origem da Conversão** | `url_page_host`, `url_page_path`, `url_page_param` | **Opcional/Enriquecimento**(Apoia Analytics) |
| **ID do Formulário / Local Exato** | `idform` | **Opcional/Enriquecimento**(Identifica *qual* formulário na página converteu. Ex: "Formulário Topo", "Pop-up Saída"). |
| **Ação/Etapa do Funil Comercial** | `field_action` | **Opcional/Enriquecimento**. Mapeia o pulso de CRM do lead no processo de vendas longo. Ex: `1_Lead_Gerado` -> `2_Contato_Feito` -> `3_Agendamento_Realizado` -> `4_Confirmacao_Presenca` -> `5_Show_Comparecimento`. |
| **Meio/Origem do Contato** | `field_form_type` | **Opcional/Enriquecimento**. Identifica de onde ou como o lead conversou. Ex: `Formulário de Cadastro`, `Contato Receptivo (Inbound Whatsapp)`, `Contato Ativo (Outbound Ligações)`. |