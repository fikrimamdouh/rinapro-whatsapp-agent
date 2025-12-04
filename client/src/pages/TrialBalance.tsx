import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Scale,
  Search,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TrialBalance() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: customerBalances, isLoading: loadingCustomers, refetch: refetchCustomers } = trpc.customerBalances.getAll.useQuery();
  const { data: accountBalances, isLoading: loadingAccounts, refetch: refetchAccounts } = trpc.accountBalances.getAll.useQuery();

  const isLoading = loadingCustomers || loadingAccounts;

  const allAccounts = [
    ...(customerBalances?.map(c => ({
      code: c.customerCode,
      name: c.customerName,
      debit: c.debit || 0,
      credit: c.credit || 0,
      balance: c.currentBalance || 0,
      type: 'عميل' as const,
    })) || []),
    ...(accountBalances?.map(a => ({
      code: a.accountCode,
      name: a.accountName,
      debit: a.debitBalance || 0,
      credit: a.creditBalance || 0,
      balance: (a.debitBalance || 0) - (a.creditBalance || 0),
      type: a.accountCode.startsWith('1') ? 'أصول' : 
            a.accountCode.startsWith('2') ? 'خصوم' :
            a.accountCode.startsWith('3') ? 'حقوق ملكية' :
            a.accountCode.startsWith('4') ? 'إيرادات' :
            a.accountCode.startsWith('5') ? 'مصروفات' : 'أخرى' as const,
    })) || []),
  ];

  const filteredAccounts = allAccounts.filter(account => {
    const matchesSearch = searchQuery.length === 0 || 
      account.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.code?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || account.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await Promise.all([refetchCustomers(), refetchAccounts()]);
    toast.success("تم تحديث البيانات بنجاح");
  };

  const handleExport = () => {
    if (filteredAccounts.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    const headers = ["الكود", "الاسم", "النوع", "المدين", "الدائن", "الرصيد"];
    const rows = filteredAccounts.map(a => [
      a.code,
      a.name || '',
      a.type,
      (a.debit / 100).toFixed(2),
      (a.credit / 100).toFixed(2),
      (a.balance / 100).toFixed(2),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ميزان_المراجعة_\${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("تم تصدير البيانات بنجاح");
  };

  const totalDebit = filteredAccounts.reduce((sum, a) => sum + (a.debit || 0), 0);
  const totalCredit = filteredAccounts.reduce((sum, a) => sum + (a.credit || 0), 0);
  const totalBalance = filteredAccounts.reduce((sum, a) => sum + (a.balance || 0), 0);
  const totalAccounts = filteredAccounts.length;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-green mb-2">ميزان المراجعة</h1>
          <p className="text-muted-foreground">عرض شامل لجميع الحسابات والأرصدة</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الحسابات</p>
                  <p className="text-2xl font-bold">{totalAccounts}</p>
                </div>
                <Scale className="w-10 h-10 text-blue-400" />
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
                  <p className="text-sm text-muted-foreground mb-1">الفرق</p>
                  <p className={`text-2xl font-bold \${Math.abs(totalDebit - totalCredit) < 100 ? 'text-green-400' : 'text-red-400'}`}>
                    {formatCurrency(Math.abs(totalDebit - totalCredit))}
                  </p>
                </div>
                <Scale className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-blue-500/30 hover:bg-blue-500/10"
          >
            <RefreshCw className={`ml-2 h-4 w-4 \${isLoading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </Button>

          <Button variant="outline" onClick={handleExport}>
            <Download className="ml-2 h-4 w-4" />
            تصدير CSV
          </Button>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px] glass">
              <SelectValue placeholder="نوع الحساب" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الحسابات</SelectItem>
              <SelectItem value="عميل">العملاء</SelectItem>
              <SelectItem value="أصول">الأصول</SelectItem>
              <SelectItem value="خصوم">الخصوم</SelectItem>
              <SelectItem value="حقوق ملكية">حقوق الملكية</SelectItem>
              <SelectItem value="إيرادات">الإيرادات</SelectItem>
              <SelectItem value="مصروفات">المصروفات</SelectItem>
            </SelectContent>
          </Select>

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
              <Scale className="h-5 w-5" />
              ميزان المراجعة ({filteredAccounts.length})
            </CardTitle>
            <CardDescription>
              عرض شامل لجميع الحسابات من العملاء وميزان الحسابات
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredAccounts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">المدين</TableHead>
                      <TableHead className="text-right">الدائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account, index) => (
                      <TableRow key={`\${account.code}-\${index}`}>
                        <TableCell className="font-mono text-sm">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs \${
                            account.type === 'عميل' ? 'bg-blue-500/20 text-blue-400' :
                            account.type === 'أصول' ? 'bg-green-500/20 text-green-400' :
                            account.type === 'خصوم' ? 'bg-red-500/20 text-red-400' :
                            account.type === 'إيرادات' ? 'bg-purple-500/20 text-purple-400' :
                            account.type === 'مصروفات' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {account.type}
                          </span>
                        </TableCell>
                        <TableCell className="text-blue-500">{formatCurrency(account.debit)}</TableCell>
                        <TableCell className="text-orange-500">{formatCurrency(account.credit)}</TableCell>
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
                {searchQuery || filterType !== 'all' ? "لا توجد نتائج للبحث" : "لا توجد بيانات."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
