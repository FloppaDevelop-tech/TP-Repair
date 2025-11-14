document.addEventListener('DOMContentLoaded', () => loadStatusReports());

let statusDeleteTargetId = null;

// --- Load status reports ---
async function loadStatusReports() {
  const container = document.getElementById('report-cards');
  if (!container) return;
  container.innerHTML = '';

  try {
    const res = await fetch('https://tp-repair.vercel.app/api/reports/status');
    if (!res.ok) throw new Error('Failed to fetch reports');
    const reports = await res.json();

    if (reports.length === 0) {
      container.innerHTML = '<p>ยังไม่มีรายการแจ้งซ่อม</p>';
      return;
    }

    reports.reverse().forEach(report => {
      const card = document.createElement('div');
      card.className = 'report-card';
      card.innerHTML = `
        <div class="card-info">
          <h3>${report.name} (${report.grade || ''})</h3>
          <p><strong>รหัส:</strong> ${report.id}</p>
          <p>วันที่: ${report.timestamp || report.date}</p>
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
      detailBtn.addEventListener('click', (e) => { e.preventDefault(); showStatusDetail(report); });
      shareBtn.addEventListener('click', (e) => { e.preventDefault(); shareStatusReport(report.id); });
      delBtn.addEventListener('click', (e) => { e.preventDefault(); showStatusDeletePopup(report.id); });
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>';
  }
}

// --- Helper ---
function statusClass(s) {
  if (s === 'รอดำเนินการ') return 'status-pending';
  if (s === 'กำลังดำเนินการ') return 'status-inprogress';
  if (s === 'เสร็จสิ้น') return 'status-completed';
  return '';
}

// --- Delete ---
function showStatusDeletePopup(id) {
  statusDeleteTargetId = id;
  const popup = document.getElementById('deleteModal');
  popup.style.display = 'flex';
  popup.classList.add('active');
}

document.getElementById('confirmDelete').addEventListener('click', async (e) => {
  e.preventDefault();
  if (statusDeleteTargetId === null) return;

  try {
    const res = await fetch(`https://tp-repair.vercel.app/api/reports/status/${statusDeleteTargetId}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Delete failed');

    statusDeleteTargetId = null;
    const popup = document.getElementById('deleteModal');
    popup.style.display = 'none';
    popup.classList.remove('active');

    loadStatusReports();
  } catch (err) {
    console.error(err);
    alert('ไม่สามารถลบข้อมูลได้');
  }
});

document.getElementById('cancelDelete').addEventListener('click', (e) => {
  e.preventDefault();
  statusDeleteTargetId = null;
  const popup = document.getElementById('deleteModal');
  popup.style.display = 'none';
  popup.classList.remove('active');
});

// --- Detail & Share placeholders ---
function showStatusDetail(report) {
  alert(`รายละเอียด:\nชื่อ: ${report.name}\nสถานะ: ${report.status}\nวันที่: ${report.timestamp}`);
}

function shareStatusReport(id) {
  const url = `https://tp-repair.vercel.app/share/${id}`;
  navigator.clipboard.writeText(url)
    .then(() => alert('ลิงก์ถูกคัดลอกแล้ว!'))
    .catch(() => alert('ไม่สามารถคัดลอกลิงก์ได้'));
}
