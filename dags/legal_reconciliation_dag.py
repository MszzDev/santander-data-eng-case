from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator


default_args = {
    "owner": "miguel",
    "depends_on_past": False,
    "retries": 1,
    "retry_delay": timedelta(minutes=1),
}

with DAG(
    dag_id="legal_reconciliation_dag",
    description="Pipeline de conciliação jurídica com LGPD",
    default_args=default_args,
    start_date=datetime(2026, 1, 1),
    schedule_interval=None,
    catchup=False,
    tags=["santander", "data-engineering", "lgpd"],
) as dag:

    gerar_dados_internos = BashOperator(
        task_id="gerar_dados_internos",
        bash_command="cd /opt/airflow && python scripts/generate_internal_data.py",
    )

    gerar_dados_publicos = BashOperator(
        task_id="gerar_dados_publicos",
        bash_command="cd /opt/airflow && python scripts/extract_tj.py",
    )

    processar_lgpd_etl = BashOperator(
        task_id="processar_lgpd_etl",
        bash_command="cd /opt/airflow && python scripts/process_and_mask.py",
    )
    
    validar_qualidade_dados = BashOperator(
    task_id="validar_qualidade_dados",
    bash_command="cd /opt/airflow && python scripts/validate_data_quality.py",
    )

    carregar_postgres = BashOperator(
        task_id="carregar_postgres",
        bash_command="cd /opt/airflow && python scripts/load_to_postgres.py",
    )

    ggerar_dados_internos >> gerar_dados_publicos >> processar_lgpd_etl >> validar_qualidade_dados >> carregar_postgres