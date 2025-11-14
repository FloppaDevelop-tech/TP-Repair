document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById('maintenanceForm');
  const dateInput = document.querySelector('input[name="date"]');
  const photoInput = document.getElementById('photoInput');
  const previewContainer = document.getElementById('previewContainer');
  const fileLabel = document.getElementById('fileLabel');
  let photoList = [];

  dateInput.valueAsDate = new Date();

  // เปิด file picker เมื่อกด label
  if (fileLabel) {
    fileLabel.addEventListener('click', (e) => {
      e.preventDefault();
      photoInput.click();
    });
  }

  // Drag & drop
  const dropZone = fileLabel;
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', e => { e.preventDefault(); dropZone.classList.remove('drag-over'); });
  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    [...e.dataTransfer.files].forEach(file => {
      if(!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => { photoList.push(ev.target.result); renderPreview(); };
      reader.readAsDataURL(file);
    });
  });

  function renderPreview() {
    previewContainer.innerHTML = '';
    photoList.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'preview-box';
      div.innerHTML = `<img src="${img}">`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'x';
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

  reportForm.addEventListener('submit', async e => {
    e.preventDefault();
    if(photoList.length === 0) { showPopup("warningPopup", "กรุณาแนบภาพประกอบอย่างน้อย 1 รูป"); return; }

    const newReport = {
      name: reportForm.name.value,
      grade: reportForm.grade.value,
      date: reportForm.date.value,
      place: reportForm.place.value,
      detail: reportForm.detail.value,
      photos: photoList,
      status: 'รอดำเนินการ',
      timestamp: new Date().toLocaleString('th-TH')
    };

    const submitBtn = document.getElementById('submitBtn');
    try {
      if(submitBtn) submitBtn.disabled = true;
      // Use relative path for Vercel deployment
      const API_BASE = window.location.origin + '/api/reports';
      const res = await fetch(`${API_BASE}/status`, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify(newReport)
      });
      if(!res.ok) throw new Error(await res.text().catch(()=>null) || 'ส่งไม่สำเร็จ');
      showPopup("successPopup");
      reportForm.reset();
      photoList = [];
      renderPreview();
      dateInput.valueAsDate = new Date();
    } catch(err){
      console.error(err);
      showPopup("warningPopup","เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      if(submitBtn) submitBtn.disabled = false;
    }
  });
});
