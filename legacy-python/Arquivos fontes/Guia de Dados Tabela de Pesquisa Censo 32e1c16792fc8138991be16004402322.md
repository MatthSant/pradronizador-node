# Guia de Dados: Tabela de Pesquisa/Censo

---

Os dados qualitativos e declarados pelos clientes no decorrer das campanhas (por meio de formulários, onboarding, censos da base).

Adicionar essa camada à jornada do lead e de vendas nos leva ao **Nível 3 de Maturidade de Dados**.

<aside>
ℹ️

## **Cuidados gerais com a base de dados:**

---

1. **Tratamento de Dados em Branco (Nulls vs Textos Vazios):** Se o cliente pulou uma pergunta ou não possui a informação, o sistema deve exportar o campo inteiramente vazio (NULL clássico de banco de dados). Evite lógicas hardcoded que preenchem buracos com textos como `"N/A"`, `"Não Informado"`, ou `"-"`. O texto suja os algoritmos de clusterização demográfica.
2. **Consistência Estrutural do ID de Casamento:** O ID ou Email exportado obrigatoriamente nesta visualização precisa seguir o mesmo padrão de sanitização da tabela de Leads. Se o e-mail estiver divergente dessa base transacional, todo o fluxo demográfico se perde numa ponta solta ("orphaned record").
</aside>

<aside>
🧙‍♀️

## **O que essa tabela desbloqueia?**

---

Ao darmos "um rosto" e "um contexto" aos números financeiros, extraímos os vetores de crescimento:

- **Estudo de Perfis Ideais (ICP) e Segmentação:** Clareza matemática baseada em LTV sobre "Quem me traz a maior conversão" (Curto Prazo) vs "Quem me deixa o maior LTV frente ao CAC" (Médio Prazo).
- **Clusterização no Prisma de Públicos:** Divisão das personas ao longo de um prisma comportamental para saber formatar os anúncios ideais e campanhas de CRM.
- **Projeção de Cenários e Disponibilidade:** Cruzamento da quantidade de público disponível nos perfis ideais versus a tração necessária.
- **LTV por Perfil e Comportamento:** Como traços e contextos específicos alteram o comportamento e a retenção de médio e longo prazo.
</aside>

## **📌 Formato de Envio e Dicionário Obrigatório**

---

Para que possamos realizar os cruzamentos sociodemográficos, é **imprescindível** o envio de dois arquivos:

1. **A Base de Respostas**
    - Recomendado: Arquivo `.CSV` (separador: `,`), encoding UTF-8.
    - Cada linha deve representar *um* envio de formulário de *um* ID. Múltiplas colunas para cada resposta.
    - (Veja o arquivo modelo `Template_Pesquisas.csv` anexo).
    
    [Template_Pesquisas.csv](Template_Pesquisas.csv)
    
2. **O Dicionário dos Campos Customizados (De/Para)**
    - Um arquivo simples (CSV, Excel ou bloco de notas) explicando o que significa o conceito por trás de cada coluna `custom_field`.
    - Se o negócio nos envia apenas os dados soltos, o analista não consegue adivinhar se o *"Sim"* no `custom_field_7` significa *"Sim, eu sou casado"* ou *"Sim, pretendo investir 10 mil reais"*.
    - **Formato esperado ("De" ➔ "Para"):**
        - `custom_field_1` ➔ *Qual a sua maior dor hoje?*
        - `custom_field_2` ➔ *Qual seu objetivo com a empresa?*
        - `custom_field_3` ➔ *Já contratou concorrentes?*
    - (Veja o arquivo modelo `Template_Dicionario_CustomFields.csv` anexo).
    
    [Template_Dicionario_CustomFields.csv](Template_Dicionario_CustomFields.csv)
    

---

# **📝 Dicionário de Dados Necessários (De/Para Detalhado)**

---

Para garantir a integração exata dos dados de formulários e questionários, listamos o "De/Para" com as colunas baseadas na estrutura existente:

### **🔴 Bloco 1: O Núcleo e Origem (Obrigatório)**

---

A fundação do registro. Determina quem respondeu, quando, e em qual contexto (formulário/ponto de coleta).

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual ponto de coleta (ex: Formulário de Onboarding vs Pop-up do Site) gera pesquisas com maior completude e qualidade?*

| Informação Solicitada (Negócio) | Coluna Correspondente (Banco SQL) | Tipo / Detalhamento |
| --- | --- | --- |
| **ID único do Lead/Cliente** | `field_user_id`, `id`, `field_email` e `field_phone` | Obrigatório (ID Universal para acoplar aos eventos de compras) |
| **Data da Resposta** | `data` | Obrigatório (Formato Timestamp) |
| **Nome do Lead (Opcional)** | `field_name` | Enriquecimento |
| **Ponto de Coleta/Formulário** | `idform`, `field_conversion`, `field_form_type` | Estratégico (Onde e como a pesquisa foi preenchida) |
| **URLs Origem da Pesquisa** | `url_page_host`, `url_page_path`, `url_page_param` | Estratégico (Apoia Analytics) |

### **🟡 Bloco 2: Perfilamento Demográfico e Financeiro (Obrigatório algum desses campos estar preenchido)**

---

A camada que dá rosto, bolso e contexto de vida aos números transacionais.

💡 **Exemplos de perguntas que este bloco responde:**

- *Qual faixa de renda ou área de atuação (Público-Alvo) possui a maior taxa de retenção natural e menor propensão a chargebacks?*
- *Clientes veteranos, que nos acompanham há mais tempo, percorrem nossa "esteira ideal" de transações mais rápido do que um lead recém-capturado?*

| Informação Solicitada (Negócio) | Coluna Correspondente (Banco SQL) | Tipo / Detalhamento |
| --- | --- | --- |
| **Dados Financeiros** | `field_income`, `field_familiar_income`, `field_wage_range` | Estratégico (Mapeia o poder de compra e bolso do cliente) |
| **Dados Pessoais** | `field_age`, `field_gender`, `field_education` | Estratégico |
| **Dados Profissionais** | `field_profession`, `field_profession_area` | Estratégico |
| **Geolocalização** | `field_state`, `field_region`, `field_city` | Estratégico |
| **Jornada/Consideração** | `field_time_following` | Estratégico ("Há quanto tempo nos acompanha?") |

### **🟢 Bloco 3: Variáveis de Negócio e Censos (Estratégico)**

---

Aqui mora o verdadeiro "ouro" da **análise psicográfica** de cada negócio em particular. São espaços flexíveis para absorver métricas e perguntas únicas que traduzam as dores, medos ou desejos da base.

⚠️ **REGRA DE OURO PARA CAMPOS CUSTOMIZADOS:** Estes **não** são apenas "campos de texto livre para lixo". Eles devem ser mantidos como um **padrão estrutural do negócio**. Se a **Pesquisa A** pergunta *"Qual o seu principal objetivo?"* e mapeia a resposta no `custom_field_1`, então caso a **Pesquisa B** ou **Pesquisa C** façam essa mesmíssima pergunta lógica, a resposta delas **DEVE OBRIGATORIAMENTE** entrar no mesmo `custom_field_1`. Isso unifica o dado e impede que clientes com o mesmo perfil fiquem fragmentados em colunas diferentes no banco de dados.

| Informação Solicitada (Negócio) | Coluna Correspondente (Banco SQL) | Tipo / Detalhamento |
| --- | --- | --- |
| **NPS (Net Promoter Score)** | `field_nps` | **Estratégico.** Métrica de satisfação (0 a 10). Vital para descobrir se detratores dão mais churn financeiro e qual perfil demográfico é mais promotor. |
| **Perguntas e Variáveis Específicas** | De `custom_field_1` a `custom_field_50` | **Estratégico.** Onde mapeamos o ouro das análises psicográficas e objeções do negócio. |