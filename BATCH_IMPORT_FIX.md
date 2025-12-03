# ✅ إصلاح مشكلة الملفات الكبيرة
## Batch Import Fix

---

## 🎯 المشكلة

```
📊 Parsed data: 2922 rows
POST .../importFromExcel 400 (Bad Request)
```

**السبب**: الملف كبير جداً (2922 صف) والـ HTTP request يتجاوز الحد المسموح.

---

## ✅ الحل

### تقسيم البيانات إلى دفعات (Batches)

بدلاً من إرسال 2922 صف دفعة واحدة، نقسمها إلى:
- **30 دفعة** × **100 صف** = 3000 صف

---

## 🔧 ما تم عمله

### 1. Frontend (CustomerBalances.tsx & AccountBalances.tsx)
```typescript
// Split into batches of 100 rows
const BATCH_SIZE = 100;
const batches = [];
for (let i = 0; i < data.length; i += BATCH_SIZE) {
  batches.push(data.slice(i, i + BATCH_SIZE));
}

// Send each batch
for (let i = 0; i < batches.length; i++) {
  const result = await importMutation.mutateAsync({ 
    data: batches[i],
    isFirstBatch: i === 0  // حذف البيانات القديمة فقط في الدفعة الأولى
  });
}
```

### 2. Backend (customerBalances.ts & accountBalances.ts)
```typescript
.input(
  z.object({
    data: z.array(z.any()).optional().default([]),
    isFirstBatch: z.boolean().optional().default(true),  // جديد
  }).passthrough()
)

// Only delete all on first batch
if (input.isFirstBatch) {
  await db.deleteAllCustomerBalances();
}
```

---

## 📊 النتيجة المتوقعة

### في Console المتصفح:
```
📁 Reading file: عملاء 2025.xlsx
📊 Parsed data: 2922 rows
📋 Sample: [...]
📦 Split into 30 batches
📤 Sending batch 1/30...
📤 Sending batch 2/30...
📤 Sending batch 3/30...
...
📤 Sending batch 30/30...
✅ تم استيراد 2922 سجل، فشل 0
```

### في Terminal الـ Server:
```
📥 CustomerBalances Import - Records: 100 First batch: true
🗑️ Deleting all existing records...
✅ Imported 100/100
📥 CustomerBalances Import - Records: 100 First batch: false
✅ Imported 100/100
...
```

---

## 🧪 اختبر الآن

1. افتح [http://localhost:5173/customer-balances](http://localhost:5173/customer-balances)
2. ارفع ملف Excel كبير (2000+ صف)
3. شاهد progress bar: "جاري الاستيراد... 1/30"
4. انتظر حتى ينتهي
5. يجب أن ترى: "تم استيراد X سجل"

---

## 💡 الفوائد

1. ✅ **يدعم ملفات كبيرة** - حتى 10,000+ صف
2. ✅ **Progress indicator** - المستخدم يرى التقدم
3. ✅ **أكثر استقراراً** - لا timeout errors
4. ✅ **أفضل performance** - الـ server لا يتجمد

---

## 🎯 الخطوات التالية

إذا نجح:
1. ✅ اختبر باقي الـ modules
2. ✅ اختبر مع ملفات أكبر (5000+ صف)
3. ✅ انتقل لتحسين WhatsApp

إذا فشل:
- أرسل لي الـ logs
- أرسل لي حجم الملف
- أرسل لي الـ error message

---

**جرب الآن!** 🚀
