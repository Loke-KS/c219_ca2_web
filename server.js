const express = require('express');
const mysql = require('mysql2/promise');
require('dotenv').config();
const port = 3000;

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 100,
    queueLimit: 0,
};

const app = express();
app.use(express.json());

app.listen(port, () => {
    console.log('Server running on port', port);
});

const cors = require("cors");
const allowedOrigins = [
    "http://localhost:3000",
    "https://card-app-starter-rvxg.onrender.com"
];
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin) return callback(null, true);
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }
            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        credentials: false,
    })
);

const DEMO_USER = { id: 1, username: "admin", password: "admin123" };

const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
        return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign(
        { userId: DEMO_USER.id, username: DEMO_USER.username },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
    res.json({ token });
});

function requireAuth(req, res, next) {
    const header = req.headers.authorization; // "Bearer <token>"

    if (!header) {
        return res.status(401).json({ error: "Missing Authorization header" });
    }

    const [type, token] = header.split(" ");
    if (type !== "Bearer" || !token) {
        return res.status(401).json({ error: "Invalid Authorization format" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ error: "Invalid/Expired token" });
    }
}

app.get('/alltuition', async (req,res) => {
    try {
        let connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.execute('SELECT * FROM defaultdb.tuition');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error for all tuition' });
    }
});

app.post('/addtuition', requireAuth, async (req, res) => {
    const { tuition_name, tuition_rating, tuition_location, tuition_details } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO tuitions (tuition_name, tuition_rating, tuition_location, tuition_details) VALUES (?, ?, ?, ?)', [tuition_name, tuition_rating, tuition_location, tuition_details]);
        res.status(201).json({ message: 'Tuition '+tuition_name+' added successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not add tuition '+tuition_name });
    }
});

app.post('/addtutor/:id', requireAuth, async (req, res) => {
    const { tuition_id } = req.params;
    const { tutor_name, tutor_rating, tutor_subject, tutor_contact } = req.body;
    try {
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('INSERT INTO tutors (tuition_id, tutor_name, tutor_rating, tutor_subject, tutor_contact) VALUES (?, ?, ?, ?, ?)', [tuition_id, tutor_name, tutor_rating, tutor_subject, tutor_contact]);
        res.status(201).json({ message: 'Tutor '+tutor_name+' added successfully'});
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not add tutor '+tutor_name });
    }
});

app.put('/updatetuition/:id', async (req, res) => {
    const { tuition_id } = req.params;
    const { tuition_name, tuition_rating, tuition_location, tuition_details } = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE tuition SET tuition_name=?, tuition_rating=?, tuition_location=?, tuition_details=? WHERE tuition_id=?', [tuition_name, tuition_rating, tuition_location, tuition_details, tuition_id]);
        res.status(201).json({ message: 'Tuition ' + tuition_id + ' updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update tuition ' + tuition_id });
    }
});

app.put('/updatetutor/:id', async (req, res) => {
    const { tutor_id } = req.params;
    const { tuition_id, tutor_name, tutor_rating, tutor_subject, tutor_contact } = req.body;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('UPDATE tutor SET tuition_id=?, tutor_name=?, tutor_rating=?, tutor_subject=?, tutor_contact=? WHERE tutor_id=?', [tuition_id, tutor_name, tutor_rating, tutor_subject, tutor_contact, tutor_id]);
        res.status(201).json({ message: 'Tutor ' + tutor_id + ' updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not update tutor ' + tutor_id });
    }
});

app.delete('/deletetuition/:id', async (req, res) => {
    const { tuition_id } = req.params;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM tuition WHERE id=?', [tuition_id]);
        res.status(201).json({ message: 'Tuition ' + tuition_id + ' deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not delete tuition ' + tuition_id });
    }
});

app.delete('/deletetutor/:id', async (req, res) => {
    const { tutor_id } = req.params;
    try{
        let connection = await mysql.createConnection(dbConfig);
        await connection.execute('DELETE FROM tutor WHERE id=?', [tutor_id]);
        res.status(201).json({ message: 'Tutor ' + tutor_id + ' deleted successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error - could not delete tutor ' + tutor_id });
    }
});