require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.json({
    message: "API Santander Data Engineering funcionando!",
    status: "online",
  });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      api: "online",
      database: "online",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      api: "online",
      database: "offline",
      error: error.message,
    });
  }
});

app.get("/processes", async (req, res) => {
  try {
    const { status, tribunal, search, minValor, maxValor, tipoGarantia } =
      req.query;

    const conditions = [];
    const values = [];

    if (status) {
      values.push(status);
      conditions.push(`status_processo = $${values.length}`);
    }

    if (tribunal) {
      values.push(tribunal);
      conditions.push(`tribunal = $${values.length}`);
    }

    if (tipoGarantia) {
      values.push(tipoGarantia);
      conditions.push(`tipo_garantia = $${values.length}`);
    }

    if (search) {
      values.push(`%${search}%`);
      conditions.push(`
        (
          numero_processo ILIKE $${values.length}
          OR cpf_hash ILIKE $${values.length}
          OR tribunal ILIKE $${values.length}
          OR classe_processual ILIKE $${values.length}
        )
      `);
    }

    if (minValor) {
      values.push(Number(minValor));
      conditions.push(`valor_garantia >= $${values.length}`);
    }

    if (maxValor) {
      values.push(Number(maxValor));
      conditions.push(`valor_garantia <= $${values.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `
      SELECT *
      FROM legal_processes
      ${where}
      ORDER BY id DESC
      LIMIT 300
    `,
      values,
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar processos" });
  }
});

app.get("/dashboard", async (req, res) => {
  try {
    const total = await pool.query(
      `SELECT COUNT(*) AS total FROM legal_processes`,
    );

    const conciliados = await pool.query(`
      SELECT COUNT(*) AS conciliados
      FROM legal_processes
      WHERE conciliado = true
    `);

    const valor = await pool.query(`
      SELECT COALESCE(SUM(valor_garantia), 0) AS valor_total
      FROM legal_processes
    `);

    const pendentes = await pool.query(`
      SELECT COUNT(*) AS total
      FROM legal_processes
      WHERE status_processo = 'PENDENTE'
    `);

    const emAnalise = await pool.query(`
      SELECT COUNT(*) AS total
      FROM legal_processes
      WHERE status_processo = 'EM_ANALISE'
    `);

    const maiorGarantia = await pool.query(`
      SELECT COALESCE(MAX(valor_garantia), 0) AS maior
      FROM legal_processes
    `);

    const tribunais = await pool.query(`
      SELECT COUNT(DISTINCT tribunal) AS total
      FROM legal_processes
    `);

    res.json({
      total_processos: total.rows[0].total,
      total_conciliados: conciliados.rows[0].conciliados,
      valor_total_garantias: valor.rows[0].valor_total,
      processos_pendentes: pendentes.rows[0].total,
      processos_em_analise: emAnalise.rows[0].total,
      maior_garantia: maiorGarantia.rows[0].maior,
      total_tribunais: tribunais.rows[0].total,
    });
  } catch (error) {
    res.status(500).json({ error: "Erro dashboard" });
  }
});

app.get("/filters", async (req, res) => {
  try {
    const tribunais = await pool.query(`
      SELECT DISTINCT tribunal
      FROM legal_processes
      WHERE tribunal IS NOT NULL
      ORDER BY tribunal
    `);

    const status = await pool.query(`
      SELECT DISTINCT status_processo
      FROM legal_processes
      WHERE status_processo IS NOT NULL
      ORDER BY status_processo
    `);

    const tiposGarantia = await pool.query(`
      SELECT DISTINCT tipo_garantia
      FROM legal_processes
      WHERE tipo_garantia IS NOT NULL
      ORDER BY tipo_garantia
    `);

    res.json({
      tribunais: tribunais.rows.map((item) => item.tribunal),
      status: status.rows.map((item) => item.status_processo),
      tipos_garantia: tiposGarantia.rows.map((item) => item.tipo_garantia),
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar filtros" });
  }
});

app.get("/top-classes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT classe_processual AS name, COUNT(*) AS value
      FROM legal_processes
      WHERE classe_processual IS NOT NULL
      GROUP BY classe_processual
      ORDER BY value DESC
      LIMIT 8
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar classes processuais" });
  }
});

app.get("/timeline", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', data_atualizacao::timestamp), 'YYYY-MM') AS mes,
        COUNT(*) AS total
      FROM legal_processes
      WHERE data_atualizacao IS NOT NULL
      GROUP BY mes
      ORDER BY mes
    `);

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar linha do tempo" });
  }
});

app.get("/data-quality", (req, res) => {
  try {
    const filePath = path.join(
      __dirname,
      "../../data/processed/data_quality_report.json",
    );

    if (!fs.existsSync(filePath)) {
      return res.json({
        score_qualidade: 0,
        total_registros: 0,
        duplicados: 0,
        nulos_criticos: 0,
      });
    }

    const data = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(data));
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar qualidade dos dados" });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
