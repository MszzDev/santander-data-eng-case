import os
import random
import pandas as pd
from faker import Faker

fake = Faker("pt_BR")
os.makedirs("data/raw", exist_ok=True)

COURT_DATA_PATH = "data/raw/court_data.csv"
OUTPUT_PATH = "data/raw/internal_data.csv"

status_processos = ["ATIVO", "PENDENTE", "ENCERRADO", "EM_ANALISE"]

tipos_garantia = [
    "Depósito Judicial",
    "Seguro Garantia",
    "Fiança Bancária",
    "Bloqueio Judicial",
    "Carta de Fiança"
]

bases_pis = [
    "PIS_REC_001",
    "PIS_REC_002",
    "PIS_CIVEL_003",
    "PIS_TRAB_004"
]

def gerar_valor_por_tipo(tipo_garantia):
    if tipo_garantia == "Depósito Judicial":
        return random.uniform(5000, 120000)

    if tipo_garantia == "Seguro Garantia":
        return random.uniform(30000, 300000)

    if tipo_garantia == "Fiança Bancária":
        return random.uniform(50000, 500000)

    if tipo_garantia == "Bloqueio Judicial":
        return random.uniform(1000, 80000)

    return random.uniform(10000, 150000)

if not os.path.exists(COURT_DATA_PATH):
    raise FileNotFoundError(
        "Arquivo court_data.csv não encontrado. Rode primeiro: python scripts/extract_tj.py"
    )

court_df = pd.read_csv(COURT_DATA_PATH)

if "Numero_Processo" not in court_df.columns:
    raise ValueError("A coluna Numero_Processo não existe no court_data.csv")

processos_reais = (
    court_df["Numero_Processo"]
    .dropna()
    .drop_duplicates()
    .astype(str)
    .tolist()
)

if not processos_reais:
    raise ValueError("Nenhum processo real encontrado no court_data.csv")

dados = []

for numero_processo in processos_reais:
    tipo_garantia = random.choice(tipos_garantia)

    dados.append({
        "Nome_Cliente": fake.name(),
        "CPF": fake.cpf(),
        "ID_Conta": f"CTA-{random.randint(10000, 99999)}",
        "ID_Dossie": f"DOS-{random.randint(10000, 99999)}",
        "Numero_Processo": numero_processo,
        "Base_PIS": random.choice(bases_pis),
        "Tipo_Garantia": tipo_garantia,
        "Valor_Garantia": round(gerar_valor_por_tipo(tipo_garantia), 2),
        "Status_Processo": random.choice(status_processos)
    })

internal_df = pd.DataFrame(dados)

internal_df.to_csv(
    OUTPUT_PATH,
    index=False,
    encoding="utf-8-sig"
)

print(f"internal_data.csv gerado com {len(internal_df)} registros vinculados a processos reais do DataJud.")