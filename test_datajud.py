import requests

API_KEY = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="

headers = {
    "Authorization": f"APIKey {API_KEY}",
    "Content-Type": "application/json"
}

url = "https://api-publica.datajud.cnj.jus.br/api_publica_tjsp/_search"

payload = {
    "size": 3,
    "query": {
        "match_all": {}
    }
}

response = requests.post(
    url,
    headers=headers,
    json=payload,
    timeout=30
)

print("Status:", response.status_code)
print(response.text[:1000])