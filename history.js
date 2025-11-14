document.addEventListener('DOMContentLoaded', () => {
    loadHistoryReports();

    // --- Delete all buttons ---
    const confirmDeleteAllBtn = document.getElementById('confirmDeleteAll');
    const cancelDeleteAllBtn = document.getElementById('cancelDeleteAll');

    const API_BASE = 'https://tp-repair.vercel.app/api/reports';

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

    const API_BASE = 'https://tp-repair.vercel.app/api/reports';

    try {
        const res = await fetch(`${API_BASE}/history`);
        if (!res.ok) throw new Error('Failed to fetch history');
        const reports = await res.json();

        if (reports.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; padding:40px;">ยังไม่มีประวัติการแจ้งซ่อม</p>';
            return;
        }

        reports.reverse().forEach(report => {
            const card = document.createElement('div');
            card.className = 'report-card';

            const info = document.createElement('div');
            info.className = 'card-info';
            info.innerHTML = `
                <h3>${report.name} (${report.grade || '-'})</h3>
                <p><strong>รหัส:</strong> ${report.id}</p>
                <p>วันที่: ${report.timestamp || report.date}</p>
                <p>สถานที่: ${report.place || '-'}</p>
            `;

            const btns = document.createElement('div');
            btns.className = 'card-buttons';

            const detailBtn = document.createElement('button');
            detailBtn.className = 'details-btn';
            detailBtn.textContent = 'รายละเอียด';
            detailBtn.onclick = () => showReportDetail(report);

            const shareBtn = document.createElement('button');
            shareBtn.className = 'share-btn';
            shareBtn.textContent = 'แชร์';
            shareBtn.onclick = () => shareHistoryReport(report.id);

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-btn';
            delBtn.textContent = 'ลบ';
            delBtn.onclick = () => showDeletePopup(report.id);

            btns.append(detailBtn, shareBtn, delBtn);
            card.append(info, btns);
            container.appendChild(card);
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

// --- Detail popup ---
function showReportDetail(report){
    const modal = document.getElementById('reportDetailModal');
    const content = modal.querySelector('.detail-popup-content');

    const safe = v => (v === undefined || v === null || v === '') ? '-' : v;
    const escapeHtml = input => input ? String(input)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;') : '';

    content.innerHTML = `
        <h2>${escapeHtml(safe(report.name))} (${escapeHtml(safe(report.grade))})</h2>
        <p><strong>รหัส:</strong> ${escapeHtml(safe(report.id))}</p>
        <p><strong>วันที่:</strong> ${escapeHtml(safe(report.timestamp || report.date))}</p>
        <p><strong>สถานที่:</strong> ${escapeHtml(safe(report.place))}</p>
        <p><strong>รายละเอียด:</strong> ${escapeHtml(safe(report.detail))}</p>
        <div class="detail-popup-photos"></div>
        <button id="closeModal" class="close-detail">ปิด</button>
    `;

    const photosContainer = content.querySelector('.detail-popup-photos');
    photosContainer.innerHTML = '';
    if(report.photos && report.photos.length){
        report.photos.forEach(src => {
            const photoBox = document.createElement('div');
            photoBox.className = 'photo-box';
            const img = document.createElement('img');
            img.src = src;
            photoBox.appendChild(img);
            photosContainer.appendChild(photoBox);
        });
    }

    modal.classList.add('active');
    document.getElementById('closeModal').onclick = () => modal.classList.remove('active');
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
        const API_BASE = 'https://tp-repair.vercel.app/api/reports';
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
async function shareHistoryReport(reportId) {
    try {
        const API_BASE = 'https://tp-repair.vercel.app/api/reports';
        const response = await fetch(`${API_BASE}/history/${reportId}/share`, {
            method: 'POST',
            headers: {'Content-Type':'application/json'}
        });

        if (!response.ok) throw new Error('Failed to create share link');
        const data = await response.json();
        const shareUrl = data.shareUrl;

        const shareModal = document.getElementById('shareModal');
        const shareUrlInput = document.getElementById('shareUrlInput');
        const copyShareBtn = document.getElementById('copyShareBtn');
        const closeShareBtn = document.getElementById('closeShareBtn');

        if (shareModal && shareUrlInput) {
            shareUrlInput.value = shareUrl;
            shareModal.style.display = 'flex';
            shareModal.classList.add('active');

            navigator.clipboard.writeText(shareUrl).catch(()=>{});

            if(copyShareBtn){
                copyShareBtn.onclick = () => {
                    navigator.clipboard.writeText(shareUrl).then(() => {
                        copyShareBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => copyShareBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
                    }).catch(() => {
                        shareUrlInput.select();
                        document.execCommand('copy');
                        copyShareBtn.textContent = 'คัดลอกแล้ว!';
                        setTimeout(() => copyShareBtn.textContent = 'คัดลอกอีกครั้ง', 2000);
                    });
                };
            }

            if(closeShareBtn){
                closeShareBtn.onclick = () => {
                    shareModal.style.display = 'none';
                    shareModal.classList.remove('active');
                };
            }

            shareModal.onclick = (e) => {
                if(e.target === shareModal){
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
