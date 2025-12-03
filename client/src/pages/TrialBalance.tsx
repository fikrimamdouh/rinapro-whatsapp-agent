import { Scale, FileSpreadsheet, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function TrialBalance() {
  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        {/* Back Button */}
        <Link href="/">
          <button className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowRight className="w-4 h-4" />
            <span>العودة للرئيسية</span>
          </button>
        </Link>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold neon-green">ميزان المراجعة</h1>
          </div>
          <p className="text-muted-foreground">
            عرض وإدارة ميزان المراجعة وأرصدة العملاء
          </p>
        </div>

        {/* Info Card */}
        <div className="glass rounded-lg p-6 mb-6 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="w-6 h-6 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-lg mb-2 neon-green">
                تنسيق ملف ميزان المراجعة
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                يجب أن يحتوي الملف على الأعمدة التالية:
              </p>
              <ul className="text-sm text-muted-foreground space-y-2 mr-4">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  رقم الحساب / العميل
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  اسم العميل
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  ما قبله (الرصيد الافتتاحي)
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  مدين
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  دائن
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  الرصيد
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                  الشيكات (اختياري)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="glass rounded-lg p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-500/20 mb-4">
            <Scale className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 neon-green">قريباً</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            صفحة ميزان المراجعة قيد التطوير. سيتم إضافة إمكانية رفع وتحليل ملفات ميزان المراجعة قريباً.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/customers">
              <button className="px-6 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors">
                إدارة العملاء
              </button>
            </Link>
            <Link href="/reports">
              <button className="px-6 py-2 rounded-lg neon-green-bg hover:opacity-90 transition-opacity">
                التقارير
              </button>
            </Link>
          </div>
        </div>

        {/* Documentation Link */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            للمزيد من المعلومات، راجع{" "}
            <a 
              href="https://github.com/fikrimamdouh/rinapro-whatsapp-agent/blob/main/ACCOUNTING_FILES_GUIDE.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              دليل الملفات المحاسبية
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
