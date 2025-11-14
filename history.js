document.addEventListener('DOMContentLoaded', () => {
    loadHistoryReports();

    // --- Delete all buttons ---
    const confirmDeleteAllBtn = document.getElementById('confirmDeleteAll');
    const cancelDeleteAllBtn = document.getElementById('cancelDeleteAll');

    const API_BASE = window.location.origin + '/api/reports';

    if (confirmDeleteAllBtn) {
        confirmDeleteAllBtn.onclick = async () => {
            try {
                const res = await fetch(`${API_BASE}/history`);
                if (!res.ok) throw new Error('Failed to fetch history');
                const reports = await res.json();

                for (const report of reports) {
                    await fetch(`${API_BASE}/history/${report.id}`, { method: 'DELETE' });
                }

                const deleteAllPopup = document.getElementById('deleteAllPopup');
                deleteAllPopup.style.display = 'none';
                deleteAllPopup.classList.remove('active');
                loadHistoryReports();
            } catch(err) {
                console.error('Error deleting all:', err);
                alert('ไม่สามารถลบข้อมูลทั้งหมดได้');
            }
        };
    }

    if (cancelDeleteAllBtn) {
        cancelDeleteAllBtn.onclick = () => {
            const deleteAllPopup = document.getElementById('deleteAllPopup');
            deleteAllPopup.style.display = 'none';
            deleteAllPopup.classList.remove('active');
        };
    }
});

let deleteTargetId = null;

// --- Load history reports ---
async function loadHistoryReports() {
    const container = document.getElementById('history-cards');
    if (!container) return;

    const API_BASE = window.location.origin + '/api/reports';

    try {
        const res = await fetch(`${API_BASE}/history`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const reports = await res.json();

        if (reports.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">ยังไม่มีประวัติการแจ้งซ่อม</p>';
            return;
        }

        // แสดงรายการล่าสุดก่อน
        reports.reverse().forEach(report => {
            const card = document.createElement('div');
            card.className = 'report-card';
            card.innerHTML = `
                <div class="card-info">
                    <h3>${report.name} (${report.grade || ''})</h3>
                    <p><strong>รหัส:</strong> ${report.id}</p>
                    <p>วันที่: ${report.date || report.timestamp}</p>
                    <p>สถานที่: ${report.place || '-'}</p>
                    <p>สถานะ: <span class="${statusClass(report.status)}">${report.status || 'รอดำเนินการ'}</span></p>
                </div>
                <div class="card-buttons">
                    <button type="button" class="details-btn">รายละเอียด</button>
                    <button type="button" class="share-btn">แชร์</button>
                    <button type="button" class="delete-btn">ลบ</button>
                </div>`;
            container.appendChild(card);

            const [detailBtn, shareBtn, delBtn] = card.querySelectorAll('button');
            detailBtn.addEventListener('click', e => { e.preventDefault(); showDetail(report); });
            shareBtn.addEventListener('click', e => { e.preventDefault(); shareReport(report.id); });
            delBtn.addEventListener('click', e => { e.preventDefault(); showDeletePopup(report.id); });
        });

        // ปุ่มลบทั้งหมด
        const deleteAllBtn = document.getElementById('deleteAllBtn');
        if(deleteAllBtn){
            deleteAllBtn.onclick = () => {
                const deleteAllPopup = document.getElementById('deleteAllPopup');
                deleteAllPopup.style.display = 'flex';
                deleteAllPopup.classList.add('active');
            };
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = `<p>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
}

// --- Helper: Status CSS ---
function statusClass(s) {
    if (s === 'รอดำเนินการ') return 'status-pending';
    if (s === 'กำลังดำเนินการ') return 'status-inprogress';
    if (s === 'เสร็จสิ้น') return 'status-completed';
    return 'status-pending';
}

// --- Detail popup ---
function showDetail(report) {
    const modal = document.getElementById('reportDetailModal');
    const content = modal.querySelector('.detail-popup-content');
    
    if (!modal || !content) return;
    
    // Status badge
    let statusClassValue = 'status-pending';
    if (report.status === 'กำลังดำเนินการ') statusClassValue = 'status-inprogress';
    if (report.status === 'เสร็จสิ้น') statusClassValue = 'status-completed';
    
    // Photos
    let photosHtml = '';
    if (report.photos && report.photos.length > 0) {
        photosHtml = `
            <div class="detail-popup-photos">
                ${report.photos.map((p, i) => `<img src="${p}" alt="ภาพที่ ${i + 1}" onclick="openImageModal('${p}')">`).join('')}
            </div>
        `;
    } else {
        photosHtml = '<p style="color: #999; text-align: center; padding: 20px;">ไม่มีภาพประกอบ</p>';
    }
    
    content.innerHTML = `
        <button class="close-detail" onclick="closeDetailModal()">×</button>
        <h2>${report.name} (${report.grade || '-'})</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
                <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">รหัส</strong>
                <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.id}</p>
            </div>
            <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
                <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">สถานะ</strong>
                <p style="margin: 5px 0 0 0;"><span class="${statusClassValue}">${report.status || 'รอดำเนินการ'}</span></p>
            </div>
            <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
                <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">วันที่</strong>
                <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.date || report.timestamp || '-'}</p>
            </div>
            <div style="background: #f5f9f7; padding: 12px; border-radius: 6px; border-left: 3px solid #2d7a3e;">
                <strong style="color: #2d7a3e; font-size: 0.85rem; text-transform: uppercase;">สถานที่</strong>
                <p style="margin: 5px 0 0 0; color: #333; font-size: 1rem;">${report.place || '-'}</p>
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <strong style="color: #2d7a3e; font-size: 0.9rem; text-transform: uppercase; display: block; margin-bottom: 8px;">รายละเอียดปัญหา</strong>
            <div style="background: #f5f9f7; padding: 15px; border-radius: 6px; color: #333; line-height: 1.6; white-space: pre-wrap;">${report.detail || '-'}</div>
        </div>
        <div>
            <strong style="color: #2d7a3e; font-size: 0.9rem; text-transform: uppercase; display: block; margin-bottom: 8px;">ภาพประกอบ</strong>
            ${photosHtml}
        </div>
    `;
    
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function closeDetailModal() {
    const modal = document.getElementById('reportDetailModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Close detail modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('reportDetailModal');
    if (modal && e.target === modal) {
        closeDetailModal();
    }
});

// Image modal
function openImageModal(src) {
    const modal = document.createElement('div');
    modal.className = 'image-modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.9); z-index: 10000; display: flex; align-items: center; justify-content: center; cursor: pointer;';
    modal.innerHTML = `
        <img src="${src}" style="max-width: 90%; max-height: 90%; object-fit: contain; border-radius: 8px;">
        <button onclick="this.parentElement.remove()" style="position: absolute; top: 20px; right: 20px; background: #fff; border: none; width: 40px; height: 40px; border-radius: 50%; font-size: 24px; cursor: pointer; color: #2d7a3e; font-weight: bold;">×</button>
    `;
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    document.body.appendChild(modal);
}

// --- Delete popup ---
function showDeletePopup(id){
    deleteTargetId = id;
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'flex';
    deleteModal.classList.add('active');
}

document.getElementById('confirmDelete').onclick = async () => {
    if(deleteTargetId === null) return;
    try {
        const API_BASE = window.location.origin + '/api/reports';
        await fetch(`${API_BASE}/history/${deleteTargetId}`, { method: 'DELETE' });
        deleteTargetId = null;
        const deleteModal = document.getElementById('deleteModal');
        deleteModal.style.display = 'none';
        deleteModal.classList.remove('active');
        loadHistoryReports();
    } catch(err) {
        console.error(err);
        alert('ไม่สามารถลบข้อมูลได้');
    }
};

document.getElementById('cancelDelete').onclick = () => {
    deleteTargetId = null;
    const deleteModal = document.getElementById('deleteModal');
    deleteModal.style.display = 'none';
    deleteModal.classList.remove('active');
};

// --- Share report ---
function shareReport(id) {
    const url = `${window.location.origin}/share.html?id=${id}`;
    const modal = document.getElementById('shareModal');
    const urlInput = document.getElementById('shareUrlInput');
    const copyBtn = document.getElementById('copyShareBtn');
    const openBtn = document.getElementById('openShareBtn');
    
    if (!modal || !urlInput) return;
    
    urlInput.value = url;
    modal.style.display = 'flex';
    modal.classList.add('active');
    
    // Copy to clipboard
    navigator.clipboard.writeText(url).catch(() => {});
    
    // Copy button
    if (copyBtn) {
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(url).then(() => {
                copyBtn.textContent = 'คัดลอกแล้ว!';
                setTimeout(() => copyBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
            }).catch(() => {
                urlInput.select();
                document.execCommand('copy');
                copyBtn.textContent = 'คัดลอกแล้ว!';
                setTimeout(() => copyBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
            });
        };
    }
    
    // Open button
    if (openBtn) {
        openBtn.onclick = () => {
            window.open(url, '_blank');
        };
    }
}

function closeShareModal() {
    const modal = document.getElementById('shareModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
    }
}

// Close share modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('shareModal');
    if (modal && e.target === modal) {
        closeShareModal();
    }
});
