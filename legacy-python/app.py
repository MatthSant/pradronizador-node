import streamlit as st

st.set_page_config(
    page_title="Validador e Estruturador de Dados",
    page_icon="📊",
    layout="wide"
)

st.title("Validador e Estruturador de Dados Históricos")

st.markdown("""
Bem-vindo ao aplicativo de estruturação de dados.

Utilize o menu lateral para selecionar qual tipo de dado você deseja estruturar:
- **Events (wtl_events)**: Para processar leads e eventos.
- **Survey (wtl_survey)**: Para processar dados de pesquisa/censo.
- **Transactions (wtl_transactions)**: Para processar dados de transações (vendas).

**Instruções Gerais:**
1. Navegue até a página desejada.
2. Faça o upload do arquivo CSV enviado pelo cliente.
3. Mapeie as colunas originais do cliente (De) para as colunas padrão do banco de dados (Para).
4. Faça o download dos arquivos finais gerados: o dado estruturado e o relatório de aproveitamento do upload.
""")
