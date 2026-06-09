import requests

API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="

headers = {
    "Authorization": f"APIKey {API_KEY}",
    "Content-Type": "application/json"
}

url = "https://api-publica.datajud.cnj.jus.br/api_publica_trf4/_search"

payload = {
    "size": 1,
    "query": {
        "match_all": {}
    }
}

response = requests.post(
    url,
    headers=headers,
    json=payload
)

print(response.status_code)
print(response.text[:500])