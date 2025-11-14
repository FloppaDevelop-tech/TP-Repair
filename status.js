document.addEventListener('DOMContentLoaded', () => loadReports());

let deleteTargetId = null;

// --- Load all reports ---
async function loadReports() {
  const container = document.getElementById('report-cards');
  if (!container) return;
  container.innerHTML = '';

  try {
    // --- API BASE ---
    const API_BASE = 'https://app-tp-repair.vercel.app/api/reports';
    const res = await fetch(API_BASE);
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
    const res = await fetch(`https://app-tp-repair.vercel.app/api/reports/${deleteTargetId}`, {
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
  let photos = '';
  if (report.photos && report.photos.length > 0) {
    photos = report.photos.map(p => `<img src="${p}" style="max-width:80px;margin:2px">`).join('');
  }
  alert(
    `รายละเอียด:\nชื่อ: ${report.name}\nรหัส: ${report.id}\nสถานะ: ${report.status}\nวันที่: ${report.date}\nสถานที่: ${report.place}\nรายละเอียด: ${report.detail}\nรูปภาพ:\n${photos}`
  );
}

function shareReport(id) {
  const url = `https://app-tp-repair.vercel.app/share/${id}`;
  navigator.clipboard.writeText(url)
    .then(() => alert('ลิงก์ถูกคัดลอกแล้ว!'))
    .catch(() => alert('ไม่สามารถคัดลอกลิงก์ได้'));
}
