import os
import json
import pandas as pd

INPUT_PATH = "data/processed/final_data.csv"
OUTPUT_PATH = "data/processed/data_quality_report.json"

os.makedirs("data/processed", exist_ok=True)

df = pd.read_csv(INPUT_PATH)

total_registros = len(df)

campos_obrigatorios = [
    "Numero_Processo",
    "Tribunal",
    "Data_Atualizacao",
    "CPF_Hash",
    "Nome_Cliente_Hash",
    "Valor_Garantia",
    "Status_Processo",
    "Tipo_Garantia"
]

duplicados = df.duplicated(subset=["Numero_Processo"]).sum()

nulos_criticos = 0
campos_ausentes = []

for campo in campos_obrigatorios:
    if campo in df.columns:
        nulos_criticos += df[campo].isnull().sum()
    else:
        campos_ausentes.append(campo)
        nulos_criticos += total_registros

processos_invalidos = 0

if "Numero_Processo" in df.columns:
    processos_invalidos = df["Numero_Processo"].astype(str).str.len().lt(10).sum()

valores_invalidos = 0

if "Valor_Garantia" in df.columns:
    valores_invalidos = (pd.to_numeric(df["Valor_Garantia"], errors="coerce") <= 0).sum()

if total_registros == 0:
    score = 0
else:
    penalidade_duplicados = (duplicados / total_registros) * 25
    penalidade_nulos = (nulos_criticos / (total_registros * len(campos_obrigatorios))) * 40
    penalidade_processos = (processos_invalidos / total_registros) * 20
    penalidade_valores = (valores_invalidos / total_registros) * 15

    score = 100 - (
        penalidade_duplicados
        + penalidade_nulos
        + penalidade_processos
        + penalidade_valores
    )

score = max(round(score, 2), 0)

report = {
    "total_registros": int(total_registros),
    "score_qualidade": score,
    "duplicados": int(duplicados),
    "nulos_criticos": int(nulos_criticos),
    "processos_invalidos": int(processos_invalidos),
    "valores_invalidos": int(valores_invalidos),
    "campos_ausentes": campos_ausentes,
    "campos_obrigatorios": campos_obrigatorios,
    "status": "APROVADO" if score >= 90 else "ATENÇÃO"
}

with open(OUTPUT_PATH, "w", encoding="utf-8") as file:
    json.dump(report, file, ensure_ascii=False, indent=4)

print("Relatório de qualidade gerado com sucesso!")
print(json.dumps(report, ensure_ascii=False, indent=4))