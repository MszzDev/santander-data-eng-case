import pandas as pd
from sqlalchemy import create_engine

engine = create_engine(
    "postgresql+psycopg2://admin:admin123@localhost:5432/legal_reconciliation"
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
print(df.columns.tolist())
df.to_sql(
    "legal_processes",
    engine,
    if_exists="append",
    index=False
)

print("Dados carregados no PostgreSQL com sucesso!")