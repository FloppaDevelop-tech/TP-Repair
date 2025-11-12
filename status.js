document.addEventListener('DOMContentLoaded', () => {
    loadStatusReports();
});

// โหลดข้อมูล Status
function loadStatusReports() {
    const container = document.getElementById('report-cards');
    if (!container) return;

    let reports = JSON.parse(localStorage.getItem('repairReports')) || [];
    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = '<p>ยังไม่มีรายการแจ้งซ่อม</p>';
        return;
    }

    reports.reverse().forEach(report => {
        const card = document.createElement('div');
        card.className = 'report-card';

        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `
            <p><strong>รหัส:</strong> ${report.id}</p>
            <h3>${report.name}</h3>
            <p>กลุ่มสาระ: ${report.grade}</p>
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

        const delBtn = document.createElement('button');
        delBtn.className = 'delete-btn';
        delBtn.textContent = 'ลบ';
        delBtn.onclick = () => showStatusDeletePopup(report.id);

        btns.append(detailBtn, delBtn);
        card.append(info, btns);
        container.appendChild(card);
    });
}

function statusClass(status) {
    if (status === 'รอดำเนินการ') return 'status-pending';
    if (status === 'กำลังดำเนินการ') return 'status-inprogress';
    if (status === 'เสร็จสิ้น') return 'status-completed';
    return '';
}

// === POPUP รายละเอียด Status ===
function showStatusDetail(report) {
    let modal = document.getElementById('statusDetailModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'statusDetailModal';
        modal.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.5);display:flex;
            justify-content:center;align-items:center;z-index:1000;
        `;
        modal.innerHTML = `
            <div style="background:white;padding:20px;border-radius:10px;
                        max-width:600px;width:90%;max-height:80%;overflow-y:auto;">
                <h2></h2>
                <p><strong>รหัส:</strong> </p>
                <p><strong>วันที่:</strong> </p>
                <p><strong>สถานที่:</strong> </p>
                <p><strong>รายละเอียด:</strong> </p>
                <div id="statusPhotoContainer" style="display:flex;flex-wrap:wrap;gap:10px;margin-top:10px;"></div>
                <button id="closeStatusModal" style="margin-top:15px;
                        padding:8px 16px;background:#007a3d;color:white;
                        border:none;border-radius:6px;cursor:pointer;">ปิด</button>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('closeStatusModal').onclick = () => modal.style.display = 'none';
    }

    const content = modal.querySelector('div');
    modal.querySelector('h2').textContent = `${report.name} (${report.grade})`;
    modal.querySelector('p:nth-of-type(1)').innerHTML = `<strong>รหัส:</strong> ${report.id}`;
    modal.querySelector('p:nth-of-type(2)').innerHTML = `<strong>วันที่:</strong> ${report.date}`;
    modal.querySelector('p:nth-of-type(3)').innerHTML = `<strong>สถานที่:</strong> ${report.place}`;
    modal.querySelector('p:nth-of-type(4)').innerHTML = `<strong>รายละเอียด:</strong> ${report.detail}`;

    const photoContainer = modal.querySelector('#statusPhotoContainer');
    photoContainer.innerHTML = '';
    if (report.photos && report.photos.length > 0) {
        report.photos.forEach(src => {
            const imgCard = document.createElement('div');
            imgCard.style.cssText = 'flex:0 0 45%;border:1px solid #ccc;padding:5px;border-radius:5px;';
            const img = document.createElement('img');
            img.src = src;
            img.style.width = '100%';
            img.style.height = 'auto';
            img.style.display = 'block';
            imgCard.appendChild(img);
            photoContainer.appendChild(imgCard);
        });
    }

    modal.style.display = 'flex';
}

// === POPUP ลบ Status ===
let statusDeleteTargetId = null;
function showStatusDeletePopup(id) {
    statusDeleteTargetId = id;
    let popup = document.getElementById('statusDeleteModal');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'statusDeleteModal';
        popup.style.cssText = `
            position:fixed;top:0;left:0;width:100%;height:100%;
            background:rgba(0,0,0,0.4);display:flex;
            justify-content:center;align-items:center;z-index:1001;
        `;
        popup.innerHTML = `
            <div style="background:#fff;padding:25px;width:320px;
                        text-align:center;border-radius:12px;box-shadow:0 10px 25px rgba(0,0,0,0.15);">
                <h3>ยืนยันการลบ</h3>
                <p>คุณต้องการลบรายการนี้หรือไม่?</p>
                <button id="confirmStatusDelete" style="margin:10px 5px;
                        padding:8px 18px;background:#dc3545;color:white;
                        border:none;border-radius:6px;cursor:pointer;">ลบ</button>
                <button id="cancelStatusDelete" style="margin:10px 5px;
                        padding:8px 18px;background:#6c757d;color:white;
                        border:none;border-radius:6px;cursor:pointer;">ยกเลิก</button>
            </div>
        `;
        document.body.appendChild(popup);

        document.getElementById('confirmStatusDelete').onclick = () => {
            if (statusDeleteTargetId === null) return;
            let reports = JSON.parse(localStorage.getItem('repairReports')) || [];
            reports = reports.filter(r => r.id !== statusDeleteTargetId);
            localStorage.setItem('repairReports', JSON.stringify(reports));
            statusDeleteTargetId = null;
            popup.style.display = 'none';
            loadStatusReports();
        };

        document.getElementById('cancelStatusDelete').onclick = () => {
            statusDeleteTargetId = null;
            popup.style.display = 'none';
        };
    }
    popup.style.display = 'flex';
}
