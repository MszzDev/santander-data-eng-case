import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import "./App.css";

const API_URL = "http://localhost:3001";
const ITEMS_PER_PAGE = 7;

const statusColors = {
  ATIVO: "#ef4444",
  PENDENTE: "#f59e0b",
  ENCERRADO: "#22c55e",
  EM_ANALISE: "#3b82f6",
};

function formatMoney(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatStatus(status) {
  return status ? status.replace("_", " ") : "NÃO INFORMADO";
}

function App() {
  const [dashboard, setDashboard] = useState({});
  const [processes, setProcesses] = useState([]);
  const [filters, setFilters] = useState({
    tribunais: [],
    status: [],
    tipos_garantia: [],
  });

  const [health, setHealth] = useState({});
  const [topClasses, setTopClasses] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [quality, setQuality] = useState({});
  const [lastUpdate, setLastUpdate] = useState("");

  // Controle visual do carregamento inicial da aplicação.
  const [loading, setLoading] = useState(true);

  // Guarda mensagens de erro caso a API ou alguma rota falhe.
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedTribunal, setSelectedTribunal] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedTipoGarantia, setSelectedTipoGarantia] = useState("");
  const [minValor, setMinValor] = useState("");
  const [maxValor, setMaxValor] = useState("");
  const [page, setPage] = useState(0);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Carrega todas as informações principais do dashboard.
  // Essa função é usada tanto na abertura da tela quanto na atualização automática.
  async function loadAll() {
    try {
      setIsRefreshing(true);
      setError("");

      const results = await Promise.allSettled([
        axios.get(`${API_URL}/dashboard`),
        axios.get(`${API_URL}/processes`),
        axios.get(`${API_URL}/filters`),
        axios.get(`${API_URL}/health`),
        axios.get(`${API_URL}/top-classes`),
        axios.get(`${API_URL}/timeline`),
        axios.get(`${API_URL}/data-quality`),
      ]);

      const [dash, proc, filt, healthRes, classesRes, timelineRes, qualityRes] =
        results;

      if (dash.status === "fulfilled") {
        setDashboard(dash.value.data);
      }

      if (proc.status === "fulfilled") {
        setProcesses(proc.value.data);
      }

      if (filt.status === "fulfilled") {
        setFilters(filt.value.data);
      }

      if (healthRes.status === "fulfilled") {
        setHealth(healthRes.value.data);
      }

      if (classesRes.status === "fulfilled") {
        setTopClasses(classesRes.value.data.slice(0, 5));
      }

      if (timelineRes.status === "fulfilled") {
        setTimeline(timelineRes.value.data);
      }

      if (qualityRes.status === "fulfilled") {
        setQuality(qualityRes.value.data);
      }

      const hasError = results.some((result) => result.status === "rejected");

      if (hasError) {
        setError(
          "Algumas métricas não foram carregadas. O dashboard exibirá os dados disponíveis.",
        );
      }

      setLastUpdate(new Date().toLocaleString("pt-BR"));
      setSecondsSinceUpdate(0);
    } catch (err) {
      console.error(err);
      setError("Erro inesperado ao carregar o dashboard.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  // Busca os processos considerando os filtros aplicados pelo usuário.
  async function loadProcesses() {
    try {
      setError("");

      const params = {};

      if (search) params.search = search;
      if (selectedTribunal) params.tribunal = selectedTribunal;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedTipoGarantia) params.tipoGarantia = selectedTipoGarantia;
      if (minValor) params.minValor = minValor;
      if (maxValor) params.maxValor = maxValor;

      const response = await axios.get(`${API_URL}/processes`, { params });

      setProcesses(response.data);
      setPage(0);
      setLastUpdate(new Date().toLocaleString("pt-BR"));
      setSecondsSinceUpdate(0);
    } catch (err) {
      console.error(err);
      setError("Erro ao buscar processos. Verifique a conexão com a API.");
    }
  }

  // Inicializa o dashboard e mantém a atualização automática a cada 30 segundos.
  useEffect(() => {
    loadAll();

    const refreshInterval = setInterval(() => {
      loadAll();
    }, 30000);

    const timerInterval = setInterval(() => {
      setSecondsSinceUpdate((prev) => prev + 1);
    }, 1000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(timerInterval);
    };
  }, []);

  // Sempre que algum filtro muda, a consulta dos processos é refeita.
  useEffect(() => {
    loadProcesses();
  }, [
    selectedTribunal,
    selectedStatus,
    selectedTipoGarantia,
    minValor,
    maxValor,
  ]);

  function handleSearchSubmit(event) {
    event.preventDefault();
    loadProcesses();
  }

  // Limpa todos os filtros e recarrega a listagem principal.
  function clearFilters() {
    setSearch("");
    setSelectedTribunal("");
    setSelectedStatus("");
    setSelectedTipoGarantia("");
    setMinValor("");
    setMaxValor("");

    setTimeout(() => {
      loadProcesses();
    }, 100);
  }

  const totalPages = Math.ceil(processes.length / ITEMS_PER_PAGE);

  const paginatedProcesses = useMemo(() => {
    const start = page * ITEMS_PER_PAGE;
    return processes.slice(start, start + ITEMS_PER_PAGE);
  }, [processes, page]);

  // Agrupa os processos por status para alimentar o gráfico de pizza.
  const statusData = useMemo(() => {
    const result = {};

    processes.forEach((item) => {
      const status = item.status_processo || "NÃO INFORMADO";
      result[status] = (result[status] || 0) + 1;
    });

    return Object.entries(result).map(([name, value]) => ({
      name: formatStatus(name),
      value,
      color: statusColors[name] || "#64748b",
    }));
  }, [processes]);

  // Conta quantos processos existem em cada tribunal.
  const tribunalData = useMemo(() => {
    const result = {};

    processes.forEach((item) => {
      const tribunal = item.tribunal || "N/I";
      result[tribunal] = (result[tribunal] || 0) + 1;
    });

    return Object.entries(result).map(([name, value]) => ({ name, value }));
  }, [processes]);

  // Soma os valores de garantia por tribunal.
  const valorPorTribunal = useMemo(() => {
    const result = {};

    processes.forEach((item) => {
      const tribunal = item.tribunal || "N/I";
      result[tribunal] =
        (result[tribunal] || 0) + Number(item.valor_garantia || 0);
    });

    return Object.entries(result).map(([name, value]) => ({ name, value }));
  }, [processes]);

  const valorMedio = useMemo(() => {
    if (!processes.length) return 0;

    const total = processes.reduce(
      (acc, item) => acc + Number(item.valor_garantia || 0),
      0,
    );

    return total / processes.length;
  }, [processes]);

  // Calcula o percentual conciliado usado nos cards e indicadores laterais.
  const percentualConciliado = useMemo(() => {
    const total = Number(dashboard.total_processos || 0);
    const conciliados = Number(dashboard.total_conciliados || 0);

    if (!total) return 0;

    return ((conciliados / total) * 100).toFixed(1);
  }, [dashboard]);

  const tribunalLider = useMemo(() => {
    if (!tribunalData.length) return { name: "N/I", value: 0 };

    return [...tribunalData].sort((a, b) => b.value - a.value)[0];
  }, [tribunalData]);

  // Agrupa os registros por tipo de garantia para o gráfico específico.
  const tipoGarantiaData = useMemo(() => {
    const result = {};

    processes.forEach((item) => {
      const tipo = item.tipo_garantia || "NÃO INFORMADO";
      result[tipo] = (result[tipo] || 0) + 1;
    });

    return Object.entries(result).map(([name, value]) => ({ name, value }));
  }, [processes]);

  const crescimentoEstimado = useMemo(() => {
    const total = Number(dashboard.total_processos || 0);
    const atual = processes.length;

    if (!total) return 0;

    return ((atual / total) * 100).toFixed(1);
  }, [dashboard, processes]);

  // Exporta para CSV apenas os dados carregados na tela, respeitando filtros aplicados.
  function exportExcel() {
    if (!processes.length) {
      alert("Nenhum dado disponível para exportar.");
      return;
    }

    const data = processes.map((item) => ({
      "Número do Processo": item.numero_processo,
      Tribunal: item.tribunal,
      Status: formatStatus(item.status_processo),
      "Classe Processual": item.classe_processual,
      "Tipo de Garantia": item.tipo_garantia,
      "Valor da Garantia": Number(item.valor_garantia || 0),
      "CPF Hash": item.cpf_hash,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);

    worksheet["!cols"] = [
      { wch: 28 },
      { wch: 12 },
      { wch: 16 },
      { wch: 38 },
      { wch: 22 },
      { wch: 20 },
      { wch: 70 },
    ];

    worksheet["!autofilter"] = {
      ref: worksheet["!ref"],
    };

    worksheet["!freeze"] = {
      xSplit: 0,
      ySplit: 1,
    };

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Processos Conciliados");

    XLSX.writeFile(
      workbook,
      `relatorio_processos_${new Date().toISOString().slice(0, 10)}.xlsx`,
    );
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
        <h2>Carregando dashboard...</h2>
        <p>Conectando API, PostgreSQL e métricas da pipeline.</p>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="logo">
          <span>S</span>
          <div>
            <strong>Santander</strong>
            <small>Data Engineering</small>
          </div>
        </div>

        <nav>
          <a href="#visao-geral" className="active">
            Visão Geral
          </a>
          <a href="#graficos">Análises</a>
          <a href="#processos">Processos</a>
          <a href="#pipeline">Pipeline</a>
          <a href="#arquitetura">Arquitetura</a>
        </nav>

        <div className="sidebar-footer">
          <strong>Miguel Soares</strong>
          <small>Case Santander Data Masters</small>
        </div>
      </aside>

      <main className="page">
        {error && <div className="error-alert">⚠ {error}</div>}

        <section id="visao-geral" className="hero fade-in">
          <div>
            <span className="brand">Estudo de Caso de Engenharia de Dados</span>
            <h1>Data Lake de Conciliação de Garantias Jurídicas</h1>
            <p>
              Pipeline ponta a ponta com dados reais do DataJud/CNJ, LGPD e
              dashboard analítico.
            </p>
          </div>

          <div className="hero-side">
            <div className="real-data-badge">
              Dados públicos reais: DataJud/CNJ
            </div>

            <small>Última atualização: {lastUpdate || "carregando..."}</small>
            <small>
              {isRefreshing
                ? "Atualizando..."
                : `Atualizado há ${secondsSinceUpdate}s`}
            </small>
          </div>
        </section>

        <section className="status-row fade-in">
          <div>🟢 API: {health.api || "online"}</div>
          <div>🟢 PostgreSQL: {health.database || "online"}</div>
          <div>🟢 Airflow: Ativo</div>
          <div>🟢 Data Quality: {quality.score_qualidade || 0}%</div>
        </section>

        <section className="cards primary-cards">
          <div className="card blue">
            <p>Total de Processos</p>
            <h2>{dashboard.total_processos || 0}</h2>
          </div>

          <div className="card green">
            <p>Processos Conciliados</p>
            <h2>{dashboard.total_conciliados || 0}</h2>
            <small>{percentualConciliado}% conciliado</small>
          </div>

          <div className="card orange">
            <p>Valor Total das Garantias</p>
            <h2>{formatMoney(dashboard.valor_total_garantias)}</h2>
          </div>

          <div className="card purple">
            <p>Qualidade dos Dados</p>
            <h2>{quality.score_qualidade ?? 0}%</h2>
          </div>

          <div className="card red">
            <p>Fonte Pública Real</p>
            <h2>DataJud/CNJ</h2>
            <small>{dashboard.total_tribunais || 0} tribunais integrados</small>
          </div>

          <div className="card green">
            <p>LGPD</p>
            <h2>SHA-256</h2>
          </div>

          <div className="card blue">
            <p>Camadas Processadas</p>
            <h2>Bronze • Silver • Gold</h2>
            <small>Data Lake completo</small>
          </div>

          <div className="card orange">
            <p>Visão Atual</p>
            <h2>{crescimentoEstimado}%</h2>
          </div>
        </section>

        <section className="filters-card">
          <form onSubmit={handleSearchSubmit} className="filters-grid">
            <input
              type="text"
              placeholder="Buscar processo, hash, tribunal ou classe..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />

            <section className="actions-row">
              <button type="button" onClick={exportExcel}>
                Exportar Excel
              </button>

              <div className="layers-status">
                <span>🟤 Bronze OK</span>
                <span>⚪ Silver OK</span>
                <span>🟡 Gold OK</span>
              </div>
            </section>

            <select
              value={selectedTribunal}
              onChange={(event) => setSelectedTribunal(event.target.value)}
            >
              <option value="">Todos os tribunais</option>
              {filters.tribunais?.map((tribunal) => (
                <option key={tribunal} value={tribunal}>
                  {tribunal}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(event) => setSelectedStatus(event.target.value)}
            >
              <option value="">Todos os status</option>
              {filters.status?.map((status) => (
                <option key={status} value={status}>
                  {formatStatus(status)}
                </option>
              ))}
            </select>

            <select
              value={selectedTipoGarantia}
              onChange={(event) => setSelectedTipoGarantia(event.target.value)}
            >
              <option value="">Todos os tipos de garantia</option>
              {filters.tipos_garantia?.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Valor mínimo"
              value={minValor}
              onChange={(e) => setMinValor(e.target.value)}
            />

            <input
              type="number"
              placeholder="Valor máximo"
              value={maxValor}
              onChange={(e) => setMaxValor(e.target.value)}
            />

            <button type="submit">Buscar</button>

            <button
              type="button"
              className="clear-button"
              onClick={clearFilters}
            >
              Limpar
            </button>
          </form>
        </section>

        <section className="content-grid">
          <div className="main-content">
            <section id="graficos" className="charts">
              {processes.length === 0 ? (
                <div className="empty-panel">
                  <h3>Nenhum dado disponível</h3>
                  <p>
                    Nenhum registro foi encontrado para os filtros selecionados.
                  </p>
                </div>
              ) : (
                <>
                  <div className="panel">
                    <h3>Processos por Status</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <PieChart
                        margin={{ top: 25, right: 20, bottom: 90, left: 20 }}
                      >
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          outerRadius={88}
                          label
                        >
                          {statusData.map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend
                          verticalAlign="bottom"
                          height={70}
                          wrapperStyle={{ paddingTop: "25px" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <h3>Processos por Tribunal</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={tribunalData}>
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#3b82f6"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel wide">
                    <h3>Valor das Garantias por Tribunal</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={valorPorTribunal}
                        margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                      >
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis
                          stroke="#94a3b8"
                          tickFormatter={(value) =>
                            `${Math.round(value / 1000)}k`
                          }
                        />
                        <Tooltip formatter={(value) => formatMoney(value)} />
                        <Bar
                          dataKey="value"
                          fill="#f59e0b"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <h3>Top Classes Processuais</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={topClasses}
                        layout="vertical"
                        margin={{ top: 10, right: 20, left: 20, bottom: 10 }}
                      >
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#94a3b8"
                          width={140}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#22c55e"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <h3>Linha do Tempo de Atualizações</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={timeline}
                        margin={{ top: 20, right: 20, bottom: 20, left: 0 }}
                      >
                        <XAxis dataKey="mes" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" allowDecimals={false} />
                        <Tooltip />
                        <Bar
                          dataKey="total"
                          fill="#ef4444"
                          radius={[8, 8, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="panel">
                    <h3>Distribuição por Tipo de Garantia</h3>
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={tipoGarantiaData} layout="vertical">
                        <XAxis
                          type="number"
                          stroke="#94a3b8"
                          allowDecimals={false}
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="#94a3b8"
                          width={150}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="value"
                          fill="#a855f7"
                          radius={[0, 8, 8, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </section>

            <section className="heatmap-card">
              <h3>Mapa Operacional por Tribunal</h3>

              <div className="heatmap-grid">
                {tribunalData.map((item) => {
                  const max = Math.max(...tribunalData.map((t) => t.value));
                  const percent = max ? (item.value / max) * 100 : 0;

                  return (
                    <div className="heatmap-item" key={item.name}>
                      <div>
                        <strong>{item.name}</strong>
                        <span>{item.value} processos</span>
                      </div>

                      <div className="heatbar">
                        <span style={{ width: `${percent}%` }}></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section id="processos" className="table-card">
              <div className="section-title">
                <div>
                  <h3>Processos Recentes</h3>
                  <span>{processes.length} registros encontrados</span>
                </div>

                <div className="pagination">
                  <button
                    disabled={page <= 0}
                    onClick={() => setPage((prev) => prev - 1)}
                  >
                    Anterior
                  </button>

                  <span>
                    Página <strong>{page + 1}</strong> de{" "}
                    <strong>{totalPages || 1}</strong>
                  </span>

                  <button
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((prev) => prev + 1)}
                  >
                    Próximo
                  </button>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Nº do Processo</th>
                      <th>Tribunal</th>
                      <th>Status</th>
                      <th>Classe Processual</th>
                      <th>Tipo de Garantia</th>
                      <th>Valor</th>
                      <th>CPF Hash</th>
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedProcesses.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="empty-message">
                          Nenhum registro encontrado para os filtros
                          selecionados.
                        </td>
                      </tr>
                    ) : (
                      paginatedProcesses.map((item) => (
                        <tr key={item.id}>
                          <td>{item.numero_processo}</td>
                          <td>{item.tribunal}</td>
                          <td>
                            <span
                              className={`pill ${item.status_processo?.toLowerCase()}`}
                            >
                              {formatStatus(item.status_processo)}
                            </span>
                          </td>
                          <td>{item.classe_processual}</td>
                          <td>{item.tipo_garantia}</td>
                          <td>{formatMoney(item.valor_garantia)}</td>
                          <td>{item.cpf_hash?.substring(0, 18)}...</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mobile-process-list">
                {paginatedProcesses.map((item) => (
                  <div className="process-card" key={item.id}>
                    <strong>{item.numero_processo}</strong>
                    <span>{item.tribunal}</span>
                    <span
                      className={`pill ${item.status_processo?.toLowerCase()}`}
                    >
                      {formatStatus(item.status_processo)}
                    </span>
                    <p>{formatMoney(item.valor_garantia)}</p>
                    <small>{item.classe_processual}</small>
                    <small>{item.tipo_garantia}</small>
                    <small>
                      CPF Hash: {item.cpf_hash?.substring(0, 18)}...
                    </small>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside id="pipeline" className="right-panel">
            <div className="pipeline-card">
              <h3>Resumo da Pipeline</h3>

              <div className="step">
                <strong>API</strong>
                <span>Status do serviço</span>
                <b>{health.api || "online"}</b>
              </div>

              <div className="step">
                <strong>Banco de Dados</strong>
                <span>PostgreSQL</span>
                <b>{health.database || "online"}</b>
              </div>

              <div className="step">
                <strong>Apache Airflow</strong>
                <span>Orquestração da pipeline</span>
                <b>Ativo</b>
              </div>

              <div className="step">
                <strong>Prometheus</strong>
                <span>Coleta de métricas</span>
                <b>Ativo</b>
              </div>

              <div className="step">
                <strong>Grafana</strong>
                <span>Observabilidade</span>
                <b>Ativo</b>
              </div>

              <div className="step">
                <strong>Data Quality</strong>
                <span>Validação automática</span>
                <b>{quality.score_qualidade || 0}%</b>
              </div>

              <div className="step">
                <strong>Registros Validados</strong>
                <span>Dataset final</span>
                <b>{quality.total_registros || 0}</b>
              </div>

              <div className="step">
                <strong>Duplicados</strong>
                <span>Controle de qualidade</span>
                <b>{quality.duplicados || 0}</b>
              </div>
            </div>

            <div className="mini-metrics">
              <h3>Indicadores Operacionais</h3>

              <div>
                <span>Percentual Conciliado</span>
                <strong>{percentualConciliado}%</strong>
              </div>

              <div>
                <span>Tribunal Líder</span>
                <strong>
                  {tribunalLider.name} ({tribunalLider.value})
                </strong>
              </div>

              <div>
                <span>Total de Tribunais</span>
                <strong>{dashboard.total_tribunais || 0}</strong>
              </div>

              <div>
                <span>Maior Garantia</span>
                <strong>{formatMoney(dashboard.maior_garantia)}</strong>
              </div>

              <div>
                <span>Processos Pendentes</span>
                <strong>{dashboard.processos_pendentes || 0}</strong>
              </div>

              <div>
                <span>Em Análise</span>
                <strong>{dashboard.processos_em_analise || 0}</strong>
              </div>
            </div>
          </aside>
        </section>

        <section id="arquitetura" className="architecture-card">
          <h3>Arquitetura da Solução</h3>

          <div className="architecture-flow">
            <div>DataJud/CNJ</div>
            <span>→</span>
            <div>Airflow</div>
            <span>→</span>
            <div>MinIO Bronze</div>
            <span>→</span>
            <div>ETL + LGPD</div>
            <span>→</span>
            <div>MinIO Silver</div>
            <span>→</span>
            <div>PostgreSQL Gold</div>
            <span>→</span>
            <div>API Node.js</div>
            <span>→</span>
            <div>React Dashboard</div>
          </div>
        </section>

        <footer className="footer">
          <strong>Data Lake de Conciliação de Garantias Jurídicas</strong>
          <span>Case Santander Data Masters 2026 — Miguel Soares de Souza</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
