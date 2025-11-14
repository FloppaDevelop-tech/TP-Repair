document.addEventListener('DOMContentLoaded', () => {
    loadAdminReports();
    setInterval(loadAdminReports, 5000); // auto-refresh ทุก 5 วินาที
});

const API_BASE = 'https://tp-repair.vercel.app/api/reports';

// --- Popup ---
function showAdminPopup(message, isSuccess = true) {
    let popup = document.getElementById('adminPopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'adminPopup';
        popup.className = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <div class="popup-icon"></div>
                <h3></h3>
                <p></p>
                <button class="close-btn" onclick="closeAdminPopup()">ปิด</button>
            </div>
        `;
        document.body.appendChild(popup);
    }

    const icon = popup.querySelector('.popup-icon');
    const title = popup.querySelector('h3');
    const text = popup.querySelector('p');

    if (isSuccess) {
        icon.className = 'popup-icon success-icon';
        title.textContent = 'สำเร็จ';
        icon.innerHTML = '';
    } else {
        icon.className = 'popup-icon warning-icon';
        title.textContent = 'เกิดข้อผิดพลาด';
        icon.innerHTML = '';
    }

    text.textContent = message;
    popup.classList.add('active');
}

window.closeAdminPopup = () => {
    const popup = document.getElementById('adminPopup');
    if (popup) popup.classList.remove('active');
};

// --- Delete confirmation ---
function showDeleteConfirm(callback) {
    let popup = document.getElementById('adminDeletePopup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'adminDeletePopup';
        popup.className = 'popup';
        popup.innerHTML = `
            <div class="popup-content">
                <h3>ยืนยันการลบ</h3>
                <p>คุณแน่ใจว่าต้องการลบรายงานนี้หรือไม่?</p>
                <div style="display:flex; gap:10px; justify-content:center; margin-top:20px;">
                    <button id="confirmDeleteBtn" class="delete-btn" style="flex:1;">ลบ</button>
                    <button id="cancelDeleteBtn" class="close-btn" style="flex:1;">ยกเลิก</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
    }

    const confirmBtn = popup.querySelector('#confirmDeleteBtn');
    const cancelBtn = popup.querySelector('#cancelDeleteBtn');

    confirmBtn.onclick = () => {
        popup.classList.remove('active');
        callback();
    };
    cancelBtn.onclick = () => popup.classList.remove('active');

    popup.classList.add('active');
}

// --- Load admin reports ---
async function loadAdminReports() {
    const container = document.getElementById('reportContainer');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE}/admin`);
        if (!res.ok) throw new Error('Failed to fetch admin reports');
        const reports = await res.json();

        if (reports.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; grid-column:1/-1; padding:40px;">ยังไม่มีรายงาน</p>';
            return;
        }

        container.innerHTML = '';

        reports.forEach(r => {
            const card = document.createElement('div');
            card.className = 'report-card';

            const statusValue = r.status || 'รอดำเนินการ';
            let statusClass = 'pending';
            if (statusValue === 'กำลังดำเนินการ') statusClass = 'in-progress';
            if (statusValue === 'เสร็จสิ้น') statusClass = 'done';

            const photosHtml = r.photos && r.photos.length > 0
                ? `<div class="photo-gallery">${r.photos.map(p => `<img src="${p}" alt="photo" class="admin-photo">`).join('')}</div>`
                : '';

            card.innerHTML = `
                <h3>${r.name || 'ไม่ระบุชื่อ'}</h3>
                <div class="report-card-meta">
                    <div>
                        <p><strong>ID:</strong> #${r.id}</p>
                        <p><strong>กลุ่มสาระ:</strong> ${r.grade || '-'}</p>
                    </div>
                    <div>
                        <p><strong>วันที่:</strong> ${r.date || '-'}</p>
                        <p><strong>สถานที่:</strong> ${r.place || '-'}</p>
                    </div>
                </div>
                <p><strong>รายละเอียด:</strong> ${r.detail || '-'}</p>
                ${photosHtml}
                <div>
                    <p><strong>สถานะ:</strong></p>
                    <select class="status-select">
                        <option value="รอดำเนินการ">รอดำเนินการ</option>
                        <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                    </select>
                </div>
                <div class="card-buttons">
                    <button class="update-btn">อัปเดต</button>
                    <button class="delete-btn">ลบ</button>
                </div>
            `;

            const select = card.querySelector('.status-select');
            select.value = statusValue;

            // Update status
            card.querySelector('.update-btn').onclick = async () => {
                try {
                    const newStatus = select.value;
                    const res = await fetch(`${API_BASE}/admin/${r.id}`, {
                        method: 'PATCH',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({status:newStatus})
                    });
                    if(!res.ok) throw new Error('Update failed');
                    showAdminPopup('อัปเดตสำเร็จ', true);
                    try { localStorage.setItem('reports-updated', String(Date.now())); } catch(e){}
                    loadAdminReports();
                } catch(e){
                    showAdminPopup('อัปเดตไม่สำเร็จ', false);
                    console.error(e);
                }
            };

            // Delete
            card.querySelector('.delete-btn').onclick = async () => {
                showDeleteConfirm(async () => {
                    try{
                        const res = await fetch(`${API_BASE}/admin/${r.id}`, { method:'DELETE' });
                        if(!res.ok) throw new Error('Delete failed');
                        showAdminPopup('ลบสำเร็จ', true);
                        loadAdminReports();
                    }catch(e){
                        showAdminPopup('ลบไม่สำเร็จ', false);
                        console.error(e);
                    }
                });
            };

            container.appendChild(card);
        });

    } catch(e){
        container.innerHTML = '<p style="text-align:center; color:#d32f2f; grid-column:1/-1; padding:40px;">โหลดรายงานไม่สำเร็จ</p>';
        console.error(e);
    }
}
