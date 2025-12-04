# 🚀 دليل نشر التطبيق على DigitalOcean

## 📋 معلومات السيرفر:
```
IP Address: 209.38.33.72
Username: root
Password: [الباسورد اللي كتبته]
```

---

## 🔧 خطوات الإعداد:

### 1️⃣ الاتصال بالسيرفر

**من Windows:**
1. حمّل PuTTY: https://www.putty.org/
2. افتح PuTTY
3. في Host Name اكتب: `209.38.33.72`
4. اضغط Open
5. اكتب username: `root`
6. اكتب الباسورد (مش هيظهر وأنت بتكتب - عادي)

**من Mac/Linux:**
```bash
ssh root@209.38.33.72
```

---

### 2️⃣ تثبيت المتطلبات

**بعد ما تدخل السيرفر، انسخ والصق هذه الأوامر:**

```bash
# تحديث النظام
apt update && apt upgrade -y

# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# تثبيت Git
apt install -y git

# تثبيت PM2 (لإدارة التطبيق)
npm install -g pm2

# تثبيت build tools
apt install -y build-essential

# التحقق من التثبيت
node --version
npm --version
git --version
```

---

### 3️⃣ رفع التطبيق

```bash
# الذهاب للمجلد الرئيسي
cd /root

# استنساخ المشروع من GitHub
git clone https://github.com/fikrimamdouh/rinapro-whatsapp-agent.git

# الدخول للمجلد
cd rinapro-whatsapp-agent

# تثبيت المكتبات
npm install

# بناء التطبيق
npm run build
```

---

### 4️⃣ إعداد المتغيرات البيئية

```bash
# إنشاء ملف .env
cat > .env << 'EOF'
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your-openai-api-key-here
MANAGER_PHONE=966500000000
DATABASE_URL=
EOF

# تعديل الملف (اختياري)
nano .env
```

**اضغط Ctrl+X ثم Y ثم Enter للحفظ**

---

### 5️⃣ تشغيل التطبيق

```bash
# تشغيل التطبيق بـ PM2
pm2 start npm --name "rinapro" -- start

# جعل PM2 يبدأ تلقائياً عند إعادة التشغيل
pm2 startup
pm2 save

# عرض الـ logs
pm2 logs rinapro
```

---

### 6️⃣ فتح المنافذ (Firewall)

```bash
# السماح بالمنفذ 3000
ufw allow 3000/tcp

# السماح بـ SSH
ufw allow 22/tcp

# تفعيل الـ Firewall
ufw --force enable

# التحقق من الحالة
ufw status
```

---

### 7️⃣ اختبار التطبيق

**افتح المتصفح:**
```
http://209.38.33.72:3000
```

**يجب أن يظهر التطبيق!** ✅

---

### 8️⃣ اختبار WhatsApp QR Code

1. اذهب إلى: `http://209.38.33.72:3000/whatsapp`
2. اضغط "اتصال جديد (QR Code)"
3. انتظر 5-10 ثواني
4. **يجب أن يظهر QR Code!** 🎉

---

## 🔧 أوامر مفيدة:

### إدارة التطبيق:
```bash
# عرض حالة التطبيق
pm2 status

# عرض الـ logs
pm2 logs rinapro

# إعادة تشغيل التطبيق
pm2 restart rinapro

# إيقاف التطبيق
pm2 stop rinapro

# حذف التطبيق من PM2
pm2 delete rinapro
```

### تحديث التطبيق:
```bash
cd /root/rinapro-whatsapp-agent
git pull
npm install
npm run build
pm2 restart rinapro
```

### عرض الـ logs:
```bash
# Logs مباشرة
pm2 logs rinapro

# آخر 100 سطر
pm2 logs rinapro --lines 100

# فقط الأخطاء
pm2 logs rinapro --err
```

---

## 🌐 إضافة Domain (اختياري):

### إذا كان عندك دومين:

1. **في إعدادات الدومين:**
   - أضف A Record يشير إلى: `209.38.33.72`

2. **تثبيت Nginx:**
```bash
apt install -y nginx

# إنشاء ملف الإعدادات
cat > /etc/nginx/sites-available/rinapro << 'EOF'
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# تفعيل الإعدادات
ln -s /etc/nginx/sites-available/rinapro /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

3. **تثبيت SSL (HTTPS):**
```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## 🆘 حل المشاكل:

### التطبيق لا يعمل:
```bash
# تحقق من الـ logs
pm2 logs rinapro

# تحقق من المنفذ
netstat -tulpn | grep 3000

# أعد تشغيل التطبيق
pm2 restart rinapro
```

### WhatsApp لا يتصل:
```bash
# تحقق من الـ logs
pm2 logs rinapro | grep WhatsApp

# أعد تشغيل التطبيق
pm2 restart rinapro
```

### نفاد المساحة:
```bash
# تحقق من المساحة
df -h

# حذف ملفات مؤقتة
apt clean
npm cache clean --force
```

---

## 📊 مراقبة الأداء:

```bash
# استخدام الذاكرة
free -h

# استخدام CPU
top

# مراقبة PM2
pm2 monit
```

---

**تم إعداد هذا الدليل بواسطة Ona** 🤖
