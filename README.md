# 🚀 Data Lake de Conciliação de Garantias Jurídicas

> Projeto desenvolvido para o **Santander Data Masters – Engenharia de Dados**, demonstrando a construção de um pipeline completo de dados utilizando informações públicas do **DataJud/CNJ**, processamento em Python, armazenamento em PostgreSQL e visualização em um dashboard analítico desenvolvido em React.

---

# 📖 Sobre o projeto

O objetivo deste projeto é simular um ambiente corporativo de conciliação de garantias jurídicas, realizando o cruzamento entre informações públicas provenientes do **DataJud/CNJ** e dados internos simulados de uma instituição financeira.

Durante o processamento são aplicadas regras de tratamento, padronização e anonimização conforme a **LGPD**, permitindo a disponibilização dos dados para análise executiva através de uma API REST e um dashboard interativo.

---

# 🏗️ Arquitetura

```
                 DataJud / CNJ
                       │
                       ▼
          Extração de Dados Públicos
                       │
                       ▼
              Camada Bronze (Raw)
                 (MinIO / CSV)
                       │
                       ▼
            ETL + Padronização + LGPD
                 (Python + SHA-256)
                       │
                       ▼
              Camada Silver (Tratada)
                       │
                       ▼
             Camada Gold (Analítica)
                 PostgreSQL
                       │
                       ▼
                API REST (Node.js)
                       │
                       ▼
          Dashboard Analítico (React)
```

---

# ⚙️ Tecnologias utilizadas

## Backend

- Node.js
- Express
- PostgreSQL
- pg
- CORS

## Frontend

- React
- Vite
- Axios
- Recharts
- XLSX

## Engenharia de Dados

- Python
- Pandas
- Faker
- Requests
- Hashlib (SHA-256)

## Observabilidade

- Apache Airflow
- Prometheus
- Grafana

---

# 🔒 LGPD

Para preservar dados sensíveis, todas as informações pessoais são anonimizadas antes da carga analítica.

São aplicados algoritmos SHA-256 em campos como:

- CPF
- Nome do cliente

Exemplo:

```
CPF Original:
123.456.789-00

↓

CPF Hash:
9b74c9897bac770ffc029102a200c5de
```

---

# 🌐 Fonte pública utilizada

Os processos judiciais utilizados neste projeto são provenientes da API pública do **DataJud/CNJ**.

Foram utilizados dados reais de diversos tribunais brasileiros, incluindo:

- TJSP
- TJRS
- TJRJ
- TJMG
- TRF3
- TRF4

---

# 📊 Dashboard

O painel analítico apresenta indicadores em tempo real como:

- Total de processos
- Percentual conciliado
- Valor total das garantias
- Qualidade dos dados
- Total de tribunais
- Maior garantia encontrada

Além disso, possui gráficos para:

- Distribuição por status
- Distribuição por tribunal
- Valor das garantias por tribunal
- Classes processuais mais frequentes
- Linha do tempo das atualizações
- Distribuição por tipo de garantia

Também estão disponíveis:

- Busca textual
- Filtros dinâmicos
- Exportação para Excel
- Paginação
- Atualização automática
- Tratamento de erros

---

# 🧹 Data Quality

O projeto possui validação automática de qualidade dos dados.

São avaliados:

- Registros duplicados
- Campos obrigatórios nulos
- Processos inválidos
- Valores inconsistentes

Ao final é gerado um score percentual utilizado diretamente pelo dashboard.

Exemplo:

```
Qualidade dos Dados

100%

Status:
APROVADO
```

---

# 📁 Estrutura do projeto

```
DataMasterCase/

├── app/
│   ├── backend/
│   └── frontend/
│
├── scripts/
│   ├── extract_datajud.py
│   ├── generate_internal_data.py
│   ├── process_and_mask.py
│   ├── validate_data_quality.py
│   └── load_to_postgres.py
│
├── data/
│   ├── raw/
│   ├── processed/
│   └── final/
│
├── dags/
│
├── docs/
│
└── README.md
```

---

# 🔄 Pipeline

1. Extração dos processos reais no DataJud/CNJ.

2. Geração dos dados internos simulados.

3. Cruzamento entre bases públicas e internas.

4. Aplicação das regras de anonimização (LGPD).

5. Validação da qualidade dos dados.

6. Carga para PostgreSQL.

7. Disponibilização via API REST.

8. Visualização no Dashboard React.

---

# 📈 Principais funcionalidades

- Integração com dados públicos reais.
- Pipeline ETL ponta a ponta.
- Aplicação de LGPD.
- Dashboard responsivo.
- Indicadores executivos.
- Atualização automática.
- Busca dinâmica.
- Filtros avançados.
- Exportação para Excel.
- Métricas de Data Quality.
- Observabilidade com Prometheus e Grafana.

---

# 🎯 Objetivo

Demonstrar a construção de uma solução moderna de Engenharia de Dados utilizando conceitos de:

- Data Lake
- ETL
- Data Quality
- Observabilidade
- Governança
- LGPD
- APIs REST
- Dashboards Analíticos

simulando um cenário corporativo voltado para conciliação de garantias jurídicas.

---

# 👨‍💻 Autor

**Miguel Soares de Souza**

Projeto desenvolvido para o programa **Santander Data Masters – Engenharia de Dados**.
