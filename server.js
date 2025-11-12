import express from "express";
import mysql from "mysql2";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "reportdb"
});

app.post("/report", (req, res) => {
  const { name, message } = req.body;
  const sql = "INSERT INTO reports (name, message) VALUES (?, ?)";
  db.query(sql, [name, message], (err, result) => {
    if (err) return res.json({ error: err });
    res.json({ status: "ok" });
  });
});

app.listen(3000, () => console.log("Server ready on port 3000"));
