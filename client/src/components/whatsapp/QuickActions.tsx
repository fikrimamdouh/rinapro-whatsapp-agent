import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  FileText, 
  Bell, 
  Users, 
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function QuickActions() {
  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation();
  
  // جلب البيانات
  const { data: customerBalances } = trpc.customerBalances.getAll.useQuery();
  const { data: accountBalances } = trpc.accountBalances.getAll.useQuery();

  const sendToGroup = async (message: string) => {
    try {
      toast.loading("جاري إرسال التقرير...");
      await sendMessageMutation.mutateAsync({
        to: "group",
        message: message,
      });
      toast.success("✅ تم إرسال التقرير للجروب");
    } catch (error: any) {
      toast.error(`❌ خطأ: ${error.message}`);
    }
  };

  // تقرير يومي
  const sendDailyReport = () => {
    const totalCustomers = customerBalances?.length || 0;
    const totalDebit = customerBalances?.reduce((sum, c) => sum + (c.debit || 0), 0) || 0;
    const totalCredit = customerBalances?.reduce((sum, c) => sum + (c.credit || 0), 0) || 0;
    const totalBalance = customerBalances?.reduce((sum, c) => sum + (c.currentBalance || 0), 0) || 0;
    
    const message = `📊 *التقرير اليومي*\n\n` +
      `📅 التاريخ: ${new Date().toLocaleDateString('ar-EG')}\n\n` +
      `👥 إجمالي العملاء: ${totalCustomers}\n` +
      `💰 إجمالي المدين: ${(totalDebit / 100).toFixed(2)} ر.س\n` +
      `💳 إجمالي الدائن: ${(totalCredit / 100).toFixed(2)} ر.س\n` +
      `📈 الرصيد الإجمالي: ${(totalBalance / 100).toFixed(2)} ر.س\n\n` +
      `_تم إنشاء التقرير تلقائياً من نظام RinaPro_`;
    
    sendToGroup(message);
  };

  // تقرير العملاء المدينين
  const sendDebtorsReport = () => {
    const debtors = customerBalances?.filter(c => (c.currentBalance || 0) > 0)
      .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
      .slice(0, 10) || [];
    
    let message = `📋 *أكبر 10 عملاء مدينين*\n\n`;
    debtors.forEach((c, i) => {
      message += `${i + 1}. ${c.customerName}\n`;
      message += `   الرصيد: ${((c.currentBalance || 0) / 100).toFixed(2)} ر.س\n\n`;
    });
    message += `_إجمالي: ${debtors.length} عميل_`;
    
    sendToGroup(message);
  };

  // تقرير الأرصدة الصفرية
  const sendZeroBalanceReport = () => {
    const zeroBalance = customerBalances?.filter(c => Math.abs(c.currentBalance || 0) < 100) || [];
    
    const message = `✅ *العملاء برصيد صفر*\n\n` +
      `عدد العملاء: ${zeroBalance.length}\n\n` +
      `_هؤلاء العملاء ليس لديهم مديونيات أو دائنية_`;
    
    sendToGroup(message);
  };

  // تقرير البنوك
  const sendBanksReport = () => {
    const banks = accountBalances?.filter(a => a.accountCode.startsWith('101020')) || [];
    const totalBankBalance = banks.reduce((sum, a) => sum + ((a.debitBalance || 0) - (a.creditBalance || 0)), 0);
    
    let message = `🏦 *تقرير البنوك*\n\n`;
    banks.forEach(bank => {
      const balance = (bank.debitBalance || 0) - (bank.creditBalance || 0);
      message += `• ${bank.accountName}\n`;
      message += `  الرصيد: ${(balance / 100).toFixed(2)} ر.س\n\n`;
    });
    message += `💰 الإجمالي: ${(totalBankBalance / 100).toFixed(2)} ر.س`;
    
    sendToGroup(message);
  };

  // تقرير الموردين
  const sendSuppliersReport = () => {
    const suppliers = accountBalances?.filter(a => a.accountCode.startsWith('201')) || [];
    const totalSupplierBalance = suppliers.reduce((sum, a) => sum + ((a.debitBalance || 0) - (a.creditBalance || 0)), 0);
    
    let message = `📦 *تقرير الموردين*\n\n`;
    message += `عدد الموردين: ${suppliers.length}\n`;
    message += `الرصيد الإجمالي: ${(totalSupplierBalance / 100).toFixed(2)} ر.س\n\n`;
    
    const top5 = suppliers.slice(0, 5);
    message += `*أكبر 5 موردين:*\n`;
    top5.forEach((s, i) => {
      const balance = (s.debitBalance || 0) - (s.creditBalance || 0);
      message += `${i + 1}. ${s.accountName}\n`;
      message += `   ${(balance / 100).toFixed(2)} ر.س\n\n`;
    });
    
    sendToGroup(message);
  };
  const actions = [
    {
      id: "daily-report",
      title: "تقرير يومي",
      description: "إحصائيات العملاء والأرصدة",
      icon: FileText,
      color: "blue",
      action: sendDailyReport,
    },
    {
      id: "debtors-report",
      title: "أكبر المدينين",
      description: "أكبر 10 عملاء مدينين",
      icon: AlertCircle,
      color: "red",
      action: sendDebtorsReport,
    },
    {
      id: "zero-balance",
      title: "أرصدة صفرية",
      description: "العملاء برصيد صفر",
      icon: Users,
      color: "green",
      action: sendZeroBalanceReport,
    },
    {
      id: "banks-report",
      title: "تقرير البنوك",
      description: "أرصدة جميع البنوك",
      icon: DollarSign,
      color: "yellow",
      action: sendBanksReport,
    },
    {
      id: "suppliers-report",
      title: "تقرير الموردين",
      description: "أرصدة الموردين",
      icon: Package,
      color: "purple",
      action: sendSuppliersReport,
    },
    {
      id: "customer-balance",
      title: "أرصدة العملاء",
      description: "عرض جميع أرصدة العملاء",
      icon: Users,
      color: "green",
      action: () => {
        const total = customerBalances?.length || 0;
        const message = `👥 *أرصدة العملاء*\n\nإجمالي العملاء: ${total}\n\nللاطلاع على التفاصيل، قم بزيارة صفحة العملاء في النظام.`;
        sendToGroup(message);
      },
    },
    {
      id: "sales-summary",
      title: "ملخص المبيعات",
      description: "ملخص مبيعات الأسبوع",
      icon: TrendingUp,
      color: "purple",
      action: () => sendToGroup("📊 *ملخص المبيعات*\n\nسيتم إضافة هذا التقرير قريباً عند ربط بيانات المبيعات."),
    },
    {
      id: "inventory-alert",
      title: "تنبيه المخزون",
      description: "الأصناف القريبة من النفاد",
      icon: Package,
      color: "red",
      action: () => sendToGroup("📦 *تنبيه المخزون*\n\nسيتم إضافة هذا التقرير قريباً عند ربط بيانات المخزون."),
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; icon: string }> = {
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "text-orange-400" },
      green: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "text-green-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "text-purple-400" },
      red: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400" },
      yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "text-yellow-400" },
      pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", icon: "text-pink-400" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">الإجراءات السريعة</h2>
            <p className="text-sm text-gray-400">Quick Actions</p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const colors = getColorClasses(action.color);
            
            return (
              <Button
                key={action.id}
                onClick={action.action}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-start gap-3 ${colors.bg} ${colors.border} hover:scale-105 transition-transform`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                  <h3 className="text-white font-semibold text-right flex-1">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 text-right w-full">
                  {action.description}
                </p>
              </Button>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>نصيحة:</strong> استخدم الإجراءات السريعة لتوفير الوقت وإنجاز المهام الشائعة بضغطة واحدة
          </p>
        </div>
      </div>
    </Card>
  );
}
