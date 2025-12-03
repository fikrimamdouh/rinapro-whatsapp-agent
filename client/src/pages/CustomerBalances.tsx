import { useState, useRef } from "react";
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
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseExcelFile,
  generateExcelFile,
  CUSTOMER_BALANCE_COLUMNS,
  formatCurrency,
} from "@/lib/excel";

export default function CustomerBalances() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: customerBalances, isLoading } = trpc.customerBalances.list.useQuery();
  const { data: searchResults } = trpc.customerBalances.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const importMutation = trpc.customerBalances.importFromExcel.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.successCount} من ${result.totalCount} سجل`);
      utils.customerBalances.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل الاستيراد: ${error.message}`);
    },
  });

  const deleteAllMutation = trpc.customerBalances.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("تم حذف جميع البيانات بنجاح");
      setIsDeleteAllDialogOpen(false);
      utils.customerBalances.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel صالح");
      return;
    }

    setIsImporting(true);
    try {
      const data = await parseExcelFile<{
        customerCode: string | number;
        customerName?: string;
        previousBalance?: number;
        debit?: number;
        credit?: number;
        currentBalance?: number;
      }>(file, CUSTOMER_BALANCE_COLUMNS, { headerRowIndex: 2 });
      
      if (data.length === 0) {
        toast.error("الملف لا يحتوي على بيانات صالحة");
        return;
      }
      await importMutation.mutateAsync({ data });
    } catch (error) {
      console.error("Import error:", error);
      toast.error("فشل قراءة الملف");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportExcel = () => {
    const balancesArray = Array.isArray(customerBalances) ? customerBalances : [];
    if (balancesArray.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const exportData = balancesArray.map(b => ({
      customerCode: b.customerCode,
      customerName: b.customerName,
      previousBalance: (b.previousBalance || 0) / 100,
      debit: (b.debit || 0) / 100,
      credit: (b.credit || 0) / 100,
      currentBalance: (b.currentBalance || 0) / 100,
    }));
    generateExcelFile(exportData, CUSTOMER_BALANCE_COLUMNS, "أرصدة_العملاء");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const balancesArray = Array.isArray(customerBalances) ? customerBalances : [];
  const displayBalances = searchQuery.length > 0 ? (Array.isArray(searchResults) ? searchResults : []) : balancesArray;

  const totalDebit = balancesArray.reduce((sum, b) => sum + (b.debit || 0), 0) / 100;
  const totalCredit = balancesArray.reduce((sum, b) => sum + (b.credit || 0), 0) / 100;
  const totalBalance = balancesArray.reduce((sum, b) => sum + (b.currentBalance || 0), 0) / 100;

  const formatAmount = (amount: number) => {
    const val = (amount || 0) / 100;
    return val.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0) return "text-red-500 font-semibold";
    if (balance < 0) return "text-green-500 font-semibold";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">أرصدة العملاء</h1>
            <p className="text-muted-foreground">عرض وإدارة أرصدة العملاء مع الحركات</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />

        <div className="mb-6 flex flex-wrap gap-3">
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isImporting ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="ml-2 h-4 w-4" />
            )}
            رفع ملف Excel
          </Button>

          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="border-[#00ff88]/30"
          >
            <Download className="ml-2 h-4 w-4" />
            تصدير Excel
          </Button>

          <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الكل
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle className="text-red-500">تأكيد الحذف</DialogTitle>
                <DialogDescription>
                  هل أنت متأكد من حذف جميع أرصدة العملاء؟ هذا الإجراء لا يمكن التراجع عنه.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteAllMutation.mutate()}
                  disabled={deleteAllMutation.isPending}
                >
                  {deleteAllMutation.isPending ? "جاري الحذف..." : "حذف الكل"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong border-[#00ff88]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                  <p className="text-2xl font-bold text-[#00ff88]">{balancesArray.length}</p>
                </div>
                <Users className="h-8 w-8 text-[#00ff88]/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                  <p className="text-2xl font-bold text-red-500">{totalDebit.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                  <p className="text-2xl font-bold text-green-500">{totalCredit.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                  <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(totalBalance).toLocaleString("ar-SA")} ر.س
                    {totalBalance > 0 ? ' (مدين)' : totalBalance < 0 ? ' (دائن)' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-strong border-[#00ff88]/20 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن عميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-[#0a0f1a] border-[#00ff88]/30"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-[#00ff88]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00ff88]" />
              قائمة أرصدة العملاء ({displayBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
              </div>
            ) : displayBalances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات. قم برفع ملف Excel للبدء.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#00ff88]/20">
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">ما قبله</TableHead>
                      <TableHead className="text-right text-red-400">مدين</TableHead>
                      <TableHead className="text-right text-green-400">دائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBalances.map((balance) => (
                      <TableRow key={balance.id} className="border-[#00ff88]/10 hover:bg-[#00ff88]/5">
                        <TableCell className="font-mono">{balance.customerCode}</TableCell>
                        <TableCell className="font-semibold">{balance.customerName}</TableCell>
                        <TableCell className={getBalanceClass(balance.previousBalance || 0)}>
                          {formatAmount(balance.previousBalance || 0)}
                        </TableCell>
                        <TableCell className="text-red-500 font-medium">
                          {formatAmount(balance.debit || 0)}
                        </TableCell>
                        <TableCell className="text-green-500 font-medium">
                          {formatAmount(balance.credit || 0)}
                        </TableCell>
                        <TableCell className={getBalanceClass(balance.currentBalance || 0)}>
                          {formatAmount(balance.currentBalance || 0)}
                          {(balance.currentBalance || 0) > 0 && <span className="text-xs mr-1">(مدين)</span>}
                          {(balance.currentBalance || 0) < 0 && <span className="text-xs mr-1">(دائن)</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
