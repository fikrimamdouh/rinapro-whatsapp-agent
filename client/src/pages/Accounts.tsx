import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Wallet, Search, Upload, Download, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import { parseExcelFile, ACCOUNT_BALANCE_COLUMNS } from "@/lib/excel";

export default function Accounts() {
  const [searchTerm, setSearchTerm] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // جلب البيانات من قاعدة البيانات
  const { data: accountsData, isLoading, refetch } = trpc.accountBalances.list.useQuery();
  const importMutation = trpc.accountBalances.importFromExcel.useMutation();

  const accounts = Array.isArray(accountsData) ? accountsData : [];

  // تصفية الحسابات بناءً على البحث
  const filteredAccounts = accounts.filter((account) =>
    account.accountName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    account.accountCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // حساب الإجماليات
  const totalDebitBalance = accounts.reduce((sum, acc) => sum + (acc.debitBalance || 0), 0);
  const totalCreditBalance = accounts.reduce((sum, acc) => sum + (acc.creditBalance || 0), 0);
  const netBalance = totalDebitBalance - totalCreditBalance;

  // معالجة رفع الملف
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel صالح");
      return;
    }

    try {
      toast.info("جاري قراءة الملف...");

      const data = await parseExcelFile<{
        accountCode: string | number;
        accountName?: string;
        openingDebitBalance?: number;
        openingCreditBalance?: number;
        debitMovement?: number;
        creditMovement?: number;
        debitBalance?: number;
        creditBalance?: number;
      }>(file, ACCOUNT_BALANCE_COLUMNS, { headerRowIndex: 2 });

      if (data.length === 0) {
        toast.error("الملف لا يحتوي على بيانات صالحة");
        return;
      }

      toast.info("جاري استيراد الحسابات...");
      const result = await importMutation.mutateAsync({ data });

      toast.success(`تم استيراد ${result.successCount} من ${result.totalCount} حساب`);
      refetch();
    } catch (error: any) {
      toast.error(`فشل الاستيراد: ${error.message}`);
    }

    // إعادة تعيين input لتمكين رفع نفس الملف مرة أخرى
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // تصدير Excel
  const handleExport = () => {
    toast.info("ميزة التصدير قريباً");
  };

  // تنسيق الرقم (من هللة إلى ريال)
  const formatCurrency = (halalas: number) => {
    return (halalas / 100).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">الحسابات</h1>
            <p className="text-muted-foreground">عرض أرصدة الحسابات والتقارير المالية</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرصيد المدين</CardTitle>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">
                {formatCurrency(totalDebitBalance)} ر.س
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الرصيد الدائن</CardTitle>
              <TrendingDown className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">
                {formatCurrency(totalCreditBalance)} ر.س
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">صافي الرصيد</CardTitle>
              <Wallet className="h-5 w-5 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${netBalance >= 0 ? "text-green-500" : "text-red-500"}`}>
                {formatCurrency(Math.abs(netBalance))} ر.س
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {netBalance >= 0 ? "مدين" : "دائن"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="glass mb-6">
          <CardHeader>
            <CardTitle>إدارة الحسابات</CardTitle>
            <CardDescription>البحث واستيراد الحسابات من Excel</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="ابحث عن حساب (رقم أو اسم)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button 
                className="neon-green-bg"
                onClick={() => fileInputRef.current?.click()}
                disabled={importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    جاري الاستيراد...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    استيراد من Excel
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                تصدير Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle>قائمة الحسابات</CardTitle>
            <CardDescription>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري التحميل...
                </span>
              ) : (
                `عرض ${filteredAccounts.length} من ${accounts.length} حساب`
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">#</TableHead>
                    <TableHead className="text-right">رقم الحساب</TableHead>
                    <TableHead className="text-right">اسم الحساب</TableHead>
                    <TableHead className="text-right">الحركة المدينة</TableHead>
                    <TableHead className="text-right">الحركة الدائنة</TableHead>
                    <TableHead className="text-right">الرصيد المدين</TableHead>
                    <TableHead className="text-right">الرصيد الدائن</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-green-500" />
                      </TableCell>
                    </TableRow>
                  ) : filteredAccounts.length > 0 ? (
                    filteredAccounts.map((account, index) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.accountCode || "-"}
                        </TableCell>
                        <TableCell className="font-semibold">
                          {account.accountName || "-"}
                        </TableCell>
                        <TableCell className="text-blue-400">
                          {formatCurrency(account.debitMovement || 0)} ر.س
                        </TableCell>
                        <TableCell className="text-purple-400">
                          {formatCurrency(account.creditMovement || 0)} ر.س
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-green-500">
                            {formatCurrency(account.debitBalance || 0)} ر.س
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-red-500">
                            {formatCurrency(account.creditBalance || 0)} ر.س
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        {accounts.length === 0
                          ? "لا توجد حسابات. قم برفع ملف Excel لاستيراد الحسابات."
                          : "لا توجد حسابات مطابقة للبحث"}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
