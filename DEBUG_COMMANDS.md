# 🔍 أوامر التشخيص السريع

## في Browser Console (اضغط F12):

### 1️⃣ فحص حالة WhatsApp:
```javascript
fetch('https://web-production-1cab1.up.railway.app/api/trpc/whatsapp.status')
  .then(r => r.json())
  .then(d => console.log('WhatsApp Status:', d))
  .catch(e => console.error('Error:', e))
```

### 2️⃣ محاولة الاتصال:
```javascript
fetch('https://web-production-1cab1.up.railway.app/api/trpc/whatsapp.connect', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({})
})
  .then(r => r.json())
  .then(d => console.log('Connect Result:', d))
  .catch(e => console.error('Error:', e))
```

### 3️⃣ فحص Health:
```javascript
fetch('https://web-production-1cab1.up.railway.app/api/health')
  .then(r => r.json())
  .then(d => console.log('Health:', d))
  .catch(e => console.error('Error:', e))
```

---

## انسخ النتائج وأرسلها لي! 📋
