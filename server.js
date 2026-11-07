const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = process.env.PORT || 3000;
const GREETING = process.env.APP_GREETING || "Hello from my DevOps application";

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD
});

app.get("/", async (req, res) => {
    try {
        await pool.query(
            "INSERT INTO visits DEFAULT VALUES"
        );

        const result = await pool.query(
            "SELECT COUNT(*) AS count FROM visits"
        );

        res.json({
            message: GREETING,
            visits: result.rows[0].count
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Database operation failed"
        });
    }
});

app.get("/health", async (req, res) => {
    try {

        await pool.query("SELECT 1");

        res.status(200).json({
            status: "healthy"
        });

    } catch (error) {

        res.status(503).json({
            status: "unhealthy"
        });
    }
});

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Application running on port ${PORT}`);
});
