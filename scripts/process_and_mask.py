import pandas as pd
import hashlib
import os

os.makedirs("data/processed", exist_ok=True)

# FUNÇÃO HASH SHA-256
def gerar_hash(valor):
    return hashlib.sha256(str(valor).encode()).hexdigest()

# LER CSVs
internal_df = pd.read_csv("data/raw/internal_data.csv")

court_df = pd.read_csv("data/raw/court_data.csv")

# APLICAR LGPD
internal_df["Nome_Cliente_Hash"] = internal_df["Nome_Cliente"].apply(gerar_hash)

internal_df["CPF_Hash"] = internal_df["CPF"].apply(gerar_hash)

# REMOVER DADOS SENSÍVEIS
internal_df = internal_df.drop(columns=["Nome_Cliente", "CPF"])

# MERGE DOS DADOS
final_df = pd.merge(
    internal_df,
    court_df,
    on="Numero_Processo",
    how="inner"
)

# AJUSTES E LIMPEZA
final_df = final_df.rename(columns={
    "Status": "Status_Tribunal"
})

final_df["Conciliado"] = True

final_df = final_df.drop_duplicates()


# SALVAR CSV FINAL
final_df.to_csv(
    "data/processed/final_data.csv",
    index=False,
    encoding="utf-8-sig"
)

print("Arquivo final_data.csv gerado com sucesso!")