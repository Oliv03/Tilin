require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

// ─── DB Connection Pool ────────────────────────────────────────────────────
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: true }, // Requerido por TiDB/PlanetScale
  waitForConnections: true,
  connectionLimit: 10,
});

// ─── Init Tables ───────────────────────────────────────────────────────────
async function initTables() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS conceptos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(20) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NOT NULL,
        tipo ENUM('ingreso','egreso','ambos') DEFAULT 'ambos',
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS destinos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(20) NOT NULL UNIQUE,
        nombre VARCHAR(255) NOT NULL,
        responsable VARCHAR(100),
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS productos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(20) NOT NULL UNIQUE,
        descripcion VARCHAR(255) NOT NULL,
        unidad_id INT,
        stock_minimo DECIMAL(10,2) DEFAULT 0,
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await conn.query(`
      CREATE TABLE IF NOT EXISTS unidades_medida (
        id INT AUTO_INCREMENT PRIMARY KEY,
        clave VARCHAR(20) NOT NULL UNIQUE,
        descripcion VARCHAR(100) NOT NULL,
        abreviatura VARCHAR(10) NOT NULL,
        activo TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log("✅ Tablas listas.");
  } catch (err) {
    console.error("❌ Error creando tablas:", err.message);
  } finally {
    conn.release();
  }
}

// ─── Generic CRUD Factory ─────────────────────────────────────────────────
function makeCRUD(table, fields) {
  const router = express.Router();

  // GET all
  router.get("/", async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT * FROM ${table} WHERE activo = 1 ORDER BY id DESC`
      );
      res.json(rows);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET by id
  router.get("/:id", async (req, res) => {
    try {
      const [rows] = await pool.query(`SELECT * FROM ${table} WHERE id = ?`, [
        req.params.id,
      ]);
      if (!rows.length) return res.status(404).json({ error: "No encontrado" });
      res.json(rows[0]);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST create
  router.post("/", async (req, res) => {
    try {
      const values = fields.map((f) => req.body[f] ?? null);
      const cols = fields.join(", ");
      const placeholders = fields.map(() => "?").join(", ");
      const [result] = await pool.query(
        `INSERT INTO ${table} (${cols}) VALUES (${placeholders})`,
        values
      );
      res.status(201).json({ id: result.insertId, message: "Creado exitosamente" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        res.status(409).json({ error: "La clave ya existe" });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // PUT update
  router.put("/:id", async (req, res) => {
    try {
      const setClause = fields.map((f) => `${f} = ?`).join(", ");
      const values = [...fields.map((f) => req.body[f] ?? null), req.params.id];
      await pool.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, values);
      res.json({ message: "Actualizado exitosamente" });
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        res.status(409).json({ error: "La clave ya existe" });
      } else {
        res.status(500).json({ error: err.message });
      }
    }
  });

  // DELETE (soft)
  router.delete("/:id", async (req, res) => {
    try {
      await pool.query(`UPDATE ${table} SET activo = 0 WHERE id = ?`, [
        req.params.id,
      ]);
      res.json({ message: "Eliminado exitosamente" });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}

// ─── Routes ───────────────────────────────────────────────────────────────
app.use("/api/conceptos",      makeCRUD("conceptos",      ["clave", "descripcion", "tipo"]));
app.use("/api/destinos",       makeCRUD("destinos",        ["clave", "nombre", "responsable"]));
app.use("/api/productos",      makeCRUD("productos",       ["clave", "descripcion", "unidad_id", "stock_minimo"]));
app.use("/api/unidades-medida",makeCRUD("unidades_medida", ["clave", "descripcion", "abreviatura"]));

// Health check
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

// SPA fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// ─── Start ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
  await initTables();
});

module.exports = app;
