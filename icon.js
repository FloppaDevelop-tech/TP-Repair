// ฟังก์ชันสำหรับการคลิกไอคอนเพื่อไปหน้า report
document.addEventListener('DOMContentLoaded', function() {
    const iconLink = document.getElementById('iconLink');
    const iconBox = document.getElementById('iconBox');
    
    // เพิ่ม event listener สำหรับการคลิก
    iconBox.addEventListener('click', function() {
        window.location.href = 'report.html';
    });
    
    // เพิ่ม event listener สำหรับการคลิกที่ลิงก์
    iconLink.addEventListener('click', function(e) {
        // ให้ลิงก์ทำงานตามปกติ
        window.location.href = 'report.html';
    });
});

