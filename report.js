document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById('maintenanceForm');
  const dateInput = document.querySelector('input[name="date"]');
  const photoInput = document.getElementById('photoInput');
  const previewContainer = document.getElementById('previewContainer');
  const fileLabel = document.getElementById('fileLabel');
  let photoList = [];

  // --- API BASE ---
  const API_BASE = 'https://tp-repair.vercel.app/api/reports';

  dateInput.valueAsDate = new Date();

  // เปิด file picker
  fileLabel?.addEventListener('click', e => { e.preventDefault(); photoInput.click(); });

  photoInput.addEventListener('change', e => {
    [...e.target.files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => { photoList.push(ev.target.result); renderPreview(); };
      reader.readAsDataURL(file);
    });
    photoInput.value = '';
  });

  function renderPreview() {
    previewContainer.innerHTML = '';
    photoList.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'preview-box';
      div.innerHTML = `<img src="${img}">`;
      const btn = document.createElement('button');
      btn.type='button';
      btn.textContent='x';
      btn.onclick = () => { photoList.splice(i, 1); renderPreview(); };
      div.appendChild(btn);
      previewContainer.appendChild(div);
    });
  }

  function showPopup(id, message='') {
    const popup = document.getElementById(id);
    if(message) popup.querySelector('p').textContent = message;
    popup.classList.add('active');
  }
  window.closePopup = () => document.getElementById('successPopup').classList.remove('active');
  window.closeWarningPopup = () => document.getElementById('warningPopup').classList.remove('active');

  async function submitReport(event) {
    event.preventDefault();
    if(photoList.length === 0){ 
      showPopup('warningPopup','กรุณาแนบภาพประกอบอย่างน้อย 1 รูป'); 
      return; 
    }

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่ง...';

      const reportData = {
        name: document.getElementById('name').value.trim(),
        grade: document.getElementById('grade').value,
        place: document.getElementById('place').value.trim(),
        detail: document.getElementById('detail').value.trim(),
        date: new Date().toLocaleString("th-TH"),
        status: 'รอดำเนินการ',
        photos: photoList
      };

      const res = await fetch(`${API_BASE}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if(!res.ok) {
        const text = await res.text().catch(()=>null);
        throw new Error(text || 'ส่งไม่สำเร็จ');
      }

      showPopup('successPopup');
      reportForm.reset();
      photoList = [];
      renderPreview();

      // notify other pages
      try { localStorage.setItem('reports-updated', String(Date.now())); } catch(e) {}

    } catch (error) {
      console.error('Submit error:', error);
      showPopup('warningPopup','เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  reportForm.addEventListener('submit', submitReport);
});
