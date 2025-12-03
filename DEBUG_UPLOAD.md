# 🐛 Debug Upload Issues
## تصحيح مشاكل رفع الملفات

---

## 🔍 الخطوات

### 1. افتح Console في المتصفح
```
F12 → Console tab
```

### 2. جرب رفع ملف
```
1. اذهب إلى: http://localhost:5173/customer-balances
2. اضغط "استيراد Excel"
3. اختر ملف Excel
4. شاهد Console
```

### 3. ابحث عن هذه الـ Logs

#### في المتصفح (Console):
```
📁 Reading file: filename.xlsx
📊 Parsed data: X rows
📋 Sample: [...]
📤 Sending to server...
```

#### في الـ Server (Terminal):
```
📥 CustomerBalances Import - Input: {...}
📥 CustomerBalances Import - Records: X
✅ Imported X/Y
```

---

## ❌ الأخطاء الشائعة

### Error 1: "Unable to transform response"
**السبب**: الـ server يرجع response بتنسيق خاطئ

**الحل**:
```bash
# تحقق من server logs
cd /workspaces/rinapro-whatsapp-agent
# شاهد terminal الـ server
```

### Error 2: "No data provided"
**السبب**: الملف فارغ أو لم يتم قراءته بشكل صحيح

**الحل**:
1. تأكد أن الملف .xlsx أو .xls
2. تأكد أن الملف يحتوي على بيانات
3. تأكد أن العناوين في الصف الصحيح

### Error 3: "Validation error"
**السبب**: البيانات لا تطابق التنسيق المتوقع

**الحل**:
- تحقق من أسماء الأعمدة
- تحقق من أنواع البيانات

---

## 🧪 اختبار يدوي

### Test 1: تحقق من الـ API مباشرة

```bash
curl -X POST http://localhost:5000/api/trpc/customerBalances.importFromExcel?batch=1 \
  -H "Content-Type: application/json" \
  -d '{
    "0": {
      "data": [
        {
          "customerCode": "123",
          "customerName": "Test Customer",
          "previousBalance": 1000,
          "debit": 500,
          "credit": 200,
          "currentBalance": 1300
        }
      ]
    }
  }'
```

**النتيجة المتوقعة**:
```json
[{
  "result": {
    "data": {
      "success": true,
      "successCount": 1,
      "totalCount": 1
    }
  }
}]
```

### Test 2: تحقق من الـ Database

```bash
sqlite3 data/rinapro.db
SELECT * FROM customerBalances LIMIT 5;
.quit
```

---

## 📋 Checklist

قبل أن تسألني، تحقق من:

- [ ] الـ server يعمل (ps aux | grep tsx)
- [ ] الـ client يعمل (ps aux | grep vite)
- [ ] الملف Excel صحيح (.xlsx أو .xls)
- [ ] الملف يحتوي على بيانات
- [ ] Console مفتوح في المتصفح
- [ ] Terminal الـ server مفتوح

---

## 📞 أرسل لي

إذا لم ينجح، أرسل لي:

### 1. من Console المتصفح:
```
- كل الـ logs التي تبدأ بـ 📁 أو 📊 أو 📤 أو ❌
- الـ error message كامل
```

### 2. من Terminal الـ Server:
```
- كل الـ logs التي تبدأ بـ 📥 أو ✅ أو ❌ أو 💥
```

### 3. من ملف Excel:
```
- أول 3 صفوف (screenshot أو copy/paste)
- أسماء الأعمدة
```

---

## 🎯 الحل السريع

إذا كنت مستعجل:

```bash
# 1. أعد تشغيل كل شيء
cd /workspaces/rinapro-whatsapp-agent
pkill -f "vite|tsx"
sleep 2
npm run dev

# 2. انتظر 10 ثواني

# 3. افتح المتصفح
# http://localhost:5173/customer-balances

# 4. جرب رفع ملف
```

---

## 💡 نصيحة

**استخدم ملف Excel بسيط للاختبار:**

| customerCode | customerName | previousBalance | debit | credit | currentBalance |
|--------------|--------------|-----------------|-------|--------|----------------|
| 001          | أحمد محمد    | 1000            | 500   | 200    | 1300           |
| 002          | محمد علي     | 2000            | 1000  | 500    | 2500           |

احفظه كـ `test.xlsx` وجربه.

---

**أنا هنا لمساعدتك!** 🚀
