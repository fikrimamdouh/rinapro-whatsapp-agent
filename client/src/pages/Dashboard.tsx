import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import {
  Users,
  FileText,
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  MessageSquare,
  Settings,
  Bot,
  Wallet,
  ShoppingCart,
  ShoppingBag,
  Wrench,
  Truck,
  CreditCard,
  BarChart3,
  LineChart,
} from "lucide-react";
import { Link } from "wouter";
import { BackToHome } from "@/components/BackToHome";
import { AnalyticsCharts } from "@/components/AnalyticsCharts";
import { CompanySelector } from "@/components/CompanySelector";

export default function Dashboard() {
  const { data: user } = trpc.auth.me.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: overdueInstallments } = trpc.installments.getOverdue.useQuery();
  const { data: whatsappStatus } = trpc.whatsapp.status.useQuery();
  const { data: settings } = trpc.settings.list.useQuery();
  
  const companyName = settings?.find(s => s.settingKey === "COMPANY_NAME")?.settingValue || "RinaPro";
  const welcomeMessage = settings?.find(s => s.settingKey === "WELCOME_MESSAGE")?.settingValue || "مرحباً بك في نظام إدارة الشركة";

  const stats = [
    {
      title: "العملاء",
      value: customers?.length || 0,
      icon: Users,
      link: "/customers",
      color: "text-blue-500",
    },
    {
      title: "الفواتير",
      value: invoices?.length || 0,
      icon: FileText,
      link: "/invoices",
      color: "text-purple-500",
    },
    {
      title: "الأقساط المتأخرة",
      value: overdueInstallments?.length || 0,
      icon: AlertCircle,
      link: "/installments",
      color: "text-red-500",
    },
    {
      title: "حالة WhatsApp",
      value: whatsappStatus?.connected ? "متصل" : "غير متصل",
      icon: MessageSquare,
      link: "/whatsapp",
      color: whatsappStatus?.connected ? "text-green-500" : "text-gray-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">
              {companyName}
            </h1>
          <p className="text-muted-foreground">
            {welcomeMessage}
          </p>
          </div>
          <CompanySelector />
        </div>

        {/* Analytics Charts */}
        <div className="mb-8">
          <AnalyticsCharts />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Link key={index} href={stat.link}>
              <Card className="glass-strong hover:neon-green-border transition-all cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Main Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* العملاء */}
          <Link href="/customers">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Users className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>العملاء</CardTitle>
                    <CardDescription>إدارة بيانات العملاء</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  عرض، إضافة، تعديل، بحث، ورفع ملفات Excel للعملاء
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* أرصدة العملاء */}
          <Link href="/customer-balances">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full border-red-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-red-500/20">
                    <TrendingUp className="h-6 w-6 text-red-500" />
                  </div>
                  <div>
                    <CardTitle>أرصدة العملاء</CardTitle>
                    <CardDescription>ميزان المراجعة للعملاء</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  استيراد أرصدة العملاء مع المدين والدائن من ملفات Excel
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* أرصدة الحسابات */}
          <Link href="/account-balances">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full border-green-500/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-green-500/20">
                    <TrendingDown className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle>أرصدة الحسابات</CardTitle>
                    <CardDescription>ميزان المراجعة للحسابات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  استيراد أرصدة الحسابات مع الحركات والأرصدة من ملفات Excel
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الموردين */}
          <Link href="/suppliers">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Package className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الموردين</CardTitle>
                    <CardDescription>إدارة بيانات الموردين</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  عرض، إضافة، رفع ملفات Excel، والبحث عن الموردين
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الفواتير */}
          <Link href="/invoices">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <FileText className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الفواتير</CardTitle>
                    <CardDescription>إدارة الفواتير</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  تسجيل، استعلام، بحث، تحليل، ورفع ملفات Excel للفواتير
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الأقساط */}
          <Link href="/installments">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <DollarSign className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الأقساط والسندات</CardTitle>
                    <CardDescription>متابعة الأقساط</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  مشاهدة، استرجاع، تأخير، وإشعارات الأقساط
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الحسابات */}
          <Link href="/accounts">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <TrendingUp className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الحسابات</CardTitle>
                    <CardDescription>أرصدة وحسابات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  عرض أرصدة الحسابات، التحليل، والتقارير المالية
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* المخزون */}
          <Link href="/inventory">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Package className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>المخزون</CardTitle>
                    <CardDescription>إدارة المخزون</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  عمليات التوريد، الصرف، والبحث في المخزون
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* التقارير */}
          <Link href="/reports">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <TrendingUp className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>التقارير اليومية</CardTitle>
                    <CardDescription>تقارير الحركة</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  إيرادات، مصروفات، أرصدة، وتقارير يومية
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* المبيعات */}
          <Link href="/sales">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <ShoppingCart className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>المبيعات</CardTitle>
                    <CardDescription>طلبات وتحليلات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  إنشاء طلبات، تحليل أرباح، مقارنة فروع
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* المشتريات */}
          <Link href="/purchases">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <ShoppingBag className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>المشتريات</CardTitle>
                    <CardDescription>أوامر وموردين</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  أوامر شراء، تقييم موردين، تنبيهات أسعار
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الصيانة */}
          <Link href="/maintenance">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Wrench className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الصيانة</CardTitle>
                    <CardDescription>أوامر وقطع غيار</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  أوامر شغل، تكلفة صيانة، قطع غيار
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الأسطول */}
          <Link href="/fleet">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Truck className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الأسطول GPS</CardTitle>
                    <CardDescription>تتبع ومسارات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  تتبع سيارات، مسارات، تقييم سائقين
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* المالية */}
          <Link href="/finance">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <CreditCard className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>المالية</CardTitle>
                    <CardDescription>خزينة ومقبوضات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  خزينة، مقبوضات، مدفوعات، تسويات
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* التحليلات */}
          <Link href="/analytics">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <LineChart className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>التحليلات</CardTitle>
                    <CardDescription>مؤشرات وقرارات</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  مؤشرات تشغيل، قرارات استثمار
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* WhatsApp */}
          <Link href="/whatsapp">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full animate-pulse-glow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <MessageSquare className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>WhatsApp</CardTitle>
                    <CardDescription>الربط والأوامر</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  الاتصال، الأوامر النصية، والتقارير التلقائية
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* الإعدادات */}
          <Link href="/settings">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg neon-green-bg">
                    <Settings className="h-6 w-6 neon-green" />
                  </div>
                  <div>
                    <CardTitle>الإعدادات</CardTitle>
                    <CardDescription>إعدادات النظام</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  رقم المدير، اسم الجروب، والإعدادات العامة
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* AI Agent */}
          <Link href="/agent">
            <Card className="glass hover:glass-strong transition-all cursor-pointer h-full border-2 border-green-500/30">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-green-600 to-emerald-600">
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      الوكيل الذكي
                      <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">NEW</span>
                    </CardTitle>
                    <CardDescription>مزامنة تلقائية</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  سحب ومزامنة البيانات تلقائياً من المواقع الخارجية
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
