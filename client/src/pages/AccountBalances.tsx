import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  BookOpen,
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
  ACCOUNT_BALANCE_COLUMNS,
} from "@/lib/excel";

export default function AccountBalances() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: accountBalances, isLoading } = trpc.accountBalances.list.useQuery();
  const { data: searchResults } = trpc.accountBalances.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const importMutation = trpc.accountBalances.importFromExcel.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.successCount} من ${result.totalCount} حساب`);
      utils.accountBalances.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل الاستيراد: ${error.message}`);
    },
  });

  const deleteAllMutation = trpc.accountBalances.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("تم حذف جميع البيانات بنجاح");
      setIsDeleteAllDialogOpen(false);
      utils.accountBalances.list.invalidate();
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
    const balancesArray = Array.isArray(accountBalances) ? accountBalances : [];
    if (balancesArray.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const exportData = balancesArray.map(b => ({
      accountCode: b.accountCode,
      accountName: b.accountName,
      openingDebitBalance: (b.openingDebitBalance || 0) / 100,
      openingCreditBalance: (b.openingCreditBalance || 0) / 100,
      debitMovement: (b.debitMovement || 0) / 100,
      creditMovement: (b.creditMovement || 0) / 100,
      debitBalance: (b.debitBalance || 0) / 100,
      creditBalance: (b.creditBalance || 0) / 100,
    }));
    generateExcelFile(exportData, ACCOUNT_BALANCE_COLUMNS, "أرصدة_الحسابات");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const balancesArray = Array.isArray(accountBalances) ? accountBalances : [];
  const displayBalances = searchQuery.length > 0 ? (Array.isArray(searchResults) ? searchResults : []) : balancesArray;

  const totalDebitBalance = balancesArray.reduce((sum, b) => sum + (b.debitBalance || 0), 0) / 100;
  const totalCreditBalance = balancesArray.reduce((sum, b) => sum + (b.creditBalance || 0), 0) / 100;
  const totalDebitMovement = balancesArray.reduce((sum, b) => sum + (b.debitMovement || 0), 0) / 100;
  const totalCreditMovement = balancesArray.reduce((sum, b) => sum + (b.creditMovement || 0), 0) / 100;

  const formatAmount = (amount: number) => {
    const val = (amount || 0) / 100;
    return val.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">أرصدة الحسابات</h1>
            <p className="text-muted-foreground">عرض وإدارة أرصدة الحسابات مع الحركات</p>
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
                  هل أنت متأكد من حذف جميع أرصدة الحسابات؟ هذا الإجراء لا يمكن التراجع عنه.
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
                  <p className="text-sm text-muted-foreground">عدد الحسابات</p>
                  <p className="text-2xl font-bold text-[#00ff88]">{balancesArray.length}</p>
                </div>
                <BookOpen className="h-8 w-8 text-[#00ff88]/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الرصيد المدين</p>
                  <p className="text-2xl font-bold text-red-500">{totalDebitBalance.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الرصيد الدائن</p>
                  <p className="text-2xl font-bold text-green-500">{totalCreditBalance.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">حركة المدين</p>
                  <p className="text-xl font-bold text-red-400">{totalDebitMovement.toLocaleString("ar-SA")} ر.س</p>
                  <p className="text-sm text-muted-foreground mt-1">حركة الدائن</p>
                  <p className="text-xl font-bold text-green-400">{totalCreditMovement.toLocaleString("ar-SA")} ر.س</p>
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
                placeholder="البحث عن حساب..."
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
              <BookOpen className="h-5 w-5 text-[#00ff88]" />
              قائمة أرصدة الحسابات ({displayBalances.length})
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
                      <TableHead className="text-right">رقم الحساب</TableHead>
                      <TableHead className="text-right">اسم الحساب</TableHead>
                      <TableHead className="text-right text-red-400">أول المدة مدين</TableHead>
                      <TableHead className="text-right text-green-400">أول المدة دائن</TableHead>
                      <TableHead className="text-right text-red-400">الحركة مدين</TableHead>
                      <TableHead className="text-right text-green-400">الحركة دائن</TableHead>
                      <TableHead className="text-right text-red-400">الرصيد مدين</TableHead>
                      <TableHead className="text-right text-green-400">الرصيد دائن</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBalances.map((balance) => (
                      <TableRow key={balance.id} className="border-[#00ff88]/10 hover:bg-[#00ff88]/5">
                        <TableCell className="font-mono">{balance.accountCode}</TableCell>
                        <TableCell className="font-semibold">{balance.accountName}</TableCell>
                        <TableCell className={(balance.openingDebitBalance || 0) > 0 ? "text-red-500 font-medium" : "text-gray-400"}>
                          {formatAmount(balance.openingDebitBalance || 0)}
                        </TableCell>
                        <TableCell className={(balance.openingCreditBalance || 0) > 0 ? "text-green-500 font-medium" : "text-gray-400"}>
                          {formatAmount(balance.openingCreditBalance || 0)}
                        </TableCell>
                        <TableCell className={(balance.debitMovement || 0) > 0 ? "text-red-500 font-medium" : "text-gray-400"}>
                          {formatAmount(balance.debitMovement || 0)}
                        </TableCell>
                        <TableCell className={(balance.creditMovement || 0) > 0 ? "text-green-500 font-medium" : "text-gray-400"}>
                          {formatAmount(balance.creditMovement || 0)}
                        </TableCell>
                        <TableCell className={(balance.debitBalance || 0) > 0 ? "text-red-500 font-bold" : "text-gray-400"}>
                          {formatAmount(balance.debitBalance || 0)}
                        </TableCell>
                        <TableCell className={(balance.creditBalance || 0) > 0 ? "text-green-500 font-bold" : "text-gray-400"}>
                          {formatAmount(balance.creditBalance || 0)}
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
