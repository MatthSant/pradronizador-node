import streamlit as st
import pandas as pd
from io import BytesIO
import re
import os
import tempfile
import gc

FIELD_DESCRIPTIONS = {
    # EVENTS
    "field_email": {"name": "Email (Obrigatório)", "desc": "Email do lead em minúsculas e sem espaços." },
    "field_phone": {"name": "Telefone", "desc": "Número de WhatsApp ou celular de contato." },
    "field_name": {"name": "Nome do Cliente", "desc": "Nome do Lead (Opcional)." },
    "data": {"name": "Data do Evento", "desc": "Data na qual ele entrou na página/formulário." },
    "field_conversion_type": {"name": "Tipo do Evento", "desc": "Ex: 'Lead', 'PageView', 'Schedule'." },
    "field_conversion": {"name": "Tag de Funil / Evento", "desc": "Nome que o Lead recebe. Ex: 'Inscrição no Lançamento A'." },
    "idform": {"name": "ID / Nome do Formulário", "desc": "Identifica em qual ponto físico do site ele preencheu dados." },
    "url_page_host": {"name": "URL Host", "desc": "Domínio Principal." },
    "url_page_path": {"name": "URL Path", "desc": "Caminho da URL final." },
    "url_page_param": {"name": "URL Parâmetros", "desc": "Parâmetros pós-'?'" },
    "utm_source": {"name": "UTM Source (Origem)", "desc": "Canal. Ex: 'facebook_ads', 'google'." },
    "utm_medium": {"name": "UTM Medium (Meio)", "desc": "Público do anúncio." },
    "utm_campaign": {"name": "UTM Campaign (Campanha)", "desc": "Campanha Paga." },
    "utm_content": {"name": "UTM Content (Conteúdo)", "desc": "Nome do Criativo." },
    "utm_term": {"name": "UTM Term (Termo)", "desc": "Público Search ou termo do anúncio." },
    "field_action": {"name": "Etapa do Funil Comercial", "desc": "Usado para CRM Comercial longo." },
    "field_form_type": {"name": "Canal de Contato", "desc": "Ex: Formulário, Inbound Whatsapp, Telefone." },

    # TRANSACTIONS
    "field_transaction_code": {"name": "ID Transação/Pedido (Obrigatório)", "desc": "ID único daquela compra. Essencial para não duplicar vendas." },
    "field_transaction_date": {"name": "Data da Transação (Obrigatório)", "desc": "Data que o pedido foi feito na plataforma (Não usar update)." },
    "field_product": {"name": "Nome do Produto (Obrigatório)", "desc": "Nome comercial do seu curso/serviço." },
    "field_product_code": {"name": "ID/SKU do Produto", "desc": "Código identificador do plano interno." },
    "field_quantity": {"name": "Quantidade Comprada", "desc": "Quantidade do mesmo produto que foi para o carrinho." },
    "field_transaction_value": {"name": "Valor Transacionado Bruto", "desc": "Quanto valia a transação cheia (sem tirar taxa)." },
    "field_net_value": {"name": "Valor Líquido", "desc": "Lucro ou Valor real que caiu após a remoção de taxas." },
    "field_marketplace_comission": {"name": "Comissão/Taxa da Plataforma", "desc": "Quanto a plataforma cobrou pelo processamento." },
    "field_transaction_status": {"name": "Status da Transação (Obrigatório)", "desc": "Aprovado, Aguardando, Boleto Impresso, Chargeback." },
    "field_cancellation_date": {"name": "Data de Cancelamento/Refund", "desc": "Data que ocorreu o Churn ou solicitação do estorno." },
    "field_offer": {"name": "Variante da Oferta", "desc": "Variação de precificação ou oferta (Descontos nativos)." },
    "field_offer_code": {"name": "Código da Oferta", "desc": "Link do Cód. Checkout." },
    "field_source": {"name": "Plataforma/Gateway", "desc": "Onde ela foi feita. Ex: Hotmart, Kiwify, MercadoPago." },
    "field_charge_type": {"name": "Tipo de Cobrança", "desc": "Ex: Cobrança Única Mensalidade Avulsa ou Recorrência Fixa." },
    "conversion": {"name": "Tag / Evento", "desc": "O que registou essa compra via UTM orgânica?" },
    "field_payment_method": {"name": "Meio de Pagamento", "desc": "Cartão de Crédito, PIX, Boleto." },
    "field_installments": {"name": "Número de Parcelas", "desc": "Quantas vezes a pessoa usou o cartão (Apenas números)." },
    "field_charge_amount": {"name": "Ordem Mensalidade (Recorrência)", "desc": "Para medir Cohort. É a mensalidade 1? Ou já está na renovação 3?" },
    "field_transaction_type": {"name": "Tipo de Item Vendido", "desc": "Foi o item principal ou foi um Order Bump / Upsell secundário?" },
    "field_coupon": {"name": "Cupom de Desconto", "desc": "Cupom aplicado caso via oferta relâmpago." },
    "field_zip_code": {"name": "CEP / Zip Code", "desc": "CEP para cálculo de calor de frete." },
    "field_state": {"name": "Estado (UF)", "desc": "" },
    "field_city": {"name": "Cidade", "desc": "" },
    "field_neighborhood": {"name": "Bairro", "desc": "" },

    # SURVEY
    "field_income": {"name": "Renda Individual", "desc": "A pessoa declarou qual salário / lucro bruto?" },
    "field_familiar_income": {"name": "Renda Familiar Agregada", "desc": "Montante familiar." },
    "field_wage_range": {"name": "Faixa Salarial IBGE", "desc": "Ex: Classe A, B, C." },
    "field_age": {"name": "Idade Ativa", "desc": "Data de nascimento ou idade preenchida." },
    "field_gender": {"name": "Gênero Declarado", "desc": "Homem, Mulher, Outros..." },
    "field_education": {"name": "Escolaridade e Graduação", "desc": "Analfabeto, Nível Superior..." },
    "field_profession": {"name": "Cargo Atual / Profissão", "desc": "Engenheiro, Médico." },
    "field_profession_area": {"name": "Ecossistema/Saga de Indústria", "desc": "Tecnologia, Saúde, Educação." },
    "field_region": {"name": "Região Demográfica", "desc": "Norte, Sul, Sudeste." },
    "field_time_following": {"name": "Há quanto tempo nos Sabe?", "desc": "Mapeia maturidade antes do cliente entrar." },
    "field_nps": {"name": "NPS (Satisfação 0-10)", "desc": "Mede detrator x promotor." }
}

TRANS_STATUS_MAP = {
    # Approved
    'paid': 'approved', 'approved': 'approved', 'paga': 'approved', 'aprovada': 'approved', 
    'completo': 'approved', 'concluída': 'approved', 'concluida': 'approved', 'entregue': 'approved',
    'aprovado': 'approved', 'success': 'approved', 'authorized': 'approved',
    
    # Pending
    'waiting_payment': 'pending', 'pending': 'pending', 'pendente': 'pending', 
    'aguardando_pagamento': 'pending', 'em_processamento': 'pending', 'waiting': 'pending',
    'aguardando': 'pending', 'boleto_impresso': 'pending', 'billet_printed': 'pending',
    
    # Cancelled
    'refused': 'cancelled', 'cancelled': 'cancelled', 'cancelada': 'cancelled', 'failed': 'cancelled', 
    'rejeitada': 'cancelled', 'cancelado': 'cancelled', 'negada': 'cancelled', 'falhou': 'cancelled',
    'estornado_por_fraude': 'cancelled',
    
    # Refunded
    'refunded': 'refunded', 'reembolsada': 'refunded', 'estornada': 'refunded', 'reembolsado': 'refunded',
    'chargeback': 'refunded', 'contestada': 'refunded'
}

HARD_MAPPINGS = {
    "Código da transação": "field_transaction_code",
    "Nome do(a) Afiliado(a) + Comprador(a)": "field_name",
    "Email do(a) Comprador(a)": "field_email",
    "Telefone": "field_phone",
    "Documento": "field_cpf",
    "Data da transação": "field_transaction_date",
    "Código do produto + Produto + Faturamento líquido do(a) Produtor(a) + Faturamento do(a) Coprodutor(a) + Transação do Produto Principal": "field_product",
    "Quantidade de itens": "field_quantity",
    "Valor de compra com impostos": "field_transaction_value",
    "Faturamento líquido": "field_net_value",
    "Status da transação": "field_transaction_status",
    "Nome deste preço": "field_offer",
    "Código do preço": "field_offer_code",
    "Tipo de cobrança": "field_charge_type",
    "Código SCK": "utm_term",
    "Método de pagamento": "field_payment_method",
    "Quantidade total de parcelas": "field_installments",
    "Quantidade de cobranças": "field_charge_amount",
    "Código de cupom": "field_coupon",
    "Código postal": "field_zip_code",
    "Estado / Província": "field_state",
    "Cidade": "field_city",
    "Bairro": "field_neighborhood"
}

# Mapeamentos exatos por plataforma/tabela.
# Chave externa = table_name, chave interna = nome de coluna normalizado (sem acentos, lowercase, sem espaços/símbolos)
# Valor = campo destino no banco. Use "__SKIP__" para explicitamente não mapear.
import unicodedata as _ud

def _norm(s):
    s = _ud.normalize('NFKD', s).encode('ASCII', 'ignore').decode('utf-8')
    return re.sub(r'[^a-zA-Z0-9]', '', s.lower())

PLATFORM_PRESETS = {
    "Transactions": {
        _norm("Código da transação"):                                                                                       "field_transaction_code",
        _norm("Nome do(a) Afiliado(a) + Comprador(a)"):                                                                    "field_name",
        _norm("Email do(a) Comprador(a)"):                                                                                  "field_email",
        _norm("Telefone"):                                                                                                  "field_phone",
        _norm("Documento"):                                                                                                 "field_cpf",
        _norm("Data da transação"):                                                                                         "field_transaction_date",
        _norm("Código do produto + Produto + Faturamento líquido do(a) Produtor(a) + Faturamento do(a) Coprodutor(a) + Transação do Produto Principal"): "field_product",
        _norm("Quantidade de itens"):                                                                                       "field_quantity",
        _norm("Valor de compra com impostos"):                                                                              "field_transaction_value",
        _norm("Faturamento líquido"):                                                                                       "field_net_value",
        _norm("Status da transação"):                                                                                       "field_transaction_status",
        _norm("Nome deste preço"):                                                                                          "field_offer",
        _norm("Código do preço"):                                                                                           "field_offer_code",
        _norm("Tipo de cobrança"):                                                                                          "field_charge_type",
        _norm("Código SCK"):                                                                                                "utm_term",
        _norm("Método de pagamento"):                                                                                       "field_payment_method",
        _norm("Quantidade total de parcelas"):                                                                              "field_installments",
        _norm("Quantidade de cobranças"):                                                                                   "field_charge_amount",
        _norm("Código de cupom"):                                                                                           "field_coupon",
        _norm("Código postal"):                                                                                             "field_zip_code",
        _norm("Estado / Província"):                                                                                        "field_state",
        _norm("Cidade"):                                                                                                    "field_city",
        _norm("Bairro"):                                                                                                    "field_neighborhood",
        # Colunas da Hotmart que não possuem campo destino → ignorar
        _norm("Código do produto"):                                                                                         "__SKIP__",
    }
}

# Aliases universais que valem em TODAS as tabelas (variações comuns de nomes de campo)
UNIVERSAL_PRESETS = {
    # E-mail em todas as variações
    _norm("email"):         "field_email",
    _norm("e-mail"):        "field_email",
    _norm("e_mail"):        "field_email",
    _norm("Email"):         "field_email",
    _norm("E-mail"):        "field_email",
    _norm("E-Mail"):        "field_email",
    # Telefone
    _norm("phone"):         "field_phone",
    _norm("telefone"):      "field_phone",
    _norm("celular"):       "field_phone",
    _norm("whatsapp"):      "field_phone",
    _norm("wpp"):           "field_phone",
    # Nome
    _norm("name"):          "field_name",
    _norm("nome"):          "field_name",
    # UTM Source
    _norm("utm_source"):    "utm_source",
    _norm("utm-source"):    "utm_source",
    _norm("utmsource"):     "utm_source",
    _norm("source"):        "utm_source",
    # UTM Medium
    _norm("utm_medium"):    "utm_medium",
    _norm("utm-medium"):    "utm_medium",
    _norm("utmmedium"):     "utm_medium",
    # UTM Campaign
    _norm("utm_campaign"):  "utm_campaign",
    _norm("utm-campaign"):  "utm_campaign",
    _norm("utmcampaign"):   "utm_campaign",
    _norm("campaign"):      "utm_campaign",
    # UTM Content
    _norm("utm_content"):   "utm_content",
    _norm("utm-content"):   "utm_content",
    _norm("utmcontent"):    "utm_content",
    # UTM Term
    _norm("utm_term"):      "utm_term",
    _norm("utm-term"):      "utm_term",
    _norm("utmterm"):       "utm_term",
}

def _to_clean_utf8(raw_bytes):
    """Converte qualquer arquivo de texto para UTF-8 limpo sem surrogates."""
    # UTF-16 com BOM
    if raw_bytes[:2] in (b'\xff\xfe', b'\xfe\xff'):
        return raw_bytes.decode('utf-16', errors='replace').encode('utf-8', errors='replace')
    # UTF-16 LE sem BOM (bytes pares nulos)
    if len(raw_bytes) > 4 and raw_bytes[1:2] == b'\x00':
        try:
            return raw_bytes.decode('utf-16-le', errors='replace').encode('utf-8', errors='replace')
        except:
            pass
    # UTF-8 limpo? Tenta sem herdar erros de codificação
    try:
        text = raw_bytes.decode('utf-8')
        # Verifica se é encodável sem erros (rejeita surrogates aqui no teste)
        text.encode('utf-8') 
        return raw_bytes
    except:
        pass

    # Latin1 (fallback absoluto)
    return raw_bytes.decode('latin1', errors='replace').encode('utf-8', errors='replace')


def _clean_all(obj):
    """Sanitização Universal: Remove surrogates de strings, listas, dicts e DataFrames recursivamente."""
    if isinstance(obj, str):
        return obj.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
    elif isinstance(obj, list):
        return [_clean_all(i) for i in obj]
    elif isinstance(obj, dict):
        return {str(k): _clean_all(v) for k, v in obj.items()}
    elif isinstance(obj, pd.DataFrame):
        df = obj.copy()
        df.columns = [_clean_all(str(c)) for c in df.columns]
        for col in df.columns:
            if df[col].dtype == object:
                df[col] = df[col].apply(lambda v: _clean_all(v) if isinstance(v, str) else v)
        return df
    return obj



@st.cache_data(show_spinner=False)
def load_dataframe(_file_bytes, filename, filesize, sep, enc, nrows=None, _v=5):
    """
    Carrega o dataframe com cache forçado (versão 2) para limpar dados sujos de tentativas passadas.
    """
    file_name_lower = filename.lower()
    if file_name_lower.endswith('.csv'):
        # Pré-processa bytes para UTF-8 limpo
        clean_bytes = _to_clean_utf8(_file_bytes)

        def _try(b, s, e):
            return _clean_all(pd.read_csv(BytesIO(b), sep=s, encoding=e, dtype=str, nrows=nrows, low_memory=True))

        try:
            return _try(clean_bytes, sep, enc)
        except Exception as e:
            err = str(e)
            for fallback_enc in ['utf-8-sig', 'latin1', 'cp1252', 'utf-16']:
                if fallback_enc != enc:
                    try:
                        return _try(clean_bytes, sep, fallback_enc)
                    except:
                        pass
            for alt_sep in [s for s in [';', ',', '\t', '|'] if s != sep]:
                try:
                    return _try(clean_bytes, alt_sep, enc)
                except:
                    pass
            try:
                df = pd.read_csv(BytesIO(clean_bytes), sep=sep, encoding=enc, dtype=str, engine='python', on_bad_lines='skip', nrows=nrows)
                return _clean_all(df)
            except:
                try:
                    df = pd.read_csv(BytesIO(clean_bytes), sep=sep, encoding=enc, dtype=str, engine='python', error_bad_lines=False)
                    return _clean_all(df)
                except:
                    pass
            raise Exception(f"Erro crítico ao ler arquivo: {err}")
    elif file_name_lower.endswith(('.xlsx', '.xls')):
        sample_rows = nrows if nrows is not None else None
        return _clean_all(pd.read_excel(BytesIO(_file_bytes), dtype=str, nrows=sample_rows))
    else:
        raise ValueError("Formato não suportado")





def get_formatted_targets(target_columns, custom_field_labels=None):
    """

    Retorna a lista de IDs de destino e um mapa de ID -> Label amigável.
    """
    target_ids = ["__NONE__"]
    id_to_label = {"__NONE__": "(Não Mapear)"}
    custom_field_labels = custom_field_labels or {}
    
    for col in target_columns:
        if col in FIELD_DESCRIPTIONS:
            name = FIELD_DESCRIPTIONS[col]['name']
            display = f"{name} ({col})"
        elif col.startswith("custom_field_"):
            label = custom_field_labels.get(col, "")
            if label:
                display = f"🟡 {label} ({col})"
            else:
                display = f"Campo Customizado ({col})"
        else:
            display = f"{col}"
            
        target_ids.append(col)
        id_to_label[col] = display
        
    return target_ids, id_to_label


def render_mapping_ui(template_file_path, table_name, unified_mode=False):
    st.header(f"Mapeamento de Dados: {table_name}")

    try:
        template_df = pd.read_csv(template_file_path)
        # Remove field_user_id/id caso existam nos templates
        target_columns = [col for col in template_df.columns if col not in ("field_user_id", "user_id", "id")]
    except Exception as e:
        st.error(f"Erro ao ler o arquivo de template: {e}")
        return

    st.markdown("### 1. Upload dos Arquivos do Cliente")
    uploaded_files = st.file_uploader("Envie os arquivos de dados (CSV ou Excel)", type=["csv", "xlsx", "xls"], accept_multiple_files=True, key=f"uploader_{table_name}")
    
    if uploaded_files:
        col1, col2 = st.columns(2)
        with col1:
            sep = st.selectbox("Separador Geral", [",", ";", "\t", "|"], key=f"sep_{table_name}")
        with col2:
            enc = st.selectbox("Encoding", ["utf-8", "latin1", "cp1252"], key=f"enc_{table_name}")
            
        st.markdown("---")
        st.markdown("### 2. Configuração Tabela a Tabela")
        st.write("Determine qual é o **caminho no banco (Para)** para cada coluna originada pelo seu arquivo.")
        
        all_metadata = {}
        all_mappings = {}      # Mapeamento do arquivo: key=source_col, value=target_col
        all_fixed_vals = {}    # Mapeamento de fixos: key=target_col, value=string fixa
        error_reading = False
        
        # ── Gerenciador de Campos Customizados (Apenas Survey) ───────────────────
        cf_state_key = f"custom_fields_{table_name}"
        if table_name == "wtl_survey":
            if cf_state_key not in st.session_state:
                base_custom_cols = [c for c in target_columns if c.startswith("custom_field_")]
                st.session_state[cf_state_key] = [{"key": c, "label": ""} for c in base_custom_cols]

            with st.expander("🟡 Dicionário de Campos Customizados", expanded=False):
                st.markdown(
                    "Crie os campos customizados do seu censo/pesquisa. "
                    "Dê um nome com **significado real** para cada slot — ele aparecerá assim no mapeamento De/Para abaixo."
                )
                fields = st.session_state[cf_state_key]
                to_delete = []
                for idx, cf in enumerate(fields):
                    c1, c2 = st.columns([1, 5])
                    with c1:
                        st.markdown(f"<br><code>{cf['key']}</code>", unsafe_allow_html=True)
                    with c2:
                        new_label = st.text_input(
                            "Significado / Pergunta",
                            value=cf["label"],
                            placeholder="Ex: Qual sua maior dor hoje?",
                            key=f"cf_label_{table_name}_{idx}",
                            label_visibility="collapsed"
                        )
                        fields[idx]["label"] = new_label
                    if st.button("🗑️", key=f"cf_del_{table_name}_{idx}", help="Remover este campo"):
                        to_delete.append(idx)

                for idx in reversed(to_delete):
                    fields.pop(idx)

                st.divider()
                if st.button("➕ Adicionar novo campo customizado", key=f"cf_add_{table_name}"):
                    next_n = len(fields) + 1
                    existing_keys = {f["key"] for f in fields}
                    while f"custom_field_{next_n}" in existing_keys:
                        next_n += 1
                    fields.append({"key": f"custom_field_{next_n}", "label": ""})
                    st.rerun()

                st.session_state[cf_state_key] = fields
        else:
            if cf_state_key not in st.session_state:
                st.session_state[cf_state_key] = []

        # ── Banco de Dados de Mapeamento Centralizado ─────────────────────────────
        # Esse dicionário é a ORIGEM DA VERDADE. Widgets podem resetar, ele NÃO.
        map_db_key = f"mapping_db_{table_name}"
        if map_db_key not in st.session_state:
            st.session_state[map_db_key] = {}
        mapping_db = st.session_state[map_db_key]

        # Injeta os campos customizados apenas se for Survey
        custom_field_labels = {}
        if table_name == "wtl_survey":
            for cf in st.session_state[cf_state_key]:
                if cf["key"] not in target_columns:
                    target_columns.append(cf["key"])
                custom_field_labels[cf["key"]] = cf["label"] if cf["label"] else cf["key"]
        else:
            # Garante que para outras tabelas, campos customizados originais do template sejam removidos
            target_columns = [c for c in target_columns if not c.startswith("custom_field_")]

        target_ids, id_to_label = get_formatted_targets(target_columns, custom_field_labels)


        # Otimização extrema: Carrega uma casca miniatura apenas uma única vez para montar o De/Para limpo
        def _sanitize_df(df):
            """Remove caracteres surrogados de colunas e células para evitar erros de serialização."""
            def clean_str(val):
                if isinstance(val, str):
                    return val.encode('utf-8', errors='replace').decode('utf-8', errors='replace')
                return val
            # 1. Limpa colunas
            df.columns = [clean_str(c) for c in df.columns]
            # 2. Limpa células
            return df.applymap(clean_str)
        
        def _safe_msg(err):
            """Garante que a mensagem de erro não contenha surrogates que quebrem o Streamlit."""
            return str(err).encode('utf-8', errors='replace').decode('utf-8', errors='replace')
        
        for uf in uploaded_files:
            cache_key = f"meta_{uf.name}_{uf.size}_{sep}_{enc}"
            if cache_key not in st.session_state:
                try:
                    #Memory Fix: Lê apenas o cabeçalho para metadados da UI
                    df_cliente = load_dataframe(uf.getvalue(), uf.name, uf.size, sep, enc, nrows=10)
                    # Limpeza das colunas inuteis
                    df_cliente = df_cliente.replace(r'^\s*$', None, regex=True).dropna(axis=1, how='all')
                    # Sanitiza surrogates antes de salvar no session_state
                    df_cliente = _sanitize_df(df_cliente)
                    
                    st.session_state[cache_key] = {
                        "head": df_cliente.head(2),
                        "columns": df_cliente.columns.tolist(),
                        "len": len(df_cliente)
                    }
                except Exception as e:
                    st.error(f"Erro ao ler arquivo {uf.name}: {_safe_msg(e)}")
                    error_reading = True
                    break

                    
            if cache_key in st.session_state:
                all_metadata[uf.name] = st.session_state[cache_key]
                
        if error_reading:
            return

        # ── COLETA DE COLUNAS UNIFICADAS (Modo Centrado na Origem) ───────────────
        unique_source_cols = []
        if unified_mode:
            temp_cols = set()
            for meta in all_metadata.values():
                temp_cols.update(meta['columns'])
            unique_source_cols = sorted(list(temp_cols))

        # ── MAPEAMENTO UNIFICADO (Origem -> Destino) ────────────────────────────
        if unified_mode:
            st.markdown("### 🎯 Mapeamento Unificado de Colunas")
            st.info("💡 Abaixo estão todas as colunas únicas encontradas nos seus arquivos. Escolha o destino para as que deseja importar. Colunas não mapeadas serão ignoradas.")
            
            if "global_source_map" not in mapping_db: 
                mapping_db["global_source_map"] = {}
            
            with st.container(border=True):
                cols = st.columns(3)
                for i, s_col in enumerate(unique_source_cols):
                    with cols[i % 3]:
                        # Tenta sugerir um destino baseado no nome da coluna de origem
                        default_t_idx = 0
                        s_norm = _norm(s_col)
                        
                        # Atalho: Se já mapeou antes nesta sessão, mantém
                        current_t_id = mapping_db["global_source_map"].get(s_col)
                        
                        if not current_t_id:
                            # 1. Tenta Match Exato (Hard Mappings)
                            if s_col.strip() in HARD_MAPPINGS:
                                current_t_id = HARD_MAPPINGS[s_col.strip()]
                            else:
                                # 2. Fuzzy matching reverso para sugerir Target a partir da Source
                                s_clean = re.sub(r'[^a-zA-Z0-9]', '', s_norm).replace('field', '')
                                for idx, tid in enumerate(target_ids):
                                    if tid != "__NONE__":
                                        t_clean = re.sub(r'[^a-zA-Z0-9]', '', tid.lower()).replace('field', '')
                                        if s_clean == t_clean:
                                            default_t_idx = idx
                                            break
                                current_t_id = target_ids[default_t_idx]
                            
                            mapping_db["global_source_map"][s_col] = current_t_id
                        
                        w_key = f"unimap_src_{table_name}_{s_col}"
                        
                        def on_src_map_change(s_c, wk, db_ref):
                            db_ref["global_source_map"][s_c] = st.session_state[wk]

                        try:
                            t_idx = target_ids.index(mapping_db["global_source_map"][s_col])
                        except:
                            t_idx = 0

                        choice_t_id = st.selectbox(
                            f"Origem: **{s_col}**",
                            options=target_ids,
                            format_func=lambda x: id_to_label[x],
                            index=t_idx,
                            key=w_key,
                            on_change=on_src_map_change,
                            args=(s_col, w_key, mapping_db)
                        )
                        # O indicador visual agora reflete se a coluna de origem está mapeada para algo útil
                        is_mapped = choice_t_id != "__NONE__"
                        if is_mapped:
                            st.markdown(" <span style='color: green; font-weight: bold;'>✅ Mapeado</span>", unsafe_allow_html=True)
                        else:
                            st.markdown(" <span style='color: gray;'>⚪ Ignorar</span>", unsafe_allow_html=True)

        st.divider()
        for uf in uploaded_files:
            try:
                meta = all_metadata[uf.name]
                
                # No modo unificado, deixamos o expander fechado para não poluir
                with st.expander(f"📄 Arquivo: {uf.name} (Linhas: {meta['len']})", expanded=not unified_mode):
                    st.dataframe(meta['head'])
                    
                    file_mapping = {}
                    if not unified_mode:
                        st.markdown("#### 🔀 Mapeamento de Colunas (De/Para)")
                        if uf.name not in mapping_db: mapping_db[uf.name] = {}
                        
                        cols = st.columns(3)
                        for i, source_col in enumerate(meta['columns']):
                            with cols[i % 3]:
                                s_norm = _norm(source_col)
                                current_val = mapping_db[uf.name].get(source_col, "__NONE__")
                                
                                # Sugestão automática se for a primeira vez
                                if current_val == "__NONE__":
                                    # 1. Match Exato (Hard Mappings)
                                    if source_col.strip() in HARD_MAPPINGS:
                                        current_val = HARD_MAPPINGS[source_col.strip()]
                                    else:
                                        # 2. Fuzzy match por semelhança
                                        s_clean = re.sub(r'[^a-zA-Z0-9]', '', s_norm).replace('field', '')
                                        for tid in target_ids:
                                            if tid != "__NONE__":
                                                t_clean = re.sub(r'[^a-zA-Z0-9]', '', tid.lower()).replace('field', '')
                                                if s_clean == t_clean:
                                                    current_val = tid
                                                    break
                                    mapping_db[uf.name][source_col] = current_val

                                w_key = f"map_{table_name}_{uf.name}_{source_col}"
                                
                                def on_file_map_change(f_n, s_c, wk, db_ref):
                                    db_ref[f_n][s_c] = st.session_state[wk]

                                choice = st.selectbox(
                                    f"Origem: **{source_col}**",
                                    options=target_ids,
                                    format_func=lambda x: id_to_label[x],
                                    index=target_ids.index(current_val) if current_val in target_ids else 0,
                                    key=w_key,
                                    on_change=on_file_map_change,
                                    args=(uf.name, source_col, w_key, mapping_db)
                                )
                                if choice != "__NONE__":
                                    file_mapping[source_col] = choice
                                    st.markdown(" <span style='color: green; font-weight: bold;'>✅ Mapeado</span>", unsafe_allow_html=True)
                                else:
                                    st.markdown(" <span style='color: gray;'>⚪ Ignorar</span>", unsafe_allow_html=True)
                        all_mappings[uf.name] = file_mapping
                    else:
                        # MODO UNIFICADO: O file_mapping é construído a partir do global_source_map
                        g_src_map = mapping_db.get("global_source_map", {})
                        for s_col_name in meta['columns']:
                            t_id = g_src_map.get(s_col_name)
                            if t_id and t_id != "__NONE__":
                                file_mapping[s_col_name] = t_id
                        all_mappings[uf.name] = file_mapping
                        st.info("ℹ️ Mapeamento unificado aplicado.")
                        
                    st.markdown("#### 📌 Tags e Valores Fixos Injetados")
                    with st.container(border=True):
                        st.write("Forçe um dado idêntico para a tabela inteira (ex: tag da campanha).")
                        
                        mapped_in_file = set(file_mapping.values())
                        faltantes_importantes = []
                        for tgt in target_columns:
                            tgt_name = FIELD_DESCRIPTIONS.get(tgt, {}).get("name", tgt)
                            if "(Obrigatório)" in tgt_name:
                                if tgt not in mapped_in_file:
                                    faltantes_importantes.append(tgt_name)
                                    
                        if faltantes_importantes:
                            st.info(_clean_all(f"💡 **Sugestão:** Complete aqui os vitais que faltaram: {', '.join(faltantes_importantes)}"))
    
                        unmapped_options = [tgt_id for tgt_id in target_ids[1:] if tgt_id not in mapped_in_file]
                        
                        # field_conversion vem selecionado por padrão se estiver disponível
                        default_fixed = [tid for tid in unmapped_options if tid in ("field_conversion", "conversion")]
    
                        selected_fixed_ids = st.multiselect(
                            "Escolha a coluna no banco e injete o valor:",
                            options=unmapped_options,
                            format_func=lambda x: id_to_label[x],
                            default=default_fixed,
                            key=_clean_all(f"fixed_multi_{table_name}_{uf.name}")
                        )
                        
                        fixed_mapping = {}
                        if selected_fixed_ids:
                            st.divider()
                            f_cols = st.columns(min(3, max(1, len(selected_fixed_ids))))
                            for idx_f, tid in enumerate(selected_fixed_ids):
                                with f_cols[idx_f % 3]:
                                    clean_label = _clean_all(id_to_label[tid].split('(')[0])
                                    val = st.text_input(f"Valor Estático para {clean_label}", key=_clean_all(f"fixed_in_{table_name}_{uf.name}_{tid}"))
                                    if val.strip():
                                        fixed_mapping[tid] = val.strip()
                                
                        all_fixed_vals[uf.name] = fixed_mapping
                        
                        # O Status de Integridade foi removido conforme solicitado para limpar a interface
                        
            except Exception as e:
                st.error(_clean_all(f"Erro ao ler o arquivo {uf.name}: {e}"))
                error_reading = True

                
        st.markdown("---")
        # Botão de processamento
        submit_button = st.button("🚀 Processar e Gerar Resultado Limpo", type="primary")
        
        if submit_button and not error_reading:
            with st.spinner("🚀 Processando em fluxo para salvar memória..."):
                # 1. Identifica quais colunas entrarão no CSV final (Apenas as usadas)
                used_target_ids = set()
                if unified_mode:
                    for t_id in mapping_db.get("global_source_map", {}).values():
                        if t_id != "__NONE__": used_target_ids.add(t_id)
                else:
                    for f_m in all_mappings.values():
                        used_target_ids.update(f_m.values())
                
                for f_v in all_fixed_vals.values():
                    used_target_ids.update(f_v.keys())
                
                used_target_ids.add("idform")
                final_columns = [tid for tid in target_ids if tid in used_target_ids]
                
                temp_csv = os.path.join(tempfile.gettempdir(), f"consolidado_{table_name}.csv")
                if os.path.exists(temp_csv): os.remove(temp_csv)
                
                total_processed = 0
                aproveitamento_data = []

                for idx, uf in enumerate(uploaded_files):
                    df_orig = load_dataframe(uf.getvalue(), uf.name, uf.size, sep, enc)
                    df_orig = df_orig.replace(r'^\s*$', None, regex=True)
                    
                    df_res = pd.DataFrame(index=df_orig.index)
                    file_map = all_mappings[uf.name]
                    file_fixed = all_fixed_vals[uf.name]
                    
                    for target_col in final_columns:
                        if target_col == "idform":
                            df_res[target_col] = uf.name
                        elif target_col in file_fixed:
                            df_res[target_col] = file_fixed[target_col]
                        else:
                            sources = [s for s, t in file_map.items() if t == target_col]
                            if sources:
                                if len(sources) == 1:
                                    df_res[target_col] = df_orig[sources[0]]
                                else:
                                    df_res[target_col] = df_orig[sources].bfill(axis=1).iloc[:, 0]
                                aproveitamento_data.append({"Arquivo": uf.name, "Origem": " + ".join(sources), "Destino": target_col})
                            else:
                                df_res[target_col] = None
                    
                    if "field_email" in df_res.columns:
                        df_res["field_email"] = df_res["field_email"].astype(str).str.lower().str.strip()

                    if table_name == "wtl_transactions" and "field_transaction_status" in df_res.columns:
                        df_res["field_transaction_status"] = df_res["field_transaction_status"].astype(str).str.lower().str.strip().replace(TRANS_STATUS_MAP)
                    
                    df_res.to_csv(temp_csv, mode='a', index=False, header=(idx == 0), encoding='utf-8')
                    total_processed += len(df_res)
                    del df_res
                    del df_orig
                    gc.collect()
                    
                st.session_state[f'path_{table_name}'] = temp_csv
                st.session_state[f'len_{table_name}'] = total_processed
                st.session_state[f'log_{table_name}'] = pd.DataFrame(aproveitamento_data)
                    
                    



        # ── EXIBIÇÃO DE RESULTADOS (Lendo do Disco) ───────────────────────────────
        if f'path_{table_name}' in st.session_state:
            res_path = st.session_state[f'path_{table_name}']
            df_log = st.session_state[f'log_{table_name}']
            
            st.markdown("### 3. Resultados Consolidados")
            st.success(f"✅ {st.session_state[f'len_{table_name}']} linhas processadas e salvas em disco!")
            
            # Preview leve lendo apenas 5 linhas do HD
            st.write("Pré-visualização do resultado final (Colunas otimizadas):")
            try:
                st.dataframe(pd.read_csv(res_path, nrows=5))
            except:
                st.info("O resultado está vazio ou não pôde ser pré-visualizado.")
            
            col_d1, col_d2 = st.columns(2)
            with col_d1:
                if os.path.exists(res_path):
                    with open(res_path, 'rb') as f:
                        st.download_button(
                            label="⬇️ Baixar Resultado Consolidado (CSV)",
                            data=f,
                            file_name=f"{table_name}_consolidado.csv",
                            mime="text/csv",
                            type="primary"
                        )
            with col_d2:
                st.download_button(
                    label="⬇️ Baixar Relatório de Mapeamento",
                    data=df_log.to_csv(index=False).encode('utf-8'),
                    file_name=f"log_{table_name}.csv",
                    mime="text/csv"
                )
