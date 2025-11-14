let autoRefreshInterval = null;
let isEditingMode = false;

document.addEventListener('DOMContentLoaded', () => {
    loadAdminReports();
    startAutoRefresh();
});

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(() => {
        if (!isEditingMode) {
            loadAdminReports();
        }
    }, 5000); // auto-refresh ทุก 5 วินาที (เฉพาะเมื่อไม่ได้อยู่ในโหมดแก้ไข)
}

function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }
}

// --- API BASE ---
const API_BASE = window.location.origin + '/api/reports';

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
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 15px;">
                    <h3 style="margin: 0; flex: 1;">รายงาน #${r.id}</h3>
                    <button class="edit-btn" style="background: #f5f9f7; color: #2d7a3e; border: 2px solid #2d7a3e; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">✏️ แก้ไข</button>
                </div>
                <div class="report-card-meta">
                    <div>
                        <p><strong>ID:</strong> #${r.id}</p>
                        <p><strong>กลุ่มสาระ:</strong> <span class="editable-field" data-field="grade">${r.grade || '-'}</span></p>
                    </div>
                    <div>
                        <p><strong>วันที่:</strong> <span class="editable-field" data-field="date">${r.date || '-'}</span></p>
                        <p><strong>สถานที่:</strong> <span class="editable-field" data-field="place">${r.place || '-'}</span></p>
                    </div>
                </div>
                <div style="margin: 12px 0;">
                    <p><strong>ชื่อผู้แจ้ง:</strong></p>
                    <span class="editable-field" data-field="name" style="display: block; padding: 8px; background: #f5f9f7; border-radius: 6px; margin-top: 4px;">${r.name || 'ไม่ระบุชื่อ'}</span>
                </div>
                <div style="margin: 12px 0;">
                    <p><strong>รายละเอียด:</strong></p>
                    <span class="editable-field" data-field="detail" style="display: block; padding: 8px; background: #f5f9f7; border-radius: 6px; margin-top: 4px; white-space: pre-wrap; min-height: 60px;">${r.detail || '-'}</span>
                </div>
                ${photosHtml}
                <div style="margin: 12px 0;">
                    <p><strong>สถานะ:</strong></p>
                    <select class="status-select" data-field="status">
                        <option value="รอดำเนินการ">รอดำเนินการ</option>
                        <option value="กำลังดำเนินการ">กำลังดำเนินการ</option>
                        <option value="เสร็จสิ้น">เสร็จสิ้น</option>
                    </select>
                </div>
                <div class="card-buttons" style="display: none;" id="editButtons-${r.id}">
                    <button class="save-btn" data-id="${r.id}">💾 บันทึก</button>
                    <button class="cancel-btn" data-id="${r.id}">❌ ยกเลิก</button>
                </div>
                <div class="card-buttons" id="viewButtons-${r.id}">
                    <button class="update-btn" data-id="${r.id}">อัปเดตสถานะ</button>
                    <button class="delete-btn" data-id="${r.id}">ลบ</button>
                </div>
            `;

            const select = card.querySelector('.status-select');
            select.value = statusValue;
            const editBtn = card.querySelector('.edit-btn');
            const editButtons = card.querySelector(`#editButtons-${r.id}`);
            const viewButtons = card.querySelector(`#viewButtons-${r.id}`);
            const editableFields = card.querySelectorAll('.editable-field');

            let originalData = { ...r };

            // Edit button - enable editing
            editBtn.onclick = () => {
                isEditingMode = true;
                stopAutoRefresh();
                editButtons.style.display = 'flex';
                viewButtons.style.display = 'none';
                editBtn.style.display = 'none';
                
                editableFields.forEach(field => {
                    const fieldName = field.dataset.field;
                    const currentValue = field.textContent.trim();
                    if (fieldName === 'detail') {
                        field.innerHTML = `<textarea style="width: 100%; min-height: 80px; padding: 8px; border: 2px solid #2d7a3e; border-radius: 6px; font-family: inherit; resize: vertical;">${currentValue}</textarea>`;
                    } else if (fieldName === 'date') {
                        field.innerHTML = `<input type="date" value="${currentValue}" style="width: 100%; padding: 8px; border: 2px solid #2d7a3e; border-radius: 6px; font-family: inherit;">`;
                    } else {
                        field.innerHTML = `<input type="text" value="${currentValue}" style="width: 100%; padding: 8px; border: 2px solid #2d7a3e; border-radius: 6px; font-family: inherit;">`;
                    }
                });
            };

            // Save button
            card.querySelector('.save-btn').onclick = async () => {
                try {
                    const updatedData = { ...originalData };
                    
                    editableFields.forEach(field => {
                        const fieldName = field.dataset.field;
                        const input = field.querySelector('input, textarea');
                        if (input) {
                            updatedData[fieldName] = input.value;
                        }
                    });
                    
                    updatedData.status = select.value;
                    
                    const res = await fetch(`${API_BASE}/admin/${r.id}`, {
                        method: 'PATCH',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify(updatedData)
                    });
                    if(!res.ok) throw new Error('Update failed');
                    showAdminPopup('บันทึกการแก้ไขสำเร็จ', true);
                    isEditingMode = false;
                    startAutoRefresh();
                    loadAdminReports();
                } catch(e){
                    showAdminPopup('บันทึกไม่สำเร็จ', false);
                    console.error(e);
                }
            };

            // Cancel button
            card.querySelector('.cancel-btn').onclick = () => {
                isEditingMode = false;
                startAutoRefresh();
                loadAdminReports();
            };

            // Update status only
            card.querySelector('.update-btn').onclick = async () => {
                try {
                    const newStatus = select.value;
                    const res = await fetch(`${API_BASE}/admin/${r.id}`, {
                        method: 'PATCH',
                        headers: {'Content-Type':'application/json'},
                        body: JSON.stringify({status:newStatus})
                    });
                    if(!res.ok) throw new Error('Update failed');
                    showAdminPopup('อัปเดตสถานะสำเร็จ', true);
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

