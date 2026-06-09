import os
import pandas as pd
from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

DATABASE_URL = (
    f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require"
    }
)

df = pd.read_csv("data/processed/final_data.csv")

df = df.rename(columns={
    "Numero_Processo": "numero_processo",
    "Tribunal": "tribunal",
    "Data_Atualizacao": "data_atualizacao",
    "Nome_Cliente_Hash": "nome_cliente_hash",
    "CPF_Hash": "cpf_hash",
    "ID_Conta": "id_conta",
    "ID_Dossie": "id_dossie",
    "Base_PIS": "base_pis",
    "Tipo_Garantia": "tipo_garantia",
    "Valor_Garantia": "valor_garantia",
    "Status_Processo": "status_processo",
    "Status_Tribunal": "status_tribunal",
    "Conciliado": "conciliado",
    "Classe_Processual": "classe_processual",
})

df.to_sql(
    "legal_processes",
    engine,
    if_exists="replace",
    index=False
)

print(f"{len(df)} registros carregados no PostgreSQL com sucesso!")