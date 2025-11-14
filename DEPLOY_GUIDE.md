# คู่มือการ Deploy Web Application

## วิธีที่ 1: Render.com (แนะนำ - ใช้งานง่ายและมี Free Tier)

### ข้อดี:
- ✅ Free tier (พอใช้งาน)
- ✅ Persistent storage (ข้อมูลไม่หาย)
- ✅ Deploy ง่าย แค่เชื่อม GitHub
- ✅ Auto-deploy เมื่อ push code
- ✅ HTTPS อัตโนมัติ

### ขั้นตอน:

1. **Push โค้ดไป GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **ไปที่ [render.com](https://render.com) และ Sign up**

3. **สร้าง New Web Service**
   - คลิก "New +" → "Web Service"
   - เชื่อมต่อ GitHub repository
   - เลือก repository ของคุณ

4. **ตั้งค่า:**
   - **Name**: tp-repair-app (หรือชื่อที่ต้องการ)
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

5. **Environment Variables (ถ้าต้องการ):**
   - `NODE_ENV` = `production`
   - `PORT` = `10000` (Render จะ set ให้อัตโนมัติ)

6. **คลิก "Create Web Service"**
   - Render จะ deploy อัตโนมัติ
   - รอสักครู่ (ประมาณ 2-5 นาที)
   - จะได้ URL เช่น: `https://tp-repair-app.onrender.com`

7. **ใช้งาน:**
   - เปิด URL ที่ได้
   - ข้อมูลจะถูกเก็บในไฟล์ JSON บน server (persistent storage)

---

## วิธีที่ 2: Railway.app (ดีเหมือนกัน)

### ข้อดี:
- ✅ Free tier ($5 credit/เดือน)
- ✅ Persistent storage
- ✅ Deploy ง่าย

### ขั้นตอน:

1. **ไปที่ [railway.app](https://railway.app) และ Sign up**

2. **สร้าง New Project**
   - คลิก "New Project"
   - เลือก "Deploy from GitHub repo"
   - เลือก repository

3. **Railway จะ detect อัตโนมัติ**
   - จะเห็น "Deploy" button
   - คลิก Deploy

4. **ตั้งค่า:**
   - Railway จะสร้าง URL ให้อัตโนมัติ
   - ข้อมูลจะถูกเก็บใน persistent storage

---

## วิธีที่ 3: Fly.io (รองรับ Persistent Volumes)

### ข้อดี:
- ✅ Free tier (3 shared-cpu VMs)
- ✅ Persistent volumes
- ✅ เร็ว

### ขั้นตอน:

1. **ติดตั้ง Fly CLI:**
   ```bash
   # Windows (PowerShell)
   powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
   ```

2. **Login:**
   ```bash
   fly auth login
   ```

3. **สร้าง app:**
   ```bash
   fly launch
   ```

4. **สร้าง volume สำหรับข้อมูล:**
   ```bash
   fly volumes create data --size 1
   ```

5. **Deploy:**
   ```bash
   fly deploy
   ```

---

## วิธีที่ 4: ใช้ MongoDB Atlas (Free Database) + Netlify/Vercel

### ข้อดี:
- ✅ Database จริง (ข้อมูลไม่หาย)
- ✅ ใช้ Netlify/Vercel ได้ (frontend)
- ✅ MongoDB Atlas มี free tier

### ขั้นตอน:

1. **สร้าง MongoDB Atlas account:**
   - ไปที่ [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - สร้าง free cluster

2. **ได้ Connection String**

3. **แก้ไข server.js ให้ใช้ MongoDB แทนไฟล์**

4. **Deploy backend บน Render/Railway**

5. **Deploy frontend บน Netlify/Vercel**

---

## วิธีที่ 5: Supabase (All-in-one)

### ข้อดี:
- ✅ Database + Auth + Storage
- ✅ Free tier
- ✅ ใช้งานง่าย

### ขั้นตอน:

1. **ไปที่ [supabase.com](https://supabase.com)**

2. **สร้าง project**

3. **ใช้ Supabase Database แทนไฟล์ JSON**

---

## เปรียบเทียบ:

| Platform | Free Tier | Persistent Storage | ความยาก | แนะนำ |
|----------|-----------|-------------------|---------|-------|
| **Render** | ✅ | ✅ | ⭐ ง่าย | ⭐⭐⭐⭐⭐ |
| **Railway** | ✅ ($5/เดือน) | ✅ | ⭐ ง่าย | ⭐⭐⭐⭐⭐ |
| **Fly.io** | ✅ | ✅ (Volumes) | ⭐⭐ ปานกลาง | ⭐⭐⭐⭐ |
| **MongoDB + Netlify** | ✅ | ✅ (Database) | ⭐⭐⭐ ยาก | ⭐⭐⭐ |
| **Supabase** | ✅ | ✅ (Database) | ⭐⭐ ปานกลาง | ⭐⭐⭐⭐ |

---

## แนะนำ: ใช้ Render.com

**เหตุผล:**
- ง่ายที่สุด
- Free tier พอใช้งาน
- Persistent storage (ข้อมูลไม่หาย)
- Deploy เร็ว
- Auto-deploy

**ข้อจำกัด Free Tier:**
- อาจ sleep หลัง 15 นาทีไม่ใช้งาน (wake up ช้า ~30 วินาที)
- ถ้าต้องการไม่ sleep ต้อง upgrade ($7/เดือน)

---

## หมายเหตุ:

- ข้อมูลจะถูกเก็บในไฟล์ JSON บน server
- ข้อมูลจะไม่หาย (persistent storage)
- URL จะเป็น: `https://your-app-name.onrender.com`
- สามารถเปลี่ยน domain ได้ (ต้อง upgrade)

