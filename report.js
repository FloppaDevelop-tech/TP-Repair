document.addEventListener("DOMContentLoaded", function() {
    console.log("Script loaded!"); // Debug: ตรวจสอบว่า script โหลดแล้ว
    
    const dateInput = document.querySelector('input[name="date"]');
    const reportForm = document.getElementById('maintenanceForm');
    
    // ตรวจสอบว่าเจอ element หรือไม่
    if (!reportForm) {
        console.error("ไม่พบ form!");
        return;
    }
    
    console.log("Form found!"); // Debug: เจอ form แล้ว
    
    dateInput.valueAsDate = new Date();
    
    // --- Popup Functions ---
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
    
    // --- Photo Preview ---
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
        console.log("Photos selected:", e.target.files.length); // Debug: จำนวนรูปที่เลือก
        const files = [...e.target.files];
        files.forEach(file => {
            if (!file.type.startsWith('image/')) return;
            const reader = new FileReader();
            reader.onload = ev => {
                photoList.push(ev.target.result);
                renderPreview();
                console.log("Total photos:", photoList.length); // Debug: จำนวนรูปทั้งหมด
            };
            reader.readAsDataURL(file);
        });
        e.target.value = '';
    });
    
    // --- Submit Form ---
    reportForm.addEventListener('submit', function(e){
        e.preventDefault();
        console.log("Form submitted!"); // Debug: ฟอร์มถูกส่ง
        console.log("Photos in list:", photoList.length); // Debug: จำนวนรูปก่อนส่ง
        
        // ตรวจสอบว่ามีรูปหรือไม่
        if(photoList.length === 0){
            console.log("No photos, showing warning"); // Debug
            showWarningPopup("กรุณาแนบภาพประกอบอย่างน้อย 1 รูป");
            return;
        }
        
        console.log("Creating report..."); // Debug: กำลังสร้างรายงาน
        
        // สร้างข้อมูลรายงาน
        const newReport = {
            id: 'R' + Date.now().toString().slice(-4),
            name: reportForm.name.value,
            grade: reportForm.grade.value,
            date: reportForm.date.value,
            place: reportForm.place.value,
            detail: reportForm.detail.value,
            photos: photoList,
            status: "รอดำเนินการ",
            timestamp: new Date().toLocaleString("th-TH")
        };
        
        console.log("New report created:", newReport); // Debug: แสดงข้อมูลรายงานใหม่
        
        try {
            // บันทึกลง localStorage
            const reports = JSON.parse(localStorage.getItem('repairReports')) || [];
            reports.push(newReport);
            localStorage.setItem('repairReports', JSON.stringify(reports));
            console.log("Saved to repairReports"); // Debug
            
            const historyReports = JSON.parse(localStorage.getItem('repairReportsHistory')) || [];
            historyReports.push(newReport);
            localStorage.setItem('repairReportsHistory', JSON.stringify(historyReports));
            console.log("Saved to repairReportsHistory"); // Debug
            
            // แสดง popup สำเร็จ
            showSuccessPopup();
            console.log("Success popup shown"); // Debug
            
            // รีเซ็ตฟอร์ม
            reportForm.reset();
            photoList = [];
            renderPreview();
            dateInput.valueAsDate = new Date();
            console.log("Form reset complete"); // Debug
            
        } catch (error) {
            console.error("Error saving report:", error); // Debug: แสดง error ถ้ามี
            showWarningPopup("เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง");
        }
    });
    
    console.log("Event listener attached to form"); // Debug: ยืนยันว่าติด event listener แล้ว
});
