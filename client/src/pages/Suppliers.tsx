import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Users,
  Search,
  Upload,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
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

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");

  // جلب البيانات من ميزان الحسابات (الموردين = حسابات تبدأ بـ 201)
  const { data: accountBalances, isLoading, refetch } = trpc.accountBalances.getAll.useQuery();
  
  // تصفية الموردين
  const suppliers = accountBalances?.filter(account => 
    account.accountCode.startsWith('201')
  ).map(account => ({
    id: account.id,
    code: account.accountCode,
    name: account.accountName,
    debitBalance: account.debitBalance || 0,
    creditBalance: account.creditBalance || 0,
    balance: (account.debitBalance || 0) - (account.creditBalance || 0),
  })) || [];

  // البحث
  const displaySuppliers = searchQuery.length > 0 
    ? suppliers.filter(s => 
        s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suppliers;

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح");
  };

  const handleExport = () => {
    if (!suppliers || suppliers.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    const headers = ["كود الحساب", "اسم المورد", "المدين", "الدائن", "الرصيد"];
    const rows = suppliers.map(s => [
      s.code,
      s.name || '',
      (s.debitBalance / 100).toFixed(2),
      (s.creditBalance / 100).toFixed(2),
      (s.balance / 100).toFixed(2),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `الموردين_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("تم تصدير البيانات بنجاح");
  };

  // حساب الإحصائيات
  const totalSuppliers = suppliers.length;
  const totalDebit = suppliers.reduce((sum, s) => sum + (s.debitBalance || 0), 0);
  const totalCredit = suppliers.reduce((sum, s) => sum + (s.creditBalance || 0), 0);
  const totalBalance = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">الموردين</h1>
            <p className="text-muted-foreground">إدارة بيانات الموردين من ميزان المراجعة</p>
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
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الموردين</p>
                  <p className="text-2xl font-bold">{totalSuppliers}</p>
                </div>
                <Package className="w-10 h-10 text-purple-400" />
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
                <Users className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-purple-500/10 border-purple-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-purple-300">
              📦 البيانات معروضة من <strong>ميزان المراجعة</strong> (الحسابات التي تبدأ بـ 201). لتحديث البيانات، قم برفع ملف ميزان المراجعة جديد.
            </p>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/account-balances">
            <Button className="neon-green-bg">
              <Upload className="ml-2 h-4 w-4" />
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

          <Button variant="outline" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير CSV
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
              <Package className="h-5 w-5" />
              قائمة الموردين ({displaySuppliers.length})
            </CardTitle>
            <CardDescription>
              عرض جميع الموردين من ميزان المراجعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displaySuppliers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">كود الحساب</TableHead>
                      <TableHead className="text-right">اسم المورد</TableHead>
                      <TableHead className="text-right">المدين</TableHead>
                      <TableHead className="text-right">الدائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displaySuppliers.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-mono text-sm">{supplier.code}</TableCell>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell className="text-blue-500">{formatCurrency(supplier.debitBalance)}</TableCell>
                        <TableCell className="text-orange-500">{formatCurrency(supplier.creditBalance)}</TableCell>
                        <TableCell className={supplier.balance < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          {formatCurrency(supplier.balance)}
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
      </div>
    </div>
  );
}
