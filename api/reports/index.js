import fs from "fs/promises";
import path from "path";

const DATA_DIR = '/tmp';
const statusFile = path.join(DATA_DIR, "status.json");

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    console.error("Cannot create data dir", e);
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

  try {
    if (req.method === 'GET') {
      const statusReports = await loadFromFile(statusFile);
      return res.status(200).json(statusReports);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
}

