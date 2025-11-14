import fs from "fs/promises";
import path from "path";

const DATA_DIR = '/tmp';
const statusFile = path.join(DATA_DIR, "status.json");
const adminFile = path.join(DATA_DIR, "admin.json");
const historyFile = path.join(DATA_DIR, "history.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore if directory already exists
  }
}

async function loadFromFile(file) {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(file, "utf-8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // File doesn't exist yet, return empty array
  }
  return [];
}

async function saveToFile(file, data) {
  try {
    await ensureDataDir();
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Cannot save file", file, e);
  }
}

async function loadAllStores() {
  const status = await loadFromFile(statusFile);
  const admin = await loadFromFile(adminFile);
  const history = await loadFromFile(historyFile);
  return { status, admin, history };
}

function createReportInStore(store, body) {
  const report = { ...body };
  report.photos = Array.isArray(report.photos) ? report.photos : [];
  report.status = report.status || "รอดำเนินการ";
  report.timestamp = report.timestamp || new Date().toLocaleString("th-TH");
  report.id = report.id ? Number(report.id) : Date.now() + Math.floor(Math.random() * 1000);
  store.push(report);
  return report;
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
  
  // Load from files every time to ensure data consistency
  const stores = await loadAllStores();
  let { status: statusReports, admin: adminReports, history: historyReports } = stores;

  try {
    if (req.method === 'GET') {
      return res.status(200).json(statusReports);
    }

    if (req.method === 'POST') {
      const body = req.body;
      if (!body?.name) return res.status(400).json({ message: "invalid" });
      const r = createReportInStore(statusReports, body);
      if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
      if (!historyReports.find((x) => x.id === r.id))
        historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
      
      // Save all files
      await saveToFile(statusFile, statusReports);
      await saveToFile(adminFile, adminReports);
      await saveToFile(historyFile, historyReports);
      
      return res.status(201).json({ message: "created", report: r });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

