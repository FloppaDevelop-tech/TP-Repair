import fs from "fs/promises";
import path from "path";

const DATA_DIR = '/tmp';
const statusFile = path.join(DATA_DIR, "status.json");
const adminFile = path.join(DATA_DIR, "admin.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Cannot create data dir", e);
  }
}

async function saveToFile(file, data) {
  try {
    await ensureDataDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Cannot save file", file, e);
  }
}

async function loadFromFile(file) {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  setCorsHeaders(res);

  const id = Number(req.query.id);
  const statusReports = await loadFromFile(statusFile);
  const adminReports = await loadFromFile(adminFile);
  const historyFile = path.join(DATA_DIR, "history.json");
  const historyReports = await loadFromFile(historyFile);

  try {
    if (req.method === 'GET') {
      const r = statusReports.find((x) => x.id === id);
      if (!r) return res.status(404).json({ message: "not found" });
      return res.status(200).json(r);
    }

    if (req.method === 'PATCH') {
      const r = statusReports.find((x) => x.id === id);
      if (!r) return res.status(404).json({ message: "not found" });
      Object.assign(r, req.body);
      const adminCopy = adminReports.find((x) => x.id === id);
      if (adminCopy) Object.assign(adminCopy, req.body);
      await saveToFile(statusFile, statusReports);
      await saveToFile(adminFile, adminReports);
      return res.status(200).json({ message: "updated", report: r });
    }

    if (req.method === 'DELETE') {
      const filteredStatus = statusReports.filter((r) => r.id !== id);
      const filteredAdmin = adminReports.filter((r) => r.id !== id);
      const filteredHistory = historyReports.filter((r) => r.id !== id);
      await saveToFile(statusFile, filteredStatus);
      await saveToFile(adminFile, filteredAdmin);
      await saveToFile(historyFile, filteredHistory);
      return res.status(200).json({ message: "deleted" });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

