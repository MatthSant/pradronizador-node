import streamlit as st
import sys
from pathlib import Path

# Adicionar pasta raiz ao path do sys para importar utils
root_dir = Path(__file__).parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from utils import render_mapping_ui

st.set_page_config(page_title="Events", page_icon="📈", layout="wide")

TEMPLATE_PATH = str(root_dir / "Arquivos fontes" / "Template_Leads_Eventos.csv")
TABLE_NAME = "wtl_events"

render_mapping_ui(TEMPLATE_PATH, TABLE_NAME)
