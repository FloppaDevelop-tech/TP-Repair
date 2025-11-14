document.addEventListener("DOMContentLoaded", () => {
  const reportForm = document.getElementById('maintenanceForm');
  const dateInput = document.querySelector('input[name="date"]');
  const photoInput = document.getElementById('photoInput');
  const previewContainer = document.getElementById('previewContainer');
  const fileLabel = document.getElementById('fileLabel');
  const submitBtn = document.getElementById('submitBtn');

  let photoList = [];

  // --- API BASE (Unified API) ---
  const API_BASE = 'https://app-tp-repair.vercel.app/api/reports/all';

  // ตั้งค่าวันที่ default
  dateInput.valueAsDate = new Date();

  // เปิด file picker
  fileLabel?.addEventListener('click', e => {
    e.preventDefault();
    photoInput.click();
  });

  // เลือกรูป
  photoInput.addEventListener('change', e => {
    [...e.target.files].forEach(file => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = ev => {
        photoList.push(ev.target.result);
        renderPreview();
      };
      reader.readAsDataURL(file);
    });
    photoInput.value = '';
  });

  function renderPreview() {
    previewContainer.innerHTML = '';
    photoList.forEach((img, i) => {
      const div = document.createElement('div');
      div.className = 'preview-box';
      div.innerHTML = `<img src="${img}" alt="preview">`;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = 'x';
      btn.onclick = () => {
        photoList = photoList.filter((_, idx) => idx !== i);
        renderPreview();
      };
      div.appendChild(btn);
      previewContainer.appendChild(div);
    });
  }

  // ป๊อปอัพ
  function showPopup(id, message = '') {
    const popup = document.getElementById(id);
    if (!popup) return;
    const p = popup.querySelector('p');
    if (message && p) p.textContent = message;
    popup.classList.add('active');
  }

  window.closePopup = () => document.getElementById('successPopup')?.classList.remove('active');
  window.closeWarningPopup = () => document.getElementById('warningPopup')?.classList.remove('active');

  // ส่งข้อมูล
  async function submitReport(event) {
    event.preventDefault();

    if (photoList.length === 0) {
      showPopup('warningPopup', 'กรุณาแนบภาพอย่างน้อย 1 รูป');
      return;
    }

    const originalText = submitBtn.textContent;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'กำลังส่ง...';

      const reportData = {
        name: document.querySelector('input[name="name"]').value.trim(),
        grade: document.querySelector('input[name="grade"]').value.trim(),
        place: document.querySelector('input[name="place"]').value.trim(),
        detail: document.querySelector('textarea[name="detail"]').value.trim(),
        date: new Date().toLocaleString("th-TH"),
        status: 'รอดำเนินการ',
        photos: photoList
      };

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData)
      });

      if (!res.ok) {
        const text = await res.text().catch(() => null);
        throw new Error(text || 'ส่งไม่สำเร็จ');
      }

      showPopup('successPopup');
      reportForm.reset();
      photoList = [];
      renderPreview();

      // แจ้งหน้าอื่นว่ามีข้อมูลใหม่
      try { localStorage.setItem('reports-updated', String(Date.now())); } catch (_) {}

    } catch (error) {
      console.error('Submit error:', error);
      showPopup('warningPopup', 'เกิดข้อผิดพลาดในการบันทึก กรุณาลองใหม่');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }

  reportForm.addEventListener('submit', submitReport);
});
