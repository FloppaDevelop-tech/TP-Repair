import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs/promises';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, "/")));

// separate stores for each front-end view
let statusReports = [];
let adminReports = [];
let historyReports = [];
let sharedReports = {}; // Store shared reports with unique keys

const statusFile = path.join(__dirname, 'status.json');
const adminFile = path.join(__dirname, 'admin.json');
const historyFile = path.join(__dirname, 'history.json');
const sharedFile = path.join(__dirname, 'shared-reports.json');


async function saveToFile(file, data) {
  try {
    // ensure we write UTF-8 bytes explicitly to avoid encoding issues
    const out = JSON.stringify(data, null, 2);
    await fs.writeFile(file, Buffer.from(out, 'utf8'));
  } catch (e) {
    console.error('Cannot save file', file, e);
  }
}

async function loadFromFile(file) {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // ignore
  }
  return [];
}

// load stores at startup
async function loadAllStores() {
  statusReports = await loadFromFile(statusFile);
  adminReports = await loadFromFile(adminFile);
  historyReports = await loadFromFile(historyFile);
  const shared = await loadFromFile(sharedFile);
  if (Array.isArray(shared)) {
    shared.forEach(item => {
      sharedReports[item.shareKey] = item;
    });
  }
}
loadAllStores();

// POST report
// Helper to create a report in a store
function createReportInStore(store, body) {
  const report = body;
  report.photos = Array.isArray(report.photos) ? report.photos : [];
  report.status = report.status || 'รอดำเนินการ';
  report.timestamp = report.timestamp || new Date().toLocaleString('th-TH');
  // normalize id to number and generate if missing
  report.id = report.id ? Number(report.id) : Date.now() + Math.floor(Math.random()*1000);
  store.push(report);
  return report;
}

// GET reports
// --- STATUS endpoints ---
app.get('/api/reports/status', (req, res) => res.json(statusReports));

app.post('/api/reports/status', (req, res) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ message: 'invalid' });
  const r = createReportInStore(statusReports, body);
  // also replicate into admin and history so other frontends see the new report
  const adminExists = adminReports.find(x => Number(x.id) === Number(r.id));
  const historyExists = historyReports.find(x => Number(x.id) === Number(r.id));
  if (!adminExists) {
    const adminCopy = Object.assign({}, r);
    adminReports.push(adminCopy);
  }
  if (!historyExists) {
    const historyCopy = Object.assign({}, r, { archivedAt: new Date().toLocaleString('th-TH') });
    historyReports.push(historyCopy);
  }
    console.log('POST /api/reports/status -> counts:', {status: statusReports.length, admin: adminReports.length, history: historyReports.length});
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.status(201).json({ message: 'created', report: r });
});

app.get('/api/reports/status/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = statusReports.find(x => x.id === id);
  if (!r) return res.status(404).json({ message: 'not found' });
  res.json(r);
});

app.delete('/api/reports/status/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = statusReports.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ message: 'not found' });
  statusReports.splice(idx,1);
  saveToFile(statusFile, statusReports);
  res.json({ message: 'deleted' });
});

app.delete('/api/reports/status', (req, res) => {
  statusReports = [];
  saveToFile(statusFile, statusReports);
  res.json({ message: 'all deleted' });
});

// --- ADMIN endpoints ---
app.get('/api/reports/admin', (req, res) => res.json(adminReports));

app.post('/api/reports/admin', (req, res) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ message: 'invalid' });
  const r = createReportInStore(adminReports, body);
  saveToFile(adminFile, adminReports);
  res.status(201).json({ message: 'created', report: r });
});

app.get('/api/reports/admin/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = adminReports.find(x => x.id === id);
  if (!r) return res.status(404).json({ message: 'not found' });
  res.json(r);
});

app.delete('/api/reports/admin/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = adminReports.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ message: 'not found' });
  adminReports.splice(idx,1);
  saveToFile(adminFile, adminReports);
  res.json({ message: 'deleted' });
});

app.delete('/api/reports/admin', (req, res) => {
  adminReports = [];
  saveToFile(adminFile, adminReports);
  res.json({ message: 'all deleted' });
});

// PATCH endpoints to update a report in status/admin
app.patch('/api/reports/status/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = statusReports.find(x => x.id === id);
  if (!r) return res.status(404).json({ message: 'not found' });
  const updates = req.body || {};
  console.log('PATCH /api/reports/status/:id', { id, updates });
  Object.assign(r, updates);
  // propagate update to admin store if present
  const adminCopy = adminReports.find(x => Number(x.id) === id);
  console.log(' -> adminCopy found?', !!adminCopy);
  if (adminCopy) {
    console.log('    before admin status:', adminCopy.status);
    Object.assign(adminCopy, updates);
    console.log('    after admin status:', adminCopy.status);
  }
  saveToFile(statusFile, statusReports);
  saveToFile(adminFile, adminReports);
  res.json({ message: 'updated', report: r});
});

app.patch('/api/reports/admin/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = adminReports.find(x => x.id === id);
  if (!r) return res.status(404).json({ message: 'not found' });
  const updates = req.body || {};
  console.log('PATCH /api/reports/admin/:id', { id, updates });
  Object.assign(r, updates);
  // diagnostic: print current ids and types in both stores
  try {
    console.log(' diagnostic admin ids:', adminReports.map(x => ({ id: x.id, type: typeof x.id })));
    console.log(' diagnostic status ids:', statusReports.map(x => ({ id: x.id, type: typeof x.id })));
  } catch (e) {
    console.log(' diagnostic error listing ids', e);
  }
  // propagate update to status store if present
  const statusCopy = statusReports.find(x => Number(x.id) === id);
  console.log(' -> statusCopy found?', !!statusCopy);
  if (statusCopy) {
    console.log('    before status status:', statusCopy.status);
    Object.assign(statusCopy, updates);
    console.log('    after status status:', statusCopy.status);
  }
  saveToFile(adminFile, adminReports);
  saveToFile(statusFile, statusReports);
  res.json({ message: 'updated', report: r});
});

// archive a report (move to history)
// --- HISTORY endpoints ---
app.get('/api/reports/history', (req, res) => res.json(historyReports));

app.post('/api/reports/history', (req, res) => {
  const body = req.body;
  if (!body || !body.name) return res.status(400).json({ message: 'invalid' });
  const r = createReportInStore(historyReports, body);
  r.archivedAt = new Date().toLocaleString('th-TH');
  saveToFile(historyFile, historyReports);
  res.status(201).json({ message: 'created', report: r });
});

app.get('/api/reports/history/:id', (req, res) => {
  const id = Number(req.params.id);
  const r = historyReports.find(x => x.id === id);
  if (!r) return res.status(404).json({ message: 'not found' });
  res.json(r);
});

app.delete('/api/reports/history/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = historyReports.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ message: 'not found' });
  historyReports.splice(idx,1);
  saveToFile(historyFile, historyReports);
  res.json({ message: 'deleted' });
});

app.delete('/api/reports/history', (req, res) => {
  historyReports = [];
  saveToFile(historyFile, historyReports);
  res.json({ message: 'all deleted' });
});

// Utility: move a report from one store to another
function moveBetweenStores(fromStore, toStore, id) {
  const idx = fromStore.findIndex(x => x.id === id);
  if (idx === -1) return null;
  const item = fromStore.splice(idx,1)[0];
  toStore.push(item);
  return item;
}

// ========== SHARE REPORT ENDPOINTS ==========
// Generate unique share link for a report
app.post('/api/reports/share/:id', (req, res) => {
  const id = Number(req.params.id);
  
  // Find report from any store
  let report = statusReports.find(x => x.id === id) || 
               adminReports.find(x => x.id === id) || 
               historyReports.find(x => x.id === id);
  
  if (!report) return res.status(404).json({ message: 'report not found' });
  
  // Generate unique share key
  const shareKey = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  const sharedReport = {
    shareKey,
    reportId: id,
    originalData: report,
    createdAt: new Date().toLocaleString('th-TH'),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleString('th-TH') // 7 days
  };
  
  sharedReports[shareKey] = sharedReport;
  
  // Save to shared reports file
  const sharedArray = Object.values(sharedReports);
  saveToFile(sharedFile, sharedArray);
  
  const shareUrl = `${req.protocol}://${req.get('host')}/share.html?key=${shareKey}`;
  
  res.json({ 
    message: 'share link created', 
    shareKey,
    shareUrl
  });
});

// Get shared report by share key
app.get('/api/reports/shared/:key', (req, res) => {
  const { key } = req.params;
  const shared = sharedReports[key];
  
  if (!shared) return res.status(404).json({ message: 'shared report not found' });
  
  // Check if expired - improved date parsing
  try {
    // Parse Thai date format (e.g., "14/11/2568, 10:30:45")
    let expireDate;
    if (typeof shared.expiresAt === 'string') {
      // Try to parse Thai date format
      const dateStr = shared.expiresAt.replace(/\s/g, '');
      // Extract date parts: day/month/year, hour:minute:second
      const match = dateStr.match(/(\d+)\/(\d+)\/(\d+),?(\d+):(\d+):(\d+)?/);
      if (match) {
        const [, day, month, year, hour = 0, minute = 0, second = 0] = match;
        // Convert Buddhist year to AD year
        const adYear = parseInt(year) - 543;
        expireDate = new Date(adYear, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
      } else {
        // Fallback: try standard date parsing
        expireDate = new Date(shared.expiresAt);
      }
    } else {
      expireDate = new Date(shared.expiresAt);
    }
    
    if (isNaN(expireDate.getTime())) {
      // If date parsing fails, assume not expired
      console.warn('Failed to parse expire date:', shared.expiresAt);
    } else if (new Date() > expireDate) {
      delete sharedReports[key];
      const sharedArray = Object.values(sharedReports);
      saveToFile(sharedFile, sharedArray);
      return res.status(410).json({ message: 'share link expired' });
    }
  } catch (err) {
    console.error('Error checking expiration:', err);
    // Continue if date check fails
  }
  
  res.json(shared);
});

// Delete shared report
app.delete('/api/reports/shared/:key', (req, res) => {
  const { key } = req.params;
  
  if (!sharedReports[key]) {
    return res.status(404).json({ message: 'shared report not found' });
  }
  
  delete sharedReports[key];
  const sharedArray = Object.values(sharedReports);
  saveToFile(sharedFile, sharedArray);
  
  res.json({ message: 'share link deleted' });
});

// archive from status or admin to history
app.post('/api/reports/status/:id/archive', (req, res) => {
  const id = Number(req.params.id);
  const item = moveBetweenStores(statusReports, historyReports, id);
  if (!item) return res.status(404).json({ message: 'not found' });
  item.archivedAt = new Date().toLocaleString('th-TH');
  saveToFile(statusFile, statusReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: 'archived', item });
});

app.post('/api/reports/admin/:id/archive', (req, res) => {
  const id = Number(req.params.id);
  const item = moveBetweenStores(adminReports, historyReports, id);
  if (!item) return res.status(404).json({ message: 'not found' });
  item.archivedAt = new Date().toLocaleString('th-TH');
  saveToFile(adminFile, adminReports);
  saveToFile(historyFile, historyReports);
  res.json({ message: 'archived', item });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
