import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  BarChart3,
  RefreshCw,
  Loader2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  AlertCircle,
} from "lucide-react";
import { Link } from "wouter";

export default function Analytics() {
  // جلب البيانات من جميع المصادر
  const { data: customerBalances, isLoading: loadingCustomers, refetch: refetchCustomers } = trpc.customerBalances.getAll.useQuery();
  const { data: accountBalances, isLoading: loadingAccounts, refetch: refetchAccounts } = trpc.accountBalances.getAll.useQuery();

  const isLoading = loadingCustomers || loadingAccounts;

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await Promise.all([refetchCustomers(), refetchAccounts()]);
    toast.success("تم تحديث البيانات بنجاح");
  };

  // حساب مؤشرات الأداء الرئيسية (KPIs)
  const totalCustomers = customerBalances?.length || 0;
  const totalCustomerDebit = customerBalances?.reduce((sum, c) => sum + (c.debit || 0), 0) || 0;
  const totalCustomerCredit = customerBalances?.reduce((sum, c) => sum + (c.credit || 0), 0) || 0;
  const totalCustomerBalance = customerBalances?.reduce((sum, c) => sum + (c.currentBalance || 0), 0) || 0;

  const totalAccounts = accountBalances?.length || 0;
  const totalAccountDebit = accountBalances?.reduce((sum, a) => sum + (a.debitBalance || 0), 0) || 0;
  const totalAccountCredit = accountBalances?.reduce((sum, a) => sum + (a.creditBalance || 0), 0) || 0;

  // حسابات مالية محددة
  const bankAccounts = accountBalances?.filter(a => a.accountCode.startsWith('101020')) || [];
  const totalBankBalance = bankAccounts.reduce((sum, a) => sum + ((a.debitBalance || 0) - (a.creditBalance || 0)), 0);

  const supplierAccounts = accountBalances?.filter(a => a.accountCode.startsWith('201')) || [];
  const totalSupplierBalance = supplierAccounts.reduce((sum, a) => sum + ((a.debitBalance || 0) - (a.creditBalance || 0)), 0);

  // العملاء المدينون والدائنون
  const debtorCustomers = customerBalances?.filter(c => (c.currentBalance || 0) > 0).length || 0;
  const creditorCustomers = customerBalances?.filter(c => (c.currentBalance || 0) < 0).length || 0;
  const zeroBalanceCustomers = customerBalances?.filter(c => Math.abs(c.currentBalance || 0) < 100).length || 0;

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return "0%";
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">التحليلات</h1>
            <p className="text-muted-foreground">مؤشرات الأداء والقرارات الاستثمارية</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>
            <Link href="/">
              <Button variant="outline">العودة للرئيسية</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* مؤشرات الأداء الرئيسية */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">مؤشرات الأداء الرئيسية (KPIs)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-strong border-blue-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-8 h-8 text-blue-400" />
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">إجمالي العملاء</p>
                    <p className="text-3xl font-bold">{totalCustomers}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      مدينون: {debtorCustomers} | دائنون: {creditorCustomers}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-green-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign className="w-8 h-8 text-green-400" />
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">رصيد العملاء</p>
                    <p className={`text-3xl font-bold ${totalCustomerBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(totalCustomerBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      المدين: {formatCurrency(totalCustomerDebit)}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-purple-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Package className="w-8 h-8 text-purple-400" />
                      <TrendingDown className="w-5 h-5 text-orange-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">رصيد الموردين</p>
                    <p className={`text-3xl font-bold ${totalSupplierBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(totalSupplierBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      عدد الموردين: {supplierAccounts.length}
                    </p>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-yellow-500/20">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <BarChart3 className="w-8 h-8 text-yellow-400" />
                      <TrendingUp className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">رصيد البنوك</p>
                    <p className={`text-3xl font-bold ${totalBankBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(totalBankBalance)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      عدد الحسابات: {bankAccounts.length}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* تحليل العملاء */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">تحليل العملاء</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="text-lg">توزيع العملاء</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">عملاء مدينون</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-blue-400">{debtorCustomers}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatPercentage(debtorCustomers, totalCustomers)})
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">عملاء دائنون</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-orange-400">{creditorCustomers}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatPercentage(creditorCustomers, totalCustomers)})
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">رصيد صفر</span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-green-400">{zeroBalanceCustomers}</span>
                          <span className="text-xs text-muted-foreground">
                            ({formatPercentage(zeroBalanceCustomers, totalCustomers)})
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-strong">
                  <CardHeader>
                    <CardTitle className="text-lg">المؤشرات المالية</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">إجمالي المدين</span>
                        <span className="text-lg font-bold text-blue-400">
                          {formatCurrency(totalCustomerDebit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">إجمالي الدائن</span>
                        <span className="text-lg font-bold text-orange-400">
                          {formatCurrency(totalCustomerCredit)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">صافي الرصيد</span>
                        <span className={`text-lg font-bold ${totalCustomerBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {formatCurrency(totalCustomerBalance)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-strong border-yellow-500/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-yellow-400" />
                      تنبيهات
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {debtorCustomers > totalCustomers * 0.7 && (
                        <p className="text-yellow-400">⚠️ نسبة العملاء المدينين مرتفعة ({formatPercentage(debtorCustomers, totalCustomers)})</p>
                      )}
                      {totalCustomerBalance < 0 && (
                        <p className="text-red-400">❌ رصيد العملاء سالب</p>
                      )}
                      {totalBankBalance < 1000000 && (
                        <p className="text-orange-400">⚠️ رصيد البنوك منخفض</p>
                      )}
                      {debtorCustomers <= totalCustomers * 0.7 && totalCustomerBalance >= 0 && totalBankBalance >= 1000000 && (
                        <p className="text-green-400">✅ جميع المؤشرات جيدة</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* روابط سريعة */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">روابط سريعة</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Link href="/customers">
                  <Card className="glass-strong hover:border-blue-500/50 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <Users className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                      <p className="font-semibold">العملاء</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/customer-balances">
                  <Card className="glass-strong hover:border-green-500/50 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <TrendingUp className="w-8 h-8 mx-auto mb-2 text-green-400" />
                      <p className="font-semibold">أرصدة العملاء</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/account-balances">
                  <Card className="glass-strong hover:border-purple-500/50 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <BarChart3 className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <p className="font-semibold">ميزان المراجعة</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/finance">
                  <Card className="glass-strong hover:border-yellow-500/50 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                      <p className="font-semibold">المالية</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
