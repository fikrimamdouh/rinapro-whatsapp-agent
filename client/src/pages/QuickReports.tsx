import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Send,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Filter,
  MessageSquare,
  Zap,
  FileText,
} from "lucide-react";
import { Link } from "wouter";

export default function QuickReports() {
  const { data: customerBalances, isLoading } = trpc.customerBalances.getAll.useQuery();
  const { data: settings } = trpc.settings.list.useQuery();
  
  const groupName = settings?.find(s => s.settingKey === "GROUP_NAME")?.settingValue || "";
  const managerNumber = settings?.find(s => s.settingKey === "MANAGER_NUMBER")?.settingValue || "";

  // حساب الإحصائيات
  const stats = {
    total: customerBalances?.length || 0,
    openingMatchesDebit: customerBalances?.filter(c => {
      const previousBalance = c.previousBalance || 0;
      const debit = c.debit || 0;
      return Math.abs(previousBalance - debit) <= 1 && debit !== 0;
    }).length || 0,
    openingWithMovementToZero: customerBalances?.filter(c => {
      const previousBalance = c.previousBalance || 0;
      const hasMovement = (c.debit || 0) !== 0 || (c.credit || 0) !== 0;
      const currentBalance = c.currentBalance || 0;
      return previousBalance !== 0 && hasMovement && Math.abs(currentBalance) <= 1;
    }).length || 0,
    balanceMismatch: customerBalances?.filter(c => {
      const expectedBalance = (c.previousBalance || 0) + (c.debit || 0) - (c.credit || 0);
      const actualBalance = c.currentBalance || 0;
      return Math.abs(actualBalance - expectedBalance) > 1;
    }).length || 0,
    negativeBalance: customerBalances?.filter(c => (c.currentBalance || 0) < 0).length || 0,
    largeMovement: customerBalances?.filter(c => ((c.debit || 0) + (c.credit || 0)) > 500000).length || 0,
    noMovement: customerBalances?.filter(c => (c.debit || 0) === 0 && (c.credit || 0) === 0).length || 0,
    debitOnly: customerBalances?.filter(c => (c.debit || 0) > 0 && (c.credit || 0) === 0).length || 0,
    creditOnly: customerBalances?.filter(c => (c.credit || 0) > 0 && (c.debit || 0) === 0).length || 0,
    balanceIncreased: customerBalances?.filter(c => (c.currentBalance || 0) > (c.previousBalance || 0)).length || 0,
    balanceDecreased: customerBalances?.filter(c => (c.currentBalance || 0) < (c.previousBalance || 0)).length || 0,
    roundNumbers: customerBalances?.filter(c => {
      const balance = Math.abs(c.currentBalance || 0);
      return balance > 0 && balance % 100000 === 0;
    }).length || 0,
  };

  const sendReportToWhatsApp = (filterName: string, customers: any[], title: string) => {
    if (customers.length === 0) {
      toast.error("لا توجد بيانات لإرسالها");
      return;
    }

    let message = `📊 *${title}*\n`;
    message += `مصنع بن حامد للبلوك والخرسانة الجاهزة\n\n`;
    message += `📅 التاريخ: ${new Date().toLocaleDateString('ar-SA')}\n`;
    message += `👥 عدد العملاء: ${customers.length}\n\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n\n`;

    customers.slice(0, 20).forEach((c, i) => {
      const balance = (c.currentBalance || 0) / 100;
      const type = balance > 0 ? "مدين" : balance < 0 ? "دائن" : "صفر";
      message += `${i + 1}. ${c.customerName}\n`;
      message += `   💰 الرصيد: ${Math.abs(balance).toFixed(2)} ر.س (${type})\n`;
      if (c.phone) message += `   📱 ${c.phone}\n`;
      message += `\n`;
    });

    if (customers.length > 20) {
      message += `... و ${customers.length - 20} عميل آخر\n\n`;
    }

    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📈 إجمالي الأرصدة: ${(customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0) / 100).toFixed(2)} ر.س\n`;

    // فتح واتساب مباشرة
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success("تم فتح واتساب - أرسل الرسالة للجروب");
  };

  const reports = [
    {
      id: "openingMatchesDebit",
      title: "🚨 رصيد سابق = مدين",
      description: "عملاء الرصيد السابق لديهم مطابق للمدين (مشبوه جداً)",
      count: stats.openingMatchesDebit,
      color: "red",
      icon: AlertTriangle,
      severity: "critical",
      getData: () => customerBalances?.filter(c => {
        const previousBalance = c.previousBalance || 0;
        const debit = c.debit || 0;
        return Math.abs(previousBalance - debit) <= 1 && debit !== 0;
      }) || [],
    },
    {
      id: "openingWithMovementToZero",
      title: "🚨 رصيد + حركة = صفر",
      description: "عملاء كان لديهم رصيد وحركة لكن الرصيد النهائي صفر",
      count: stats.openingWithMovementToZero,
      color: "red",
      icon: AlertTriangle,
      severity: "critical",
      getData: () => customerBalances?.filter(c => {
        const previousBalance = c.previousBalance || 0;
        const hasMovement = (c.debit || 0) !== 0 || (c.credit || 0) !== 0;
        const currentBalance = c.currentBalance || 0;
        return previousBalance !== 0 && hasMovement && Math.abs(currentBalance) <= 1;
      }) || [],
    },
    {
      id: "balanceMismatch",
      title: "⚠️ أخطاء حسابية",
      description: "عملاء الرصيد الحالي لا يساوي (السابق + المدين - الدائن)",
      count: stats.balanceMismatch,
      color: "orange",
      icon: AlertTriangle,
      severity: "high",
      getData: () => customerBalances?.filter(c => {
        const expectedBalance = (c.previousBalance || 0) + (c.debit || 0) - (c.credit || 0);
        const actualBalance = c.currentBalance || 0;
        return Math.abs(actualBalance - expectedBalance) > 1;
      }) || [],
    },
    {
      id: "roundNumbers",
      title: "⚠️ أرقام مدورة",
      description: "عملاء بأرقام مدورة (قد تكون تقديرات)",
      count: stats.roundNumbers,
      color: "yellow",
      icon: AlertTriangle,
      severity: "medium",
      getData: () => customerBalances?.filter(c => {
        const balance = Math.abs(c.currentBalance || 0);
        return balance > 0 && balance % 100000 === 0;
      }) || [],
    },
    {
      id: "negativeBalance",
      title: "📉 عملاء دائنون",
      description: "عملاء برصيد سالب (دائنون)",
      count: stats.negativeBalance,
      color: "red",
      icon: TrendingDown,
      severity: "high",
      getData: () => customerBalances?.filter(c => (c.currentBalance || 0) < 0) || [],
    },
    {
      id: "debitOnly",
      title: "📊 حركة مدين فقط",
      description: "عملاء لديهم مدين بدون دائن (لم يدفعوا)",
      count: stats.debitOnly,
      color: "blue",
      icon: TrendingUp,
      severity: "medium",
      getData: () => customerBalances?.filter(c => (c.debit || 0) > 0 && (c.credit || 0) === 0) || [],
    },
    {
      id: "creditOnly",
      title: "💰 حركة دائن فقط",
      description: "عملاء دفعوا بدون مشتريات جديدة",
      count: stats.creditOnly,
      color: "green",
      icon: TrendingDown,
      severity: "low",
      getData: () => customerBalances?.filter(c => (c.credit || 0) > 0 && (c.debit || 0) === 0) || [],
    },
    {
      id: "balanceIncreased",
      title: "📈 الرصيد زاد",
      description: "عملاء ديونهم زادت (خطر)",
      count: stats.balanceIncreased,
      color: "red",
      icon: TrendingUp,
      severity: "high",
      getData: () => customerBalances?.filter(c => (c.currentBalance || 0) > (c.previousBalance || 0)) || [],
    },
    {
      id: "balanceDecreased",
      title: "📉 الرصيد نقص",
      description: "عملاء دفعوا (جيد)",
      count: stats.balanceDecreased,
      color: "green",
      icon: TrendingDown,
      severity: "low",
      getData: () => customerBalances?.filter(c => (c.currentBalance || 0) < (c.previousBalance || 0)) || [],
    },
    {
      id: "largeMovement",
      title: "📊 حركة كبيرة",
      description: "عملاء بحركة أكثر من 5,000 ر.س",
      count: stats.largeMovement,
      color: "blue",
      icon: TrendingUp,
      severity: "medium",
      getData: () => customerBalances?.filter(c => ((c.debit || 0) + (c.credit || 0)) > 500000) || [],
    },
    {
      id: "noMovement",
      title: "💤 بدون حركة",
      description: "عملاء بدون أي حركة",
      count: stats.noMovement,
      color: "gray",
      icon: RefreshCw,
      severity: "low",
      getData: () => customerBalances?.filter(c => (c.debit || 0) === 0 && (c.credit || 0) === 0) || [],
    },
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return "border-red-500/50 bg-red-500/5";
      case "high": return "border-orange-500/50 bg-orange-500/5";
      case "medium": return "border-yellow-500/50 bg-yellow-500/5";
      case "low": return "border-green-500/50 bg-green-500/5";
      default: return "border-gray-500/50 bg-gray-500/5";
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium": return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low": return "bg-green-500/20 text-green-400 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold neon-green mb-2 flex items-center gap-3">
                <Zap className="h-10 w-10" />
                التقارير السريعة
              </h1>
              <p className="text-muted-foreground">
                إرسال تقارير فورية للواتساب بضغطة زر واحدة
              </p>
            </div>
            <Link href="/customer-balances">
              <Button variant="outline" className="border-[#00ff88]/30">
                <Filter className="ml-2 h-4 w-4" />
                الفلاتر المتقدمة
              </Button>
            </Link>
          </div>
        </div>

        {/* إعدادات الواتساب */}
        {(!groupName || !managerNumber) && (
          <Card className="mb-6 border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="font-semibold text-yellow-400">تنبيه: لم يتم تكوين إعدادات الواتساب</p>
                  <p className="text-sm text-muted-foreground">
                    يرجى إضافة رقم المدير واسم الجروب في{" "}
                    <Link href="/settings" className="text-[#00ff88] hover:underline">
                      الإعدادات
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold neon-green">{stats.total}</div>
                <div className="text-sm text-muted-foreground">إجمالي العملاء</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-strong border-red-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">
                  {stats.openingMatchesDebit + stats.openingWithMovementToZero}
                </div>
                <div className="text-sm text-muted-foreground">حالات حرجة</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-strong border-orange-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">
                  {stats.balanceMismatch + stats.roundNumbers}
                </div>
                <div className="text-sm text-muted-foreground">حالات مشبوهة</div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-strong border-blue-500/30">
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{stats.negativeBalance}</div>
                <div className="text-sm text-muted-foreground">عملاء دائنون</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* التقارير */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.id} className={`glass-strong ${getSeverityColor(report.severity)}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getSeverityBadge(report.severity)}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{report.title}</CardTitle>
                        <CardDescription className="text-xs mt-1">
                          {report.description}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-3xl font-bold">{report.count}</div>
                      <div className="text-xs text-muted-foreground">عميل</div>
                    </div>
                    <Button
                      onClick={() => sendReportToWhatsApp(report.id, report.getData(), report.title)}
                      disabled={report.count === 0 || isLoading}
                      className="bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <MessageSquare className="ml-2 h-4 w-4" />
                      إرسال
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* معلومات إضافية */}
        <Card className="mt-6 glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              كيفية الاستخدام
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1. اختر التقرير الذي تريد إرساله</p>
              <p>2. اضغط على زر "إرسال"</p>
              <p>3. سيتم فتح واتساب مع الرسالة جاهزة</p>
              <p>4. اختر الجروب أو جهة الاتصال وأرسل</p>
              <p className="text-[#00ff88] mt-4">
                💡 نصيحة: يمكنك تعديل الرسالة قبل الإرسال
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
