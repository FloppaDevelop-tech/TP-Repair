document.addEventListener('DOMContentLoaded', () => {
    loadStatusReports();
});

// listen to storage events from other tabs (e.g., admin page updates)
window.addEventListener('storage', (e) => {
    if (e.key === 'reports-updated') {
        // another tab updated reports — refresh the list
        loadStatusReports();
    }
});

let statusDeleteTargetId = null;

// โหลดข้อมูล report จาก server
async function loadStatusReports() {
    const container = document.getElementById('report-cards');
    if (!container) return;
    container.innerHTML = '';

    try {
    const res = await fetch('/api/reports/status'); 
        if (!res.ok) throw new Error('ไม่สามารถดึงข้อมูลได้');
        let reports = await res.json();

        if (reports.length === 0) {
            container.innerHTML = '<p>ยังไม่มีรายการแจ้งซ่อม</p>';
            return;
        }

        // แสดงรายการล่าสุดก่อน
        reports.reverse().forEach(report => {
            const card = document.createElement('div');
            card.className = 'report-card';

            const info = document.createElement('div');
            info.className = 'card-info';
            info.innerHTML = `
                <h3>${report.name} (${report.grade})</h3>
                <p><strong>รหัส:</strong> ${report.id}</p>
                <p>วันที่: ${report.date}</p>
                <p>สถานที่: ${report.place}</p>
                <p>สถานะ: <span class="${statusClass(report.status)}">${report.status}</span></p>
            `;

            const btns = document.createElement('div');
            btns.className = 'card-buttons';

            const detailBtn = document.createElement('button');
            detailBtn.className = 'details-btn';
            detailBtn.textContent = 'รายละเอียด';
            detailBtn.onclick = () => showStatusDetail(report);

            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.textContent = 'แชร์';
            shareBtn.onclick = () => shareStatusReport(report.id);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'ลบ';
            delBtn.onclick = () => showStatusDeletePopup(report.id);

            btns.append(detailBtn, shareBtn, delBtn);
            card.append(info, btns);
            container.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
}

// แปลงชื่อ status เป็น class
function statusClass(status) {
    if (status === 'รอดำเนินการ') return 'status-pending';
    if (status === 'กำลังดำเนินการ') return 'status-inprogress';
    if (status === 'เสร็จสิ้น') return 'status-completed';
    return '';
}

// ปลอดภัย: escape HTML text to avoid injection when using innerHTML
function escapeHtml(input) {
    if (input === undefined || input === null) return '';
    return String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// --- Popup รายละเอียด ---
function showStatusDetail(report) {
    // always ensure modal element exists
    let modal = document.getElementById('statusDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'statusDetailModal';
        modal.className = 'detail-popup';
        document.body.appendChild(modal);
    }

    // safe fallbacks for fields
    const safe = v => (v === undefined || v === null || v === '') ? '-' : v;

    // update content every time so stale values (or typos) don't persist
    modal.innerHTML = `
        <div class="detail-popup-content">
            <h2>${escapeHtml(safe(report.name))} (${escapeHtml(safe(report.grade))})</h2>
            <p><strong>รหัส:</strong> ${escapeHtml(safe(report.id))}</p>
            <p><strong>วันที่:</strong> ${escapeHtml(safe(report.date))}</p>
            <p><strong>สถานที่:</strong> ${escapeHtml(safe(report.place))}</p>
            <p><strong>รายละเอียด:</strong> ${escapeHtml(safe(report.detail))}</p>
            <div class="detail-popup-photos"></div>
            <button id="closeStatusModal" class="close-detail">ปิด</button>
        </div>
    `;

    const photoContainer = modal.querySelector('.detail-popup-photos');
    photoContainer.innerHTML = '';
    if(report.photos && report.photos.length > 0) {
        report.photos.forEach(src => {
            const photoBox = document.createElement('div');
            photoBox.className = 'photo-box';
            const img = document.createElement('img');
            img.src = src;
            photoBox.appendChild(img);
            photoContainer.appendChild(photoBox);
        });
    }

    // wire close button after content update
    const closeBtn = document.getElementById('closeStatusModal');
    if (closeBtn) closeBtn.onclick = () => modal.classList.remove('active');

    modal.classList.add('active');
}

// --- Popup ลบรายการ ---
function showStatusDeletePopup(id) {
    statusDeleteTargetId = id;
    let popup = document.getElementById('deleteModal');
    if (!popup) return;
    popup.style.display = 'flex';
    popup.classList.add('active');
}

document.getElementById('confirmDelete').onclick = async () => {
    if(statusDeleteTargetId === null) return;
    try {
        const res = await fetch(`/api/reports/status/${statusDeleteTargetId}`, { method: 'DELETE' });
        if(!res.ok) throw new Error('ลบไม่สำเร็จ');
        statusDeleteTargetId = null;
        const deleteModal = document.getElementById('deleteModal');
        deleteModal.style.display = 'none';
        deleteModal.classList.remove('active');
        loadStatusReports();
    } catch(err) {
        console.error(err);
        alert('ไม่สามารถลบข้อมูลได้');
    }
};

document.getElementById('cancelDelete').onclick = () => {
    statusDeleteTargetId = null;
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('active');
};

// Share report function
async function shareStatusReport(reportId) {
    try {
        const response = await fetch(`/api/reports/share/${reportId}`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'}
        });

        if (!response.ok) {
            throw new Error('Failed to create share link');
        }

        const data = await response.json();
        const shareUrl = data.shareUrl;
        
        // Show share popup
        const shareModal = document.getElementById('shareModal');
        const shareUrlInput = document.getElementById('shareUrlInput');
        const copyShareBtn = document.getElementById('copyShareBtn');
        const closeShareBtn = document.getElementById('closeShareBtn');
        
        if (shareModal && shareUrlInput) {
            shareUrlInput.value = shareUrl;
            shareModal.style.display = 'flex';
            shareModal.classList.add('active');
            
            // Copy to clipboard
            navigator.clipboard.writeText(shareUrl).catch(() => {
                console.warn('Failed to copy to clipboard');
            });
            
            // Copy button handler
            if (copyShareBtn) {
                copyShareBtn.onclick = () => {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        copyShareBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => {
                            copyShareBtn.textContent = 'คัดลอกอีกครั้ง';
                        }, 2000);
                    }).catch(() => {
                        shareUrlInput.select();
                        document.execCommand('copy');
                        copyShareBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => {
                            copyShareBtn.textContent = 'คัดลอกอีกครั้ง';
                        }, 2000);
                    });
                };
            }
            
            // Close button handler
            if (closeShareBtn) {
                closeShareBtn.onclick = () => {
                    shareModal.style.display = 'none';
                    shareModal.classList.remove('active');
                };
            }
            
            // Close on overlay click
            shareModal.onclick = (e) => {
                if (e.target === shareModal) {
                    shareModal.style.display = 'none';
                    shareModal.classList.remove('active');
                }
            };
        }
    } catch(err){
        console.error('Error sharing report:', err);
        alert('เกิดข้อผิดพลาดในการแชร์ กรุณาลองใหม่');
    }
}
