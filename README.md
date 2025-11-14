# TP-Maintenance - ระบบแจ้งซ่อม

ระบบแจ้งซ่อมสำหรับโรงเรียน/องค์กร พัฒนาด้วย Node.js, Express และ Vanilla JavaScript

## ✨ คุณสมบัติ

- 📝 **แจ้งซ่อม** - กรอกข้อมูลและแนบภาพประกอบ
- 📊 **สถานะการซ่อม** - ติดตามสถานะรายการแจ้งซ่อม
- 📜 **ประวัติการแจ้งซ่อม** - ดูประวัติรายการที่ผ่านมา
- 🔗 **แชร์รายงาน** - แชร์รายงานผ่านลิงก์ที่ไม่ซ้ำกัน (อายุ 7 วัน)
- 👨‍💼 **Admin Panel** - จัดการรายการแจ้งซ่อม
- 📱 **Responsive Design** - รองรับทุกขนาดหน้าจอ

## 🚀 การติดตั้ง

### ความต้องการของระบบ

- Node.js (v14 หรือสูงกว่า)
- npm หรือ yarn

### ขั้นตอนการติดตั้ง

1. Clone repository
```bash
git clone <repository-url>
cd App-TP-Repair
```

2. ติดตั้ง dependencies
```bash
npm install
```

3. เริ่มต้นเซิร์ฟเวอร์
```bash
node server.js
```

4. เปิดเบราว์เซอร์ไปที่
```
http://localhost:3000
```

## 📁 โครงสร้างโปรเจกต์

```
App-TP-Repair/
├── server.js              # Express server
├── package.json           # Dependencies
├── icon.html              # หน้าเริ่มต้น
├── report.html             # หน้าแจ้งซ่อม
├── status.html             # หน้าสถานะการซ่อม
├── history.html            # หน้าประวัติ
├── admin.html              # Admin Panel
├── share.html              # หน้ารายงานที่แชร์
├── *.js                    # JavaScript files
├── *.css                   # Stylesheets
└── *.json                  # Data files (auto-generated)
```

## 🎨 หน้าจอหลัก

- **icon.html** - หน้าเริ่มต้นของแอปพลิเคชัน

## 📝 การใช้งาน

### สำหรับผู้ใช้ทั่วไป

1. เปิดหน้า **icon.html** เพื่อเริ่มต้น
2. คลิกที่ไอคอน "แจ้งซ่อม" เพื่อเข้าสู่หน้าแจ้งซ่อม
3. กรอกข้อมูลและแนบภาพประกอบ
4. ตรวจสอบสถานะได้ที่หน้า "สถานะการซ่อม"
5. ดูประวัติได้ที่หน้า "ประวัติการแจ้งซ่อม"

### สำหรับ Admin

1. เข้าสู่หน้า "Admin Panel"
2. ดูรายการแจ้งซ่อมทั้งหมด
3. เปลี่ยนสถานะรายการ (รอดำเนินการ, กำลังดำเนินการ, เสร็จสิ้น)
4. ลบรายการที่ไม่ต้องการ

### การแชร์รายงาน

1. คลิกปุ่ม "แชร์" ในรายการที่ต้องการ
2. ลิงก์จะถูกคัดลอกอัตโนมัติ
3. แชร์ลิงก์ให้ผู้อื่นได้
4. ลิงก์มีอายุ 7 วัน

## 🛠️ เทคโนโลยีที่ใช้

- **Backend**: Node.js, Express
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Storage**: JSON files
- **Font**: Prompt (Google Fonts)

## 📦 Dependencies

- express
- cors
- body-parser

## 🔒 ข้อมูล

ข้อมูลทั้งหมดเก็บในไฟล์ JSON:
- `status.json` - รายการที่รอดำเนินการ
- `admin.json` - รายการทั้งหมด (สำหรับ Admin)
- `history.json` - ประวัติรายการ
- `shared-reports.json` - รายการที่แชร์

## 📄 License

MIT License

## 👥 ผู้พัฒนา

TP-Maintenance Team

---

**Version**: 1.0  
**Last Updated**: 2024

