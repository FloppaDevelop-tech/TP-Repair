document.addEventListener("DOMContentLoaded", function() {
    const dateInput = document.querySelector('input[name="date"]');
    dateInput.valueAsDate = new Date();

    // --- Popup ---
    function showSuccessPopup() {
        const popup = document.getElementById("successPopup");
        popup.style.display = "flex";
    }
    function closePopup() {
        const popup = document.getElementById("successPopup");
        popup.style.display = "none";
    }
    window.closePopup = closePopup;

    function showWarningPopup(message) {
        const popup = document.getElementById("warningPopup");
        popup.querySelector("p").textContent = message;
        popup.style.display = "flex";
    }
    function closeWarningPopup() {
        const popup = document.getElementById("warningPopup");
        popup.style.display = "none";
    }
    window.closeWarningPopup = closeWarningPopup;

    // --- รูป preview ---
    let photoList = [];
    const photoInput = document.getElementById('photoInput');
    const previewContainer = document.getElementById('previewContainer');

    function renderPreview() {
        previewContainer.innerHTML = '';
        photoList.forEach((img, i) => {
            const div = document.createElement('div');
            div.className = 'preview-box';
            div.innerHTML = `
                <img src="${img}" alt="Preview">
                <button type="button" class="remove-image-btn">x</button>
            `;
            div.querySelector('button').addEventListener('click', () => {
                photoList.splice(i, 1);
                renderPreview();
            });
            previewContainer.appendChild(div);
        });
    }

    photoInput.addEventListener('change', function(e) {
        const files = [...e.target.files];
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = ev => {
                photoList.push(ev.target.result);
                renderPreview();
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });

    // --- Submit form ---
    const reportForm = document.getElementById('maintenanceForm');
    reportForm.addEventListener('submit', function(e){
        e.preventDefault();

        if(photoList.length === 0){
            showWarningPopup("กรุณาแนบภาพประกอบอย่างน้อย 1 รูป");
            return;
        }

        const newReport = {
            id: 'R'+Date.now().toString().slice(-4),
            name: reportForm.name.value,
            grade: reportForm.grade.value,
            date: reportForm.date.value,
            place: reportForm.place.value,
            detail: reportForm.detail.value,
            photos: photoList,
            status: "รอดำเนินการ",
            timestamp: new Date().toLocaleString("th-TH")
        };

        // save
        const reports = JSON.parse(localStorage.getItem('repairReports')) || [];
        reports.push(newReport);
        localStorage.setItem('repairReports', JSON.stringify(reports));

        const historyReports = JSON.parse(localStorage.getItem('repairReportsHistory')) || [];
        historyReports.push(newReport);
        localStorage.setItem('repairReportsHistory', JSON.stringify(historyReports));

        showSuccessPopup();

        // reset
        reportForm.reset();
        photoList = [];
        renderPreview();
        dateInput.valueAsDate = new Date();
    });
});
