import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  CreditCard,
  Search,
  RefreshCw,
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Finance() {
  const [searchQuery, setSearchQuery] = useState("");

  // جلب بيانات الحسابات المالية من ميزان الحسابات
  const { data: accountBalances, isLoading, refetch } = trpc.accountBalances.getAll.useQuery();
  
  // تصفية الحسابات المالية (البنوك، الخزينة، المقبوضات، المدفوعات)
  const financeAccounts = accountBalances?.filter(account => 
    account.accountCode.startsWith('101020') || // البنوك
    account.accountCode.startsWith('101010') || // الخزينة
    account.accountCode.startsWith('101030') || // المقبوضات
    account.accountCode.startsWith('201040') || // المدفوعات المستحقة
    account.accountName?.includes('خزينة') ||
    account.accountName?.includes('بنك') ||
    account.accountName?.includes('نقدية')
  ).map(account => ({
    id: account.id,
    code: account.accountCode,
    name: account.accountName,
    debitBalance: account.debitBalance || 0,
    creditBalance: account.creditBalance || 0,
    balance: (account.debitBalance || 0) - (account.creditBalance || 0),
    type: account.accountCode.startsWith('1010') ? 'خزينة' : 
          account.accountCode.startsWith('1020') ? 'بنك' : 'أخرى',
  })) || [];

  // البحث
  const displayAccounts = searchQuery.length > 0 
    ? financeAccounts.filter(a => 
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : financeAccounts;

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح");
  };

  // حساب الإحصائيات
  const totalAccounts = financeAccounts.length;
  const totalDebit = financeAccounts.reduce((sum, a) => sum + (a.debitBalance || 0), 0);
  const totalCredit = financeAccounts.reduce((sum, a) => sum + (a.creditBalance || 0), 0);
  const totalBalance = financeAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">المالية</h1>
            <p className="text-muted-foreground">خزينة ومقبوضات ومدفوعات</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الحسابات</p>
                  <p className="text-2xl font-bold">{totalAccounts}</p>
                </div>
                <Wallet className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي المدين</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalDebit)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الدائن</p>
                  <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalCredit)}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الرصيد الإجمالي</p>
                  <p className={`text-2xl font-bold ${totalBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <DollarSign className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-green-500/10 border-green-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-green-300">
              💰 البيانات معروضة من <strong>ميزان المراجعة</strong> (حسابات البنوك والخزينة). لتحديث البيانات، قم برفع ملف ميزان المراجعة جديد.
            </p>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/account-balances">
            <Button className="neon-green-bg">
              <CreditCard className="ml-2 h-4 w-4" />
              رفع ميزان المراجعة
            </Button>
          </Link>

          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-blue-500/30 hover:bg-blue-500/10"
          >
            <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>

          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 glass"
              />
            </div>
          </div>
        </div>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              الحسابات المالية ({displayAccounts.length})
            </CardTitle>
            <CardDescription>
              عرض جميع الحسابات المالية من ميزان المراجعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">كود الحساب</TableHead>
                      <TableHead className="text-right">اسم الحساب</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المدين</TableHead>
                      <TableHead className="text-right">الدائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono text-sm">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            account.type === 'بنك' 
                              ? 'bg-blue-500/20 text-blue-400' 
                              : account.type === 'خزينة'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}>
                            {account.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-blue-500">{formatCurrency(account.debitBalance)}</TableCell>
                        <TableCell className="text-orange-500">{formatCurrency(account.creditBalance)}</TableCell>
                        <TableCell className={account.balance < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          {formatCurrency(account.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد بيانات. قم برفع ملف ميزان المراجعة أولاً."}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Future Features */}
        <Card className="mt-6 glass-strong border-yellow-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-400">
              <Loader2 className="h-5 w-5 animate-spin" />
              ميزات قادمة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>إدارة المقبوضات والمدفوعات</li>
              <li>تسويات بنكية تلقائية</li>
              <li>تقارير التدفق النقدي</li>
              <li>تنبيهات الشيكات المستحقة</li>
              <li>ربط مع البنوك API</li>
              <li>تقارير الخزينة اليومية</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
