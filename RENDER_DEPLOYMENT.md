# 🚀 دليل النشر على Render

## خطوات النشر:

### 1️⃣ إعداد المشروع على Render

1. اذهب إلى [Render.com](https://render.com)
2. اضغط على **New +** → **Web Service**
3. اختر **Connect GitHub** وحدد المستودع: `fikrimamdouh/rinapro-whatsapp-agent`

### 2️⃣ إعدادات Web Service

#### Basic Settings:
- **Name**: `rinapro-whatsapp-agent`
- **Region**: Oregon (US West)
- **Branch**: `main`
- **Root Directory**: (اتركه فارغاً)

#### Build & Deploy:
- **Runtime**: `Node`
- **Build Command**: 
  ```bash
  npm install && npm run build
  ```
- **Start Command**: 
  ```bash
  npm start
  ```

### 3️⃣ Environment Variables (متغيرات البيئة)

أضف المتغيرات التالية في **Environment** tab:

#### مطلوبة:
```
NODE_ENV=production
PORT=10000
```

#### اختيارية (لكن موصى بها):
```
OPENAI_API_KEY=your-openai-api-key-here
DATABASE_URL=your-mysql-connection-string
OAUTH_SERVER_URL=your-oauth-server-url
MANAGER_PHONE=966500000000
```

### 4️⃣ Advanced Settings

#### Health Check:
- **Health Check Path**: `/`

#### Auto-Deploy:
- ✅ Enable Auto-Deploy from GitHub

### 5️⃣ إنشاء الخدمة

اضغط على **Create Web Service** وانتظر حتى يكتمل البناء (Build).

---

## 🔍 استكشاف الأخطاء

### المشكلة: Build Failed

#### الحل 1: تحقق من Logs
```
1. اذهب إلى Dashboard → Your Service
2. اضغط على "Logs" tab
3. ابحث عن الأخطاء في Build logs
```

#### الحل 2: تحقق من package.json
تأكد من وجود:
```json
{
  "scripts": {
    "build": "vite build && tsc --project tsconfig.server.json",
    "start": "node dist/server/_core/index.js"
  }
}
```

### المشكلة: Application Crashed

#### الحل 1: تحقق من Environment Variables
- تأكد من إضافة `NODE_ENV=production`
- تأكد من إضافة `PORT=10000`

#### الحل 2: تحقق من Runtime Logs
```
1. اذهب إلى "Logs" tab
2. ابحث عن Runtime errors
3. تحقق من أن SQLite يعمل (إذا لم تضف DATABASE_URL)
```

### المشكلة: WhatsApp لا يعمل

#### السبب:
WhatsApp Baileys يحتاج إلى:
1. Persistent storage (غير متوفر في Free tier)
2. QR Code scanning (يحتاج واجهة)

#### الحل:
استخدم **WhatsApp Business API** بدلاً من Baileys:
1. سجل في [WhatsApp Business API](https://business.whatsapp.com)
2. احصل على API credentials
3. حدث الكود لاستخدام Business API

---

## 📝 ملاحظات مهمة

### Free Tier Limitations:
- ⚠️ الخدمة تتوقف بعد 15 دقيقة من عدم النشاط
- ⚠️ 750 ساعة مجانية شهرياً
- ⚠️ لا يوجد persistent disk (SQLite سيُعاد تهيئته عند كل restart)

### للإنتاج الفعلي:
1. ✅ استخدم **Paid Plan** ($7/month) للحصول على:
   - Persistent disk
   - No sleep
   - More resources

2. ✅ استخدم **PostgreSQL** أو **MySQL** database:
   - أضف Database service في Render
   - أو استخدم خدمة خارجية (PlanetScale, Supabase)

3. ✅ استخدم **WhatsApp Business API**:
   - أكثر استقراراً
   - مدعوم رسمياً
   - لا يحتاج QR scanning

---

## 🔗 روابط مفيدة

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Troubleshooting](https://render.com/docs/troubleshooting-deploys)

---

## ✅ التحقق من النشر

بعد النشر الناجح:

1. افتح الرابط: `https://your-app-name.onrender.com`
2. يجب أن ترى الصفحة الرئيسية
3. جرب الصفحات:
   - `/customers` - العملاء
   - `/logistics` - اللوجستيات
   - `/maintenance` - الصيانة
   - `/reports` - التقارير
   - `/finance` - المالية
   - `/installments` - الأقساط والسندات

---

## 🆘 الدعم

إذا واجهت مشاكل:
1. تحقق من Logs في Render Dashboard
2. تأكد من جميع Environment Variables
3. تحقق من أن Build نجح
4. جرب إعادة Deploy

**ملاحظة**: WhatsApp سيحتاج إعداد إضافي للعمل على Render!
