import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// --- Middleware ---
// อนุญาตทุก origin (สำหรับ production ควรระบุ domain ที่แน่นอน)
app.use(cors({
  origin: '*', // เปลี่ยนเป็น domain ที่แน่นอนใน production
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(express.static(path.join(__dirname, "/")));

// --- Data stores ---
let statusReports = [];
let adminReports = [];
let historyReports = [];
let sharedReports = {};

const statusFile = path.join(__dirname, "status.json");
const adminFile = path.join(__dirname, "admin.json");
const historyFile = path.join(__dirname, "history.json");
const sharedFile = path.join(__dirname, "shared-reports.json");

// --- Helper functions ---
async function saveToFile(file, data) {
  try {
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Cannot save file", file, e);
  }
}

async function loadFromFile(file) {
  try {
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
}

async function loadAllStores() {
  statusReports = await loadFromFile(statusFile);
  adminReports = await loadFromFile(adminFile);
  historyReports = await loadFromFile(historyFile);
  const shared = await loadFromFile(sharedFile);
  if (Array.isArray(shared)) {
    shared.forEach((item) => (sharedReports[item.shareKey] = item));
  }
}
await loadAllStores();

// --- Helper: create report ---
function createReportInStore(store, body) {
  const report = { ...body };
  report.photos = Array.isArray(report.photos) ? report.photos : [];
  report.status = report.status || "รอดำเนินการ";
  report.timestamp = report.timestamp || new Date().toLocaleString("th-TH");
  report.id = report.id ? Number(report.id) : Date.now() + Math.floor(Math.random() * 1000);
  store.push(report);
  return report;
}

// --- Routes ---
// Status
app.get("/api/reports/status", (req, res) => res.json(statusReports));
app.post("/api/reports/status", (req, res) => {
  const body = req.body;
  if (!body?.name) return res.status(400).json({ message: "invalid" });
  const r = createReportInStore(statusReports, body);

  if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
  if (!historyReports.find((x) => x.id === r.id))
    historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });

  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);

  res.status(201).json({ message: "created", report: r });
});
app.get("/api/reports/status/:id", (req, res) => {
  const r = statusReports.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ message: "not found" });
  res.json(r);
});
app.delete("/api/reports/status/:id", (req, res) => {
  const id = Number(req.params.id);
  statusReports = statusReports.filter((r) => r.id !== id);
  adminReports = adminReports.filter((r) => r.id !== id);
  historyReports = historyReports.filter((r) => r.id !== id);
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "deleted" });
});
app.delete("/api/reports/status", (req, res) => {
  statusReports = [];
  adminReports = [];
  historyReports = [];
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "all deleted" });
});
app.patch("/api/reports/status/:id", (req, res) => {
  const id = Number(req.params.id);
  const r = statusReports.find((x) => x.id === id);
  if (!r) return res.status(404).json({ message: "not found" });
  Object.assign(r, req.body);
  const adminCopy = adminReports.find((x) => x.id === id);
  if (adminCopy) Object.assign(adminCopy, req.body);
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  res.json({ message: "updated", report: r });
});

// Admin
app.get("/api/reports/admin", (req, res) => res.json(adminReports));
app.get("/api/reports/admin/:id", (req, res) => {
  const r = adminReports.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ message: "not found" });
  res.json(r);
});
app.post("/api/reports/admin", (req, res) => {
  const body = req.body;
  if (!body?.name) return res.status(400).json({ message: "invalid" });
  const r = createReportInStore(adminReports, body);
  if (!statusReports.find((x) => x.id === r.id)) statusReports.push({ ...r });
  if (!historyReports.find((x) => x.id === r.id))
    historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
  saveToFile(adminFile, adminReports);
  saveToFile(statusFile, statusReports);
  saveToFile(historyFile, historyReports);
  res.json(r);
});
app.patch("/api/reports/admin/:id", (req, res) => {
  const id = Number(req.params.id);
  const r = adminReports.find((x) => x.id === id);
  if (!r) return res.status(404).json({ message: "not found" });
  Object.assign(r, req.body);
  const statusCopy = statusReports.find((x) => x.id === id);
  if (statusCopy) Object.assign(statusCopy, req.body);
  saveToFile(adminFile, adminReports);
  saveToFile(statusFile, statusReports);
  res.json({ message: "updated", report: r });
});
app.delete("/api/reports/admin/:id", (req, res) => {
  const id = Number(req.params.id);
  adminReports = adminReports.filter((r) => r.id !== id);
  statusReports = statusReports.filter((r) => r.id !== id);
  historyReports = historyReports.filter((r) => r.id !== id);
  saveToFile(adminFile, adminReports);
  saveToFile(statusFile, statusReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "deleted" });
});
app.delete("/api/reports/admin", (req, res) => {
  adminReports = [];
  statusReports = [];
  historyReports = [];
  saveToFile(adminFile, adminReports);
  saveToFile(statusFile, statusReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "all deleted" });
});

// History
app.get("/api/reports/history", (req, res) => res.json(historyReports));
app.get("/api/reports/history/:id", (req, res) => {
  const r = historyReports.find((x) => x.id === Number(req.params.id));
  if (!r) return res.status(404).json({ message: "not found" });
  res.json(r);
});
app.post("/api/reports/history", (req, res) => {
  const body = req.body;
  if (!body?.name) return res.status(400).json({ message: "invalid" });
  const r = createReportInStore(historyReports, body);
  r.archivedAt = new Date().toLocaleString("th-TH");
  if (!statusReports.find((x) => x.id === r.id)) statusReports.push({ ...r });
  if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
  saveToFile(historyFile, historyReports);
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  res.json(r);
});
app.delete("/api/reports/history/:id", (req, res) => {
  const id = Number(req.params.id);
  historyReports = historyReports.filter((r) => r.id !== id);
  saveToFile(historyFile, historyReports);
  res.json({ message: "deleted" });
});
app.delete("/api/reports/history", (req, res) => {
  historyReports = [];
  saveToFile(historyFile, historyReports);
  res.json({ message: "all deleted" });
});

// Utility: move report
function moveBetweenStores(fromStore, toStore, id) {
  const idx = fromStore.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const item = fromStore.splice(idx, 1)[0];
  toStore.push(item);
  return item;
}

// Archive
app.post("/api/reports/status/:id/archive", (req, res) => {
  const id = Number(req.params.id);
  const item = moveBetweenStores(statusReports, historyReports, id);
  if (!item) return res.status(404).json({ message: "not found" });
  item.archivedAt = new Date().toLocaleString("th-TH");
  saveToFile(statusFile, statusReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "archived", item });
});
app.post("/api/reports/admin/:id/archive", (req, res) => {
  const id = Number(req.params.id);
  const item = moveBetweenStores(adminReports, historyReports, id);
  if (!item) return res.status(404).json({ message: "not found" });
  item.archivedAt = new Date().toLocaleString("th-TH");
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: "archived", item });
});

// Unified API
app.get("/api/reports/all", (req, res) => {
  res.json({
    status: statusReports,
    admin: adminReports,
    history: historyReports,
    shared: sharedReports
  });
});
app.post("/api/reports/all", (req, res) => {
  const body = req.body;
  if (!body?.name) return res.status(400).json({ message: "invalid" });
  const r = createReportInStore(statusReports, body);
  if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
  if (!historyReports.find((x) => x.id === r.id))
    historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.json({
    status: r,
    admin: adminReports.find(x => x.id === r.id),
    history: historyReports.find(x => x.id === r.id)
  });
});

// --- Server start ---
const PORT = process.env.PORT || 3000;

// Start server (สำหรับ hosting ที่รองรับ Node.js เช่น Render, Railway, Fly.io)
// ตรวจสอบว่าไม่ได้รันใน Vercel environment
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📁 Data files: ${__dirname}`);
  });
}

// Export for Vercel serverless functions (ถ้ายังใช้ Vercel)
export default app;
