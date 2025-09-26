# PWA: คลังสื่อเป็นชุด (Google Sheets + Drive)

เว็บแอพ PWA สำหรับอัพโหลด **ข้อความ / รูปภาพ / วิดีโอ** เป็น **ชุด (Set)**
แยกเป็นแต่ละชุด ไม่ปนกัน และมีปุ่ม **คัดลอกข้อความ/ลิงก์/ไฟล์** ใต้แต่ละรายการ

## ส่วนประกอบ
- Frontend: PWA (HTML/JS/CSS + Service Worker + Manifest)
- Backend: **Google Apps Script Web App** เชื่อม **Google Drive (จัดเก็บไฟล์)** และ **Google Sheets (เมทาดาทา)**

## ติดตั้ง Backend (Apps Script)
1. ไปที่ https://script.google.com/ แล้วสร้างโปรเจกต์ใหม่
2. สร้างชีท 1 ไฟล์ (ว่าง) และสร้างโฟลเดอร์ใน Google Drive 1 โฟลเดอร์ (ไว้เก็บไฟล์)
3. นำไฟล์ `apps-script/Code.gs` และ `apps-script/appsscript.json` ไปวางในโปรเจกต์ (แก้ค่าใน Script Properties ตามคอมเมนต์)
4. เมนู **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - กด Deploy แล้วคัดลอก URL (เช่น `https://script.google.com/macros/s/XXXX/exec`)

## ตั้งค่า Frontend
- เปิดไฟล์บนโฮสต์ใดๆ (เช่น Cloudflare Pages / GitHub Pages / localhost)
- เปิดหน้าเว็บ → แท็บ **ตั้งค่า** ใส่ค่า:
  - **Apps Script Web App URL**
  - **Drive Folder ID** (จากโฟลเดอร์ที่สร้าง)
  - **Sheet ID** (จากไฟล์ชีทที่สร้าง)
- เริ่มใช้งานได้ทันที

## หมายเหตุการคัดลอก "ไฟล์"
เบราว์เซอร์บางตัวไม่รองรับการใส่ **Blob ลงคลิปบอร์ด** โดยตรง (ต้องใช้ HTTPS และสิทธิพิเศษ)
โค้ดนี้จึงมี fallback เป็นการคัดลอก **ลิงก์** แทน

---

สร้างโดย ChatGPT — พร้อมใช้งานและแก้ไขต่อได้ตามต้องการ
