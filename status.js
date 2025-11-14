document.addEventListener('DOMContentLoaded', () => loadReports());

let deleteTargetId = null;

// --- Load all reports ---
async function loadReports() {
  const container = document.getElementById('report-cards');
  if (!container) return;
  container.innerHTML = '';

  try {
    // --- API BASE ---
    const API_BASE = window.location.origin + '/api/reports';
    const res = await fetch(`${API_BASE}/status`);
    if (!res.ok) throw new Error('Failed to fetch reports');
    const reports = await res.json();

    if (reports.length === 0) {
      container.innerHTML = '<p>ยังไม่มีรายการแจ้งซ่อม</p>';
      return;
    }

    // แสดงรายการล่าสุดก่อน
    reports.reverse().forEach(report => {
      const card = document.createElement('div');
      card.className = 'report-card';
      card.innerHTML = `
        <div class="card-info">
          <h3>${report.name} (${report.grade || ''})</h3>
          <p><strong>รหัส:</strong> ${report.id}</p>
          <p>วันที่: ${report.date || report.timestamp}</p>
          <p>สถานที่: ${report.place || '-'}</p>
          <p>สถานะ: <span class="${statusClass(report.status)}">${report.status}</span></p>
        </div>
        <div class="card-buttons">
          <button type="button" class="details-btn">รายละเอียด</button>
          <button type="button" class="share-btn">แชร์</button>
          <button type="button" class="delete-btn">ลบ</button>
        </div>`;
      container.appendChild(card);

      const [detailBtn, shareBtn, delBtn] = card.querySelectorAll('button');
      detailBtn.addEventListener('click', e => { e.preventDefault(); showDetail(report); });
      shareBtn.addEventListener('click', e => { e.preventDefault(); shareReport(report.id); });
      delBtn.addEventListener('click', e => { e.preventDefault(); showDeletePopup(report.id); });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

// --- Helper: Status CSS ---
function statusClass(s) {
  if (s === 'รอดำเนินการ') return 'status-pending';
  if (s === 'กำลังดำเนินการ') return 'status-inprogress';
  if (s === 'เสร็จสิ้น') return 'status-completed';
  return '';
}

// --- Delete ---
function showDeletePopup(id) {
  deleteTargetId = id;
  const popup = document.getElementById('deleteModal');
  popup.style.display = 'flex';
  popup.classList.add('active');
}

document.getElementById('confirmDelete').addEventListener('click', async (e) => {
  e.preventDefault();
  if (!deleteTargetId) return;

  try {
    const API_BASE = window.location.origin + '/api/reports';
    const res = await fetch(`${API_BASE}/status/${deleteTargetId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete failed');

    deleteTargetId = null;
    const popup = document.getElementById('deleteModal');
    popup.style.display = 'none';
    popup.classList.remove('active');

    loadReports();
  } catch (err) {
    console.error(err);
    alert('ไม่สามารถลบข้อมูลได้');
  }
});

document.getElementById('cancelDelete').addEventListener('click', e => {
  e.preventDefault();
  deleteTargetId = null;
  const popup = document.getElementById('deleteModal');
  popup.style.display = 'none';
  popup.classList.remove('active');
});

// --- Detail & Share ---
function showDetail(report) {
  const modal = document.getElementById('detailModal');
  const title = document.getElementById('detailTitle');
  const content = document.getElementById('detailContent');
  
  if (!modal || !title || !content) return;
  
  // Status badge
  let statusClass = 'status-pending';
  if (report.status === 'กำลังดำเนินการ') statusClass = 'status-inprogress';
  if (report.status === 'เสร็จสิ้น') statusClass = 'status-completed';
  
  // Photos
  let photosHtml = '';
  if (report.photos && report.photos.length > 0) {
    photosHtml = `
      <div class="detail-popup-photos">
        ${report.photos.map((p, i) => `<img src="${p}" alt="ภาพที่ ${i + 1}" onclick="openImageModal('${p}')">`).join('')}
      </div>
    `;
  } else {
    photosHtml = '<p style="color: #999; text-align: center; padding: 20px;">ไม่มีภาพประกอบ</p>';
  }
  
  title.textContent = `${report.name} (${report.grade || '-'})`;
  content.innerHTML = `
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
      <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
        <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">รหัส</strong>
        <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.id}</p>
      </div>
      <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
        <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">สถานะ</strong>
        <p style="margin: 5px 0 0 0;"><span class="${statusClass}">${report.status || 'รอดำเนินการ'}</span></p>
      </div>
      <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
        <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">วันที่</strong>
        <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.date || report.timestamp || '-'}</p>
      </div>
      <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
        <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">สถานที่</strong>
        <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.place || '-'}</p>
      </div>
    </div>
    <div style="margin-bottom: 20px;">
      <strong style="color: #2d7a3e; font-size: 0.9rem; text-transform: uppercase; display: block; margin-bottom: 8px;">รายละเอียดปัญหา</strong>
      <div style="background: #f5f9f7; padding: 15px; border-radius: 6px; color: #333; line-height: 1.6; white-space: pre-wrap;">${report.detail || '-'}</div>
    </div>
    <div>
      <strong style="color: #2d7a3e; font-size: 0.9rem; text-transform: uppercase; display: block; margin-bottom: 8px;">ภาพประกอบ</strong>
      ${photosHtml}
    </div>
  `;
  
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeDetailModal() {
  const modal = document.getElementById('detailModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

// Close detail modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('detailModal');
  if (modal && e.target === modal) {
    closeDetailModal();
  }
});

function shareReport(id) {
  const url = `${window.location.origin}/share.html?id=${id}`;
  const modal = document.getElementById('shareModal');
  const urlInput = document.getElementById('shareUrlInput');
  const copyBtn = document.getElementById('copyShareBtn');
  const openBtn = document.getElementById('openShareBtn');
  
  if (!modal || !urlInput) return;
  
  urlInput.value = url;
  modal.style.display = 'flex';
  modal.classList.add('active');
  
  // Copy to clipboard
  navigator.clipboard.writeText(url).catch(() => {});
  
  // Copy button
  if (copyBtn) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(url).then(() => {
        copyBtn.textContent = 'คัดลอกแล้ว!';
        setTimeout(() => copyBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
      }).catch(() => {
        urlInput.select();
        document.execCommand('copy');
        copyBtn.textContent = 'คัดลอกแล้ว!';
        setTimeout(() => copyBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
      });
    };
  }
  
  // Open button
  if (openBtn) {
    openBtn.onclick = () => {
      window.open(url, '_blank');
    };
  }
}

function closeShareModal() {
  const modal = document.getElementById('shareModal');
  if (modal) {
    modal.style.display = 'none';
    modal.classList.remove('active');
  }
}

// Close share modal when clicking outside
document.addEventListener('click', (e) => {
  const modal = document.getElementById('shareModal');
  if (modal && e.target === modal) {
    closeShareModal();
  }
});

// Image modal
function openImageModal(src) {
  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
  modal.innerHTML = `
    <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
    <button onclick="this.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; color: #2d7a3e; font-weight: bold;">×</button>
  `;
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  document.body.appendChild(modal);
}
