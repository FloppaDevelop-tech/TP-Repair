document.addEventListener('DOMContentLoaded', () => loadStatusReports());

window.addEventListener('storage', e => {
  if(e.key==='reports-updated') loadStatusReports();
});

let statusDeleteTargetId = null;

async function loadStatusReports(){
  const container = document.getElementById('report-cards');
  if(!container) return;
  container.innerHTML='';

  try{
    const res = await fetch('/api/reports/status');
    if(!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
    let reports = await res.json();
    if(reports.length===0){ 
      container.innerHTML='<p>ยังไม่มีรายการแจ้งซ่อม</p>'; 
      return; 
    }
    reports.reverse().forEach(report=>{
      const card=document.createElement('div');
      card.className='report-card';
      card.innerHTML=`
        <div class="card-info">
          <h3>${report.name} (${report.grade})</h3>
          <p><strong>รหัส:</strong> ${report.id}</p>
          <p>วันที่: ${report.date}</p>
          <p>สถานที่: ${report.place}</p>
          <p>สถานะ: <span class="${statusClass(report.status)}">${report.status}</span></p>
        </div>
        <div class="card-buttons">
          <button type="button" class="details-btn">รายละเอียด</button>
          <button type="button" class="share-btn">แชร์</button>
          <button type="button" class="delete-btn">ลบ</button>
        </div>`;
      container.appendChild(card);

      // Button events
      const [detailBtn, shareBtn, delBtn] = card.querySelectorAll('button');
      detailBtn.addEventListener('click', (e) => { e.preventDefault(); showStatusDetail(report); });
      shareBtn.addEventListener('click', (e) => { e.preventDefault(); shareStatusReport(report.id); });
      delBtn.addEventListener('click', (e) => { e.preventDefault(); showStatusDeletePopup(report.id); });
    });
  }catch(err){ 
    console.error(err); 
    container.innerHTML='<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>'; 
  }
}

function statusClass(s){
  if(s==='รอดำเนินการ') return 'status-pending';
  if(s==='กำลังดำเนินการ') return 'status-inprogress';
  if(s==='เสร็จสิ้น') return 'status-completed';
  return '';
}

// --- Delete ---
function showStatusDeletePopup(id){ 
  statusDeleteTargetId = id; 
  const popup = document.getElementById('deleteModal'); 
  popup.style.display = 'flex'; 
  popup.classList.add('active'); 
}

document.getElementById('confirmDelete').addEventListener('click', async (e) => {
  e.preventDefault();
  if(statusDeleteTargetId===null) return;
  try{
    const res = await fetch(`/api/reports/status/${statusDeleteTargetId}`, {method:'DELETE'});
    if(!res.ok) throw new Error('ลบไม่สำเร็จ');
    statusDeleteTargetId = null;
    const popup = document.getElementById('deleteModal'); 
    popup.style.display = 'none'; 
    popup.classList.remove('active');
    loadStatusReports();
  }catch(err){ 
    console.error(err); 
    alert('ไม่สามารถลบข้อมูลได้'); 
  }
});

document.getElementById('cancelDelete').addEventListener('click', (e) => { 
  e.preventDefault();
  statusDeleteTargetId=null; 
  const popup=document.getElementById('deleteModal'); 
  popup.style.display='none'; 
  popup.classList.remove('active'); 
});

// --- Detail & Share functions ---
// ฟังก์ชัน showStatusDetail() และ shareStatusReport() เหมือนกับ code ก่อนหน้า
