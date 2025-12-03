import { readFileSync } from "fs";
import { importCustomerBalances, importAccountBalances } from "../server/excelImporter";
import * as db from "../server/db";

/**
 * سكريبت لرفع ملفات Excel إلى قاعدة البيانات
 * يمسح البيانات القديمة أولاً
 */
async function main() {
  try {
    console.log("🚀 بدء رفع ملفات Excel...\n");

    // مسح البيانات القديمة
    console.log("🗑️  مسح البيانات القديمة...");
    await db.clearCustomerBalances();
    await db.clearAccountBalances();
    console.log("✅ تم مسح البيانات القديمة\n");

    // رفع ملف أرصدة العملاء
    console.log("📂 رفع ملف عملاء2025.xlsx...");
    const customerFile = readFileSync("/home/ubuntu/upload/عملاء2025.xlsx");
    const customerResult = await importCustomerBalances(customerFile);
    console.log(customerResult.message);
    console.log(`✅ تم رفع ${customerResult.successCount} عميل بنجاح`);
    if (customerResult.failedCount > 0) {
      console.log(`⚠️ فشل ${customerResult.failedCount} سجل`);
      console.log("الأخطاء:", customerResult.errors.slice(0, 5));
    }

    console.log("\n" + "=".repeat(50) + "\n");

    // رفع ملف أرصدة الحسابات
    console.log("📂 رفع ملف ارصدةالحسابات.xlsx...");
    const accountFile = readFileSync("/home/ubuntu/upload/ارصدةالحسابات.xlsx");
    const accountResult = await importAccountBalances(accountFile);
    console.log(accountResult.message);
    console.log(`✅ تم رفع ${accountResult.successCount} حساب بنجاح`);
    if (accountResult.failedCount > 0) {
      console.log(`⚠️ فشل ${accountResult.failedCount} سجل`);
      console.log("الأخطاء:", accountResult.errors.slice(0, 5));
    }

    console.log("\n🎉 تم رفع جميع الملفات بنجاح!");
    process.exit(0);
  } catch (error: any) {
    console.error("❌ خطأ:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
