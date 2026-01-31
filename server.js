const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();
const port = process.env.PORT || 3000;
const cors = require("cors");
const jwt = require("jsonwebtoken");

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
};

const app = express();
app.use(express.json());

const allowedOrigins = ["http://localhost:3000", "https://team3-ca2-webapp.vercel.app/"];
app.use(cors({ origin: allowedOrigins, credentials: true }));

const DEMO_USER = { id: 1, username: "admin", password: "admin123" };
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";

function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing auth" });
    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) return res.status(401).json({ error: "Invalid auth" });
    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch {
        res.status(401).json({ error: "Invalid/expired token" });
    }
}

app.listen(port, () => {
    console.log('Server running on port', port);
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    if (username !== DEMO_USER.username || password !== DEMO_USER.password)
        return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ userId: DEMO_USER.id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
});

app.get("/tuitions", async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SELECT * FROM tuitions");
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Server error fetching tuitions" });
    }
});

app.get("/tuitions/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SELECT * FROM tuitions WHERE tuition_id = ?", [id]);
        if (!rows.length) return res.status(404).json({ error: "Tuition not found" });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Server error fetching tuition" });
    }
});

app.post("/tuitions", requireAuth, async (req, res) => {
    const { tuition_name, tuition_location, tuition_google_link, tuition_details, tuition_subjects, tuition_pricing } = req.body;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            `INSERT INTO tuitions (tuition_name, tuition_location, tuition_google_link, tuition_details, tuition_subjects, tuition_pricing) VALUES (?, ?, ?, ?, ?, ?)`,
            [tuition_name, tuition_location, tuition_google_link, tuition_details, tuition_subjects, tuition_pricing]
        );
        res.status(201).json({ message: "Tuition added" });
    } catch (err) {
        res.status(500).json({ error: "Server error adding tuition" });
    }
});

app.put("/tuitions/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { tuition_name, tuition_location, tuition_google_link, tuition_details, tuition_subjects, tuition_pricing } = req.body;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            `UPDATE tuitions SET tuition_name=?, tuition_location=?, tuition_google_link=?, tuition_details=?, tuition_subjects=?, tuition_pricing=? WHERE tuition_id=?`,
            [tuition_name, tuition_location, tuition_google_link, tuition_details, tuition_subjects, tuition_pricing, id]
        );
        res.json({ message: "Tuition updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error updating tuition" });
    }
});

app.delete("/tuitions/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute("DELETE FROM tuitions WHERE tuition_id=?", [id]);
        res.json({ message: "Tuition deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error deleting tuition" });
    }
});

// Tutors
app.get("/tutors", async (req, res) => {
    try {
        const conn = await mysql.createConnection(dbConfig);
        const [rows] = await conn.execute("SELECT * FROM tutors");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: "Server error fetching tutors" });
    }
});

app.post("/tutors", requireAuth, async (req, res) => {
    const { tutor_name, tutor_subject, tutor_contact, tutor_rating } = req.body;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            `INSERT INTO tutors (tutor_name, tutor_subject, tutor_contact, tutor_rating) VALUES (?, ?, ?, ?)`,
            [tutor_name, tutor_subject, tutor_contact, tutor_rating]
        );
        res.status(201).json({ message: "Tutor added" });
    } catch (err) {
        res.status(500).json({ error: "Server error adding tutor" });
    }
});

app.put("/tutors/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    const { tutor_name, tutor_subject, tutor_contact, tutor_rating } = req.body;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute(
            `UPDATE tutors SET tutor_name=?, tutor_subject=?, tutor_contact=?, tutor_rating=? WHERE tutor_id=?`,
            [tutor_name, tutor_subject, tutor_contact, tutor_rating, id]
        );
        res.json({ message: "Tutor updated" });
    } catch (err) {
        res.status(500).json({ error: "Server error updating tutor" });
    }
});

app.delete("/tutors/:id", requireAuth, async (req, res) => {
    const { id } = req.params;
    try {
        const conn = await mysql.createConnection(dbConfig);
        await conn.execute("DELETE FROM tutors WHERE tutor_id=?", [id]);
        res.json({ message: "Tutor deleted" });
    } catch (err) {
        res.status(500).json({ error: "Server error deleting tutor" });
    }
});