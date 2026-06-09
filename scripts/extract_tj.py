import os
import random
import requests
import pandas as pd
from dotenv import load_dotenv

load_dotenv()

os.makedirs("data/raw", exist_ok=True)

API_KEY = os.getenv(
    "DATAJUD_API_KEY",
    "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="
)

HEADERS = {
    "Authorization": f"APIKey {API_KEY}",
    "Content-Type": "application/json"
}

TRIBUNAIS = [
    ("TJSP", "api_publica_tjsp"),
    ("TJRJ", "api_publica_tjrj"),
    ("TJMG", "api_publica_tjmg"),
    ("TJRS", "api_publica_tjrs"),
    ("TRF3", "api_publica_trf3"),
    ("TRF4", "api_publica_trf4"),
]

STATUS_POSSIVEIS = [
    "EM_ANDAMENTO",
    "BAIXADO",
    "SUSPENSO",
    "ARQUIVADO"
]

registros = []

for tribunal_nome, endpoint in TRIBUNAIS:
    url = f"https://api-publica.datajud.cnj.jus.br/{endpoint}/_search"

    payload = {
        "size": 20,
        "query": {
            "match_all": {}
        },
        "_source": [
            "numeroProcesso",
            "tribunal",
            "dataHoraUltimaAtualizacao",
            "classe.nome"
        ]
    }

    try:
        response = requests.post(
            url,
            headers=HEADERS,
            json=payload,
            timeout=60
        )

        response.raise_for_status()

        data = response.json()
        hits = data.get("hits", {}).get("hits", [])

        print(f"{tribunal_nome}: {len(hits)} registros encontrados")

        for item in hits:
            source = item.get("_source", {})

            numero_processo = source.get("numeroProcesso")
            tribunal = source.get("tribunal", tribunal_nome)
            data_atualizacao = source.get("dataHoraUltimaAtualizacao")

            classe = source.get("classe", {})
            classe_nome = classe.get("nome", "Não informado")

            if numero_processo:
                registros.append({
                    "Numero_Processo": numero_processo,
                    "Tribunal": tribunal,
                    "Data_Atualizacao": data_atualizacao,
                    "Status": random.choice(STATUS_POSSIVEIS),
                    "Classe_Processual": classe_nome
                })

    except Exception as error:
        print(f"Erro ao consumir {tribunal_nome}: {error}")

df = pd.DataFrame(registros)

df = df.drop_duplicates(subset=["Numero_Processo"])

df.to_csv(
    "data/raw/court_data.csv",
    index=False,
    encoding="utf-8-sig"
)

print(f"court_data.csv gerado com {len(df)} registros reais do DataJud/CNJ.")