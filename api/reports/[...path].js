import fs from "fs/promises";
import path from "path";

// Use /tmp for file storage in Vercel (note: this is ephemeral - data will be lost on cold starts)
// For production, consider using a database like Vercel Postgres, MongoDB, or Vercel KV
const DATA_DIR = '/tmp';
const statusFile = path.join(DATA_DIR, "status.json");
const adminFile = path.join(DATA_DIR, "admin.json");
const historyFile = path.join(DATA_DIR, "history.json");
const sharedFile = path.join(DATA_DIR, "shared-reports.json");

// Helper functions
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
  } catch (e) {
    // File doesn't exist yet, return empty array
  }
  return [];
}

async function loadAllStores() {
  const status = await loadFromFile(statusFile);
  const admin = await loadFromFile(adminFile);
  const history = await loadFromFile(historyFile);
  const shared = await loadFromFile(sharedFile);
  let sharedObj = {};
  if (Array.isArray(shared)) {
    shared.forEach((item) => (sharedObj[item.shareKey] = item));
  }
  return { status, admin, history, shared: sharedObj };
}

// Helper: create report
function createReportInStore(store, body) {
  const report = { ...body };
  report.photos = Array.isArray(report.photos) ? report.photos : [];
  report.status = report.status || "รอดำเนินการ";
  report.timestamp = report.timestamp || new Date().toLocaleString("th-TH");
  report.id = report.id ? Number(report.id) : Date.now() + Math.floor(Math.random() * 1000);
  store.push(report);
  return report;
}

// Utility: move report
function moveBetweenStores(fromStore, toStore, id) {
  const idx = fromStore.findIndex((x) => x.id === id);
  if (idx === -1) return null;
  const item = fromStore.splice(idx, 1)[0];
  toStore.push(item);
  return item;
}

// CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Main handler
export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    return res.status(200).end();
  }

  setCorsHeaders(res);

  const { path: pathParam } = req.query;
  const pathArray = Array.isArray(pathParam) ? pathParam : (pathParam ? [pathParam] : []);
  const [endpoint, id, action] = pathArray;

  // Load data
  const stores = await loadAllStores();
  let { status: statusReports, admin: adminReports, history: historyReports, shared: sharedReports } = stores;

  try {
    // Route: /api/reports (no subpath) - return status reports
    if (!endpoint) {
      if (req.method === 'GET') {
        return res.status(200).json(statusReports);
      }
      return res.status(405).json({ message: 'Method not allowed' });
    }

    // Route: /api/reports/status
    if (endpoint === 'status') {
      if (req.method === 'GET') {
        if (id) {
          const r = statusReports.find((x) => x.id === Number(id));
          if (!r) return res.status(404).json({ message: "not found" });
          return res.status(200).json(r);
        }
        return res.status(200).json(statusReports);
      }
      
      if (req.method === 'POST') {
        const body = req.body;
        if (!body?.name) return res.status(400).json({ message: "invalid" });
        const r = createReportInStore(statusReports, body);
        if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
        if (!historyReports.find((x) => x.id === r.id))
          historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
        await saveToFile(statusFile, statusReports);
        await saveToFile(adminFile, adminReports);
        await saveToFile(historyFile, historyReports);
        return res.status(201).json({ message: "created", report: r });
      }

      if (req.method === 'PATCH' && id) {
        const r = statusReports.find((x) => x.id === Number(id));
        if (!r) return res.status(404).json({ message: "not found" });
        Object.assign(r, req.body);
        const adminCopy = adminReports.find((x) => x.id === Number(id));
        if (adminCopy) Object.assign(adminCopy, req.body);
        await saveToFile(statusFile, statusReports);
        await saveToFile(adminFile, adminReports);
        return res.status(200).json({ message: "updated", report: r });
      }

      if (req.method === 'DELETE') {
        if (id) {
          const numId = Number(id);
          statusReports = statusReports.filter((r) => r.id !== numId);
          adminReports = adminReports.filter((r) => r.id !== numId);
          historyReports = historyReports.filter((r) => r.id !== numId);
        } else {
          statusReports = [];
          adminReports = [];
          historyReports = [];
        }
        await saveToFile(statusFile, statusReports);
        await saveToFile(adminFile, adminReports);
        await saveToFile(historyFile, historyReports);
        return res.status(200).json({ message: id ? "deleted" : "all deleted" });
      }
    }

    // Route: /api/reports/admin
    if (endpoint === 'admin') {
      if (req.method === 'GET') {
        if (id) {
          const r = adminReports.find((x) => x.id === Number(id));
          if (!r) return res.status(404).json({ message: "not found" });
          return res.status(200).json(r);
        }
        return res.status(200).json(adminReports);
      }

      if (req.method === 'POST') {
        const body = req.body;
        if (!body?.name) return res.status(400).json({ message: "invalid" });
        const r = createReportInStore(adminReports, body);
        if (!statusReports.find((x) => x.id === r.id)) statusReports.push({ ...r });
        if (!historyReports.find((x) => x.id === r.id))
          historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
        await saveToFile(adminFile, adminReports);
        await saveToFile(statusFile, statusReports);
        await saveToFile(historyFile, historyReports);
        return res.status(200).json(r);
      }

      if (req.method === 'PATCH' && id) {
        const r = adminReports.find((x) => x.id === Number(id));
        if (!r) return res.status(404).json({ message: "not found" });
        Object.assign(r, req.body);
        const statusCopy = statusReports.find((x) => x.id === Number(id));
        if (statusCopy) Object.assign(statusCopy, req.body);
        await saveToFile(adminFile, adminReports);
        await saveToFile(statusFile, statusReports);
        return res.status(200).json({ message: "updated", report: r });
      }

      if (req.method === 'DELETE') {
        if (id) {
          const numId = Number(id);
          adminReports = adminReports.filter((r) => r.id !== numId);
          statusReports = statusReports.filter((r) => r.id !== numId);
          historyReports = historyReports.filter((r) => r.id !== numId);
        } else {
          adminReports = [];
          statusReports = [];
          historyReports = [];
        }
        await saveToFile(adminFile, adminReports);
        await saveToFile(statusFile, statusReports);
        await saveToFile(historyFile, historyReports);
        return res.status(200).json({ message: id ? "deleted" : "all deleted" });
      }
    }

    // Route: /api/reports/history
    if (endpoint === 'history') {
      if (req.method === 'GET') {
        if (id) {
          const r = historyReports.find((x) => x.id === Number(id));
          if (!r) return res.status(404).json({ message: "not found" });
          return res.status(200).json(r);
        }
        return res.status(200).json(historyReports);
      }

      if (req.method === 'POST') {
        const body = req.body;
        if (!body?.name) return res.status(400).json({ message: "invalid" });
        const r = createReportInStore(historyReports, body);
        r.archivedAt = new Date().toLocaleString("th-TH");
        if (!statusReports.find((x) => x.id === r.id)) statusReports.push({ ...r });
        if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
        await saveToFile(historyFile, historyReports);
        await saveToFile(statusFile, statusReports);
        await saveToFile(adminFile, adminReports);
        return res.status(200).json(r);
      }

      if (req.method === 'DELETE') {
        if (id) {
          historyReports = historyReports.filter((r) => r.id !== Number(id));
        } else {
          historyReports = [];
        }
        await saveToFile(historyFile, historyReports);
        return res.status(200).json({ message: id ? "deleted" : "all deleted" });
      }
    }

    // Route: /api/reports/all
    if (endpoint === 'all') {
      if (req.method === 'GET') {
        return res.status(200).json({
          status: statusReports,
          admin: adminReports,
          history: historyReports,
          shared: sharedReports
        });
      }

      if (req.method === 'POST') {
        const body = req.body;
        if (!body?.name) return res.status(400).json({ message: "invalid" });
        const r = createReportInStore(statusReports, body);
        if (!adminReports.find((x) => x.id === r.id)) adminReports.push({ ...r });
        if (!historyReports.find((x) => x.id === r.id))
          historyReports.push({ ...r, archivedAt: new Date().toLocaleString("th-TH") });
        await saveToFile(statusFile, statusReports);
        await saveToFile(adminFile, adminReports);
        await saveToFile(historyFile, historyReports);
        return res.status(200).json({
          status: r,
          admin: adminReports.find(x => x.id === r.id),
          history: historyReports.find(x => x.id === r.id)
        });
      }
    }

    return res.status(404).json({ message: "Not found" });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

