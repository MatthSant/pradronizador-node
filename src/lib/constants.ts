export const FIELD_DESCRIPTIONS: Record<string, { name: string; desc: string; category: 'global' | 'events' | 'transactions' | 'survey' }> = {
    // GLOBAL / SHARED (Present in multiple templates)
    "id": { "name": "ID do Lead / Resposta", "desc": "ID secundário ou identificador da resposta.", "category": "global" },
    "field_email": { "name": "Email (Obrigatório)", "desc": "Email do lead em minúsculas e sem espaços.", "category": "global" },
    "field_phone": { "name": "Telefone", "desc": "Número de WhatsApp ou celular de contato.", "category": "global" },
    "field_name": { "name": "Nome do Cliente", "desc": "Nome do Lead (Opcional).", "category": "global" },
    "data": { "name": "Data (Obrigatório)", "desc": "Data da conversão ou resposta.", "category": "global" },
    "idform": { "name": "ID do Formulário", "desc": "Identifica em qual ponto físico do site os dados foram preenchidos.", "category": "global" },
    "field_form_type": { "name": "Canal de Contato", "desc": "Ex: Formulário, Inbound Whatsapp, Inbox.", "category": "global" },
    "url_page_host": { "name": "URL Host", "desc": "Domínio Principal.", "category": "global" },
    "url_page_path": { "name": "URL Path", "desc": "Caminho da URL final.", "category": "global" },
    "url_page_param": { "name": "URL Parâmetros", "desc": "Parâmetros pós-'?'.", "category": "global" },
    "utm_source": { "name": "UTM Source (Origem)", "desc": "Canal. Ex: 'facebook_ads', 'google'.", "category": "global" },
    "utm_medium": { "name": "UTM Medium (Meio)", "desc": "Público do anúncio.", "category": "global" },
    "utm_campaign": { "name": "UTM Campaign (Campanha)", "desc": "Campanha Paga.", "category": "global" },
    "utm_content": { "name": "UTM Content (Conteúdo)", "desc": "Nome do Criativo.", "category": "global" },
    "utm_term": { "name": "UTM Term (Termo)", "desc": "Público Search ou termo do anúncio.", "category": "global" },
    "field_state": { "name": "Estado (UF)", "desc": "Unidade Federativa.", "category": "global" },
    "field_city": { "name": "Cidade", "desc": "Cidade do usuário.", "category": "global" },
    "field_country": { "name": "País", "desc": "País de origem ou cobrança.", "category": "global" },

    // EVENTS SPECIFIC
    "field_conversion_type": { "name": "Tipo do Evento", "desc": "Ex: 'Lead', 'PageView', 'Schedule'.", "category": "events" },
    "field_conversion": { "name": "Tag de Funil / Evento", "desc": "Nome que o Lead recebe. Ex: 'Inscrição no Lançamento A'.", "category": "events" },
    "field_action": { "name": "Etapa do Funil Comercial", "desc": "Usado para CRM Comercial longo.", "category": "events" },

    // TRANSACTIONS SPECIFIC
    "field_transaction_code": { "name": "ID Transação/Pedido (Obrigatório)", "desc": "ID único daquela compra. Essencial para não duplicar vendas.", "category": "transactions" },
    "field_transaction_date": { "name": "Data da Transação (Obrigatório)", "desc": "Data que o pedido foi feito na plataforma (Não usar update).", "category": "transactions" },
    "field_document": { "name": "CPF/CNPJ do Cliente", "desc": "Documento de identificação.", "category": "transactions" },
    "field_product": { "name": "Nome do Produto (Obrigatório)", "desc": "Nome comercial do seu curso/serviço.", "category": "transactions" },
    "field_product_code": { "name": "ID/SKU do Produto", "desc": "Código identificador do plano interno.", "category": "transactions" },
    "field_quantity": { "name": "Quantidade Comprada", "desc": "Quantidade do mesmo produto que foi para o carrinho.", "category": "transactions" },
    "field_transaction_value": { "name": "Valor Transacionado Bruto", "desc": "Quanto valia a transação cheia (sem tirar taxa).", "category": "transactions" },
    "field_net_value": { "name": "Valor Líquido", "desc": "Lucro ou Valor real que caiu após a remoção de taxas.", "category": "transactions" },
    "field_marketplace_comission": { "name": "Comissão/Taxa da Plataforma", "desc": "Quanto a plataforma cobrou pelo processamento.", "category": "transactions" },
    "field_transaction_status": { "name": "Status da Transação (Obrigatório)", "desc": "Aprovado, Aguardando, Boleto Impresso, Chargeback.", "category": "transactions" },
    "field_cancellation_date": { "name": "Data de Cancelamento/Refund", "desc": "Data que ocorreu o Churn ou solicitação do estorno.", "category": "transactions" },
    "field_offer": { "name": "Variante da Oferta", "desc": "Variação de precificação ou oferta (Descontos nativos).", "category": "transactions" },
    "field_offer_code": { "name": "Código da Oferta", "desc": "Link do Cód. Checkout.", "category": "transactions" },
    "field_source": { "name": "Plataforma/Gateway", "desc": "Onde ela foi feita. Ex: Hotmart, Kiwify, MercadoPago.", "category": "transactions" },
    "field_seller": { "name": "ID do Vendedor", "desc": "Vendedor responsável pela conversão (Comercial).", "category": "transactions" },
    "field_charge_type": { "name": "Tipo de Cobrança", "desc": "Ex: Cobrança Única, Mensalidade ou Recorrência.", "category": "transactions" },
    "conversion": { "name": "Tag / Evento (Venda)", "desc": "O que registou essa compra via UTM orgânica?", "category": "transactions" },
    "field_payment_method": { "name": "Meio de Pagamento", "desc": "Cartão de Crédito, PIX, Boleto.", "category": "transactions" },
    "field_installments": { "name": "Número de Parcelas", "desc": "Quantas vezes a pessoa usou o cartão.", "category": "transactions" },
    "field_charge_amount": { "name": "Ordem Mensalidade (Recorrência)", "desc": "Para medir Cohort. Mensalidade 1, 2, 3...", "category": "transactions" },
    "field_transaction_type": { "name": "Tipo de Item Vendido", "desc": "Item principal ou Order Bump / Upsell secundário?", "category": "transactions" },
    "field_coupon": { "name": "Cupom de Desconto", "desc": "Cupom aplicado no checkout.", "category": "transactions" },
    "field_zip_code": { "name": "CEP / Zip Code", "desc": "CEP para cálculo de frete ou geolocalização.", "category": "transactions" },
    "field_neighborhood": { "name": "Bairro", "desc": "Bairro de entrega/cobrança.", "category": "transactions" },

    // SURVEY SPECIFIC
    "field_income": { "name": "Renda Individual", "desc": "A pessoa declarou qual salário / lucro bruto?", "category": "survey" },
    "field_familiar_income": { "name": "Renda Familiar Agregada", "desc": "Montante familiar.", "category": "survey" },
    "field_wage_range": { "name": "Faixa Salarial IBGE", "desc": "Ex: Classe A, B, C.", "category": "survey" },
    "field_age": { "name": "Idade Ativa", "desc": "Data de nascimento ou idade preenchida.", "category": "survey" },
    "field_gender": { "name": "Gênero Declarado", "desc": "Homem, Mulher, Outros...", "category": "survey" },
    "field_education": { "name": "Escolaridade e Graduação", "desc": "Nível de instrução.", "category": "survey" },
    "field_profession": { "name": "Cargo Atual / Profissão", "desc": "Engenheiro, Médico, etc.", "category": "survey" },
    "field_profession_area": { "name": "Ecossistema / Indústria", "desc": "Tecnologia, Saúde, Educação.", "category": "survey" },
    "field_region": { "name": "Região Demográfica", "desc": "Norte, Sul, Sudeste.", "category": "survey" },
    "field_time_following": { "name": "Tempo que nos conhece", "desc": "Mapeia maturidade.", "category": "survey" },
    "field_nps": { "name": "NPS (Satisfação 0-10)", "desc": "Mede detrator x promotor.", "category": "survey" }
};

export const TRANS_STATUS_MAP: Record<string, string> = {
    'paid': 'approved', 'approved': 'approved', 'paga': 'approved', 'aprovada': 'approved',
    'completo': 'approved', 'concluída': 'approved', 'concluida': 'approved', 'entregue': 'approved',
    'aprovado': 'approved', 'success': 'approved', 'authorized': 'approved',
    'waiting_payment': 'pending', 'pending': 'pending', 'pendente': 'pending',
    'aguardando_pagamento': 'pending', 'em_processamento': 'pending', 'waiting': 'pending',
    'aguardando': 'pending', 'boleto_impresso': 'pending', 'billet_printed': 'pending',
    'refused': 'cancelled', 'cancelled': 'cancelled', 'cancelada': 'cancelled', 'failed': 'cancelled',
    'rejeitada': 'cancelled', 'cancelado': 'cancelled', 'negada': 'cancelled', 'falhou': 'cancelled',
    'estornado_por_fraude': 'cancelled',
    'refunded': 'refunded', 'reembolsada': 'refunded', 'estornada': 'refunded', 'reembolsado': 'refunded',
    'chargeback': 'refunded', 'contestada': 'refunded'
};

export const HARD_MAPPINGS: Record<string, string> = {
    "Código da transação": "field_transaction_code",
    "Nome do(a) Afiliado(a) + Comprador(a)": "field_name",
    "Email do(a) Comprador(a)": "field_email",
    "Telefone": "field_phone",
    "Documento": "field_document",
    "Data da transação": "field_transaction_date",
    "Código do produto + Produto + Faturamento líquido do(a) Produtor(a) + Faturamento do(a) Coprodutor(a) + Transação do Produto Principal": "field_product",
    "Produto": "field_product",
    "Código do produto": "field_product_code",
    "Faturamento líquido": "field_net_value",
    "Status da transação": "field_transaction_status",
    "Código SCK": "utm_term",
    "Bairro": "field_neighborhood",
    "Código do preço": "field_offer_code",
    "Nome deste preço": "field_offer",
    "Quantidade total de parcelas": "field_installments",
    "Quantidade de cobranças": "field_charge_amount",
    "Código de cupom": "field_coupon",
    "Quantidade de itens": "field_quantity",
    "Comprador(a)": "field_name",
    "País": "field_country",
    "Código postal": "field_zip_code",
    "Cidade": "field_city",
    "Estado/Província": "field_state",
    "Valor de compra com impostos": "field_transaction_value"
};

export const UNIVERSAL_PRESETS: Record<string, string> = {
    "email": "field_email",
    "phone": "field_phone",
    "telefone": "field_phone",
    "name": "field_name",
    "nome": "field_name",
    "utm_source": "utm_source",
    "utm_medium": "utm_medium",
    "utm_campaign": "utm_campaign",
    "utm_content": "utm_content",
    "utm_term": "utm_term",
    "data": "data",
    "date": "data"
};

export const PLATFORM_PRESETS: Record<string, Record<string, string>> = {
    "transactions": {
        "codigodatransacao": "field_transaction_code",
        "emaildocomprador": "field_email",
        "telefone": "field_phone",
        "datatransacao": "field_transaction_date",
        "statusdatatransacao": "field_transaction_status"
    }
};
