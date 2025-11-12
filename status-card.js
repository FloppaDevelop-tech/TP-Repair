document.addEventListener('DOMContentLoaded', () => {
  loadReports();
});

function loadReports() {
  const container = document.getElementById('report-cards');
  let reports = JSON.parse(localStorage.getItem('repairReports')) || [];
  container.innerHTML = '';

  if (reports.length === 0) {
    container.innerHTML = '<p>ยังไม่มีรายการแจ้งซ่อม</p>';
    return;
  }

  reports.reverse().forEach(report => {
    const card = document.createElement('div');
    card.className = 'report-card';

    const info = document.createElement('div');
    info.className = 'card-info';
    info.innerHTML = `
      <h3>${report.name}</h3>
      <p>กลุ่มสาระ: ${report.grade}</p>
      <p>วันที่: ${report.date}</p>
      <p>สถานที่: ${report.place}</p>
      <p>สถานะ: <span class="${statusClass(report.status)}">${report.status}</span></p>
    `;

    const btns = document.createElement('div');
    btns.className = 'card-buttons';

    const detailBtn = document.createElement('button');
    detailBtn.className = 'details-btn';
    detailBtn.textContent = 'รายละเอียด';
    detailBtn.onclick = () => showReportDetail(report); // bind modal ตัวเดียว

    const delBtn = document.createElement('button');
    delBtn.className = 'delete-btn';
    delBtn.textContent = 'ลบ';
    delBtn.onclick = () => deleteReport(report.id);

    btns.append(detailBtn, delBtn);
    card.append(info, btns);
    container.appendChild(card);
  });
}

function statusClass(status) {
  if (status === 'รอดำเนินการ') return 'status-pending';
  if (status === 'กำลังดำเนินการ') return 'status-inprogress';
  if (status === 'เสร็จสิ้น') return 'status-completed';
  return '';
}

function showReportDetail(report) {
  let modal = document.getElementById('reportDetailModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'reportDetailModal';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.background = 'rgba(0,0,0,0.5)';
    modal.style.display = 'flex';
    modal.style.justifyContent = 'center';
    modal.style.alignItems = 'center';
    modal.innerHTML = `
      <div style="background:white;padding:20px;border-radius:10px;max-width:500px;width:90%;">
        <h2>${report.name} (${report.grade})</h2>
        <p><strong>วันที่:</strong> ${report.date}</p>
        <p><strong>สถานที่:</strong> ${report.place}</p>
        <p><strong>รายละเอียด:</strong> ${report.detail}</p>
        ${report.photo ? `<img src="${report.photo}" style="width:100%;margin-top:10px;">` : ''}
        <button id="closeModal" style="margin-top:15px;padding:5px 10px;">ปิด</button>
      </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('closeModal').onclick = () => modal.style.display = 'none';
  } else {
    modal.querySelector('h2').textContent = `${report.name} (${report.grade})`;
    modal.querySelector('p:nth-of-type(1)').innerHTML = `<strong>วันที่:</strong> ${report.date}`;
    modal.querySelector('p:nth-of-type(2)').innerHTML = `<strong>สถานที่:</strong> ${report.place}`;
    modal.querySelector('p:nth-of-type(3)').innerHTML = `<strong>รายละเอียด:</strong> ${report.detail}`;
    const img = modal.querySelector('img');
    if (report.photo) {
      if (img) img.src = report.photo;
      else {
        const newImg = document.createElement('img');
        newImg.src = report.photo;
        newImg.style.width = '100%';
        newImg.style.marginTop = '10px';
        modal.querySelector('div').appendChild(newImg);
      }
    } else if (img) img.remove();
    modal.style.display = 'flex';
  }
}

function deleteReport(reportId) {
  if (!confirm('คุณต้องการลบรายการนี้หรือไม่?')) return;
  let reports = JSON.parse(localStorage.getItem('repairReports')) || [];
  reports = reports.filter(r => r.id !== reportId);
  localStorage.setItem('repairReports', JSON.stringify(reports));
  loadReports();
  alert('ลบรายการเรียบร้อยแล้ว');
}
