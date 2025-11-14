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

  // Drag and drop functionality
  const dropZone = fileLabel;
  
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.backgroundColor = '#e8f5e9';
    dropZone.style.borderColor = '#1b5e20';
  });
  
  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.backgroundColor = '';
    dropZone.style.borderColor = '';
  });
  
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.style.backgroundColor = '';
    dropZone.style.borderColor = '';
    
    const files = e.dataTransfer.files;
    [...files].forEach(file => {
      if(!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        photoList.push(ev.target.result);
        renderPreview();
      };
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
      btn.onclick = (e) => {
        e.preventDefault();
        photoList.splice(i, 1);
        renderPreview();
      };
      div.appendChild(btn);
      previewContainer.appendChild(div);
    });
  }

  photoInput.addEventListener('change', e => {
    [...e.target.files].forEach(file => {
      if(!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        photoList.push(ev.target.result);
        renderPreview();
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  });

  function showPopup(id, message='') {
    const popup = document.getElementById(id);
    if(message) {
      const p = popup.querySelector('p');
      if(p) p.textContent = message;
    }
    popup.classList.add('active');
  }

  window.closePopup = () => {
    document.getElementById('successPopup').classList.remove('active');
  };
  window.closeWarningPopup = () => {
    document.getElementById('warningPopup').classList.remove('active');
  };

  reportForm.addEventListener('submit', async e => {
    e.preventDefault();
    if(photoList.length === 0){
      showPopup("warningPopup", "กรุณาแนบภาพประกอบอย่างน้อย 1 รูป");
      return;
    }

    const newReport = {
      name: reportForm.name.value,
      grade: reportForm.grade.value,
      date: reportForm.date.value,
      place: reportForm.place.value,
      detail: reportForm.detail.value,
      photos: photoList,
      // ให้ค่า default ฝั่ง client กรณี server ต้องการ
      status: 'รอดำเนินการ',
      timestamp: new Date().toLocaleString('th-TH')
    };

    const submitBtn = document.getElementById('submitBtn');
    try {
      // disable submit to prevent double-submit
      if (submitBtn) submitBtn.disabled = true;

      // send only to status endpoint; server will replicate to admin/history
      const res = await fetch('/api/reports/status', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(newReport)
      });

      if (!res.ok) {
        const text = await res.text().catch(()=>null);
        throw new Error(text || 'ส่งไม่สำเร็จ');
      }

      const result = await res.json();
      showPopup("successPopup");
      reportForm.reset();
      photoList = [];
      renderPreview();
      dateInput.valueAsDate = new Date();
    } catch(err){
      showPopup("warningPopup", "เกิดข้อผิดพลาด กรุณาลองใหม่");
      console.error(err);
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});