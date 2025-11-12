document.addEventListener('DOMContentLoaded', () => {
    loadHistoryReports();
});

let deleteTargetId = null;

function loadHistoryReports() {
    const container = document.getElementById('history-cards');
    const deleteAllBtn = document.getElementById('deleteAllBtn');
    if(!container) return;

    let reports = JSON.parse(localStorage.getItem('repairReportsHistory')) || [];
    container.innerHTML = '';

    if(reports.length === 0){
        container.innerHTML = '<p>ยังไม่มีประวัติการแจ้งซ่อม</p>';
        return;
    }

    reports.reverse().forEach(report => {
        const card = document.createElement('div');
        card.className = 'report-card';

        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `
            <h3>${report.name} (${report.id})</h3>
            <p>กลุ่มสาระ: ${report.grade}</p>
            <p>วันที่: ${report.date}</p>
            <p>สถานที่: ${report.place}</p>
            <p>รายละเอียด: ${report.detail.substring(0,50)}...</p>
        `;

        const btns = document.createElement('div');
        btns.className = 'card-buttons';

        const detailBtn = document.createElement('button');
        detailBtn.className = 'details-btn';
        detailBtn.textContent = 'รายละเอียด';
        detailBtn.onclick = () => showReportDetail(report);

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => showDeletePopup(report.id);

        btns.append(detailBtn, delBtn);
        card.append(info, btns);
        container.appendChild(card);
    });

    // ปุ่มลบทั้งหมด
    if(deleteAllBtn){
        deleteAllBtn.onclick = () => {
            document.getElementById('deleteAllPopup').style.display = 'flex';
        };
    }
}

// Popup รายละเอียด
function showReportDetail(report){
    const modal = document.getElementById('reportDetailModal');
    const content = modal.querySelector('.modal-content');

    content.innerHTML = `
        <h2>${report.name} (${report.grade})</h2>
        <p><strong>รหัส:</strong> ${report.id}</p>
        <p><strong>วันที่:</strong> ${report.date}</p>
        <p><strong>สถานที่:</strong> ${report.place}</p>
        <p><strong>รายละเอียด:</strong> ${report.detail}</p>
        <div class="modal-photos"></div>
        <button id="closeModal">ปิด</button>
    `;

    const photosContainer = content.querySelector('.modal-photos');
    if(report.photos && report.photos.length){
        report.photos.forEach(src => {
            const img = document.createElement('img');
            img.src = src;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.margin = '5px';
            img.style.borderRadius = '5px';
            photosContainer.appendChild(img);
        });
    }

    modal.style.display = 'flex';
    document.getElementById('closeModal').onclick = () => modal.style.display='none';
}

// Popup ลบ
function showDeletePopup(id){
    deleteTargetId = id;
    document.getElementById('deleteModal').style.display = 'flex';
}

document.getElementById('confirmDelete').onclick = () => {
    if(deleteTargetId === null) return;
    let reports = JSON.parse(localStorage.getItem('repairReportsHistory')) || [];
    reports = reports.filter(r => r.id !== deleteTargetId);
    localStorage.setItem('repairReportsHistory', JSON.stringify(reports));
    deleteTargetId = null;
    document.getElementById('deleteModal').style.display = 'none';
    loadHistoryReports();
};

document.getElementById('cancelDelete').onclick = () => {
    deleteTargetId = null;
    document.getElementById('deleteModal').style.display = 'none';
};

// Popup ลบทั้งหมด (Status style)
document.getElementById('confirmDeleteAll').onclick = () => {
    localStorage.removeItem('repairReportsHistory');
    loadHistoryReports();
    document.getElementById('deleteAllPopup').style.display = 'none';
};

document.getElementById('cancelDeleteAll').onclick = () => {
    document.getElementById('deleteAllPopup').style.display = 'none';
};
