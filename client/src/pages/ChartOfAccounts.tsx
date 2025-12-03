import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Upload,
  Download,
  FileSpreadsheet,
  Loader2,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  parseExcelFile,
  generateExcelFile,
  generateExcelTemplate,
  ACCOUNT_COLUMNS,
} from "@/lib/excel";

const ACCOUNT_TYPES = [
  { value: "asset", label: "أصول" },
  { value: "liability", label: "خصوم" },
  { value: "equity", label: "حقوق ملكية" },
  { value: "revenue", label: "إيرادات" },
  { value: "expense", label: "مصروفات" },
];

export default function ChartOfAccounts() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newAccount, setNewAccount] = useState({
    code: "",
    name: "",
    type: "asset",
    parentId: undefined as number | undefined,
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.accounts.list.useQuery();

  const createMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الحساب بنجاح");
      setIsAddDialogOpen(false);
      setNewAccount({ code: "", name: "", type: "asset", parentId: undefined, notes: "" });
      utils.accounts.list.invalidate();
    },
    onError: (error) => toast.error(`فشل إضافة الحساب: ${error.message}`),
  });

  const updateMutation = trpc.accounts.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الحساب بنجاح");
      setIsEditDialogOpen(false);
      setEditingAccount(null);
      utils.accounts.list.invalidate();
    },
    onError: (error) => toast.error(`فشل تحديث الحساب: ${error.message}`),
  });

  const deleteMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الحساب بنجاح");
      utils.accounts.list.invalidate();
    },
    onError: (error) => toast.error(`فشل حذف الحساب: ${error.message}`),
  });

  const deleteAllMutation = trpc.accounts.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("تم حذف جميع الحسابات بنجاح");
      setIsDeleteAllDialogOpen(false);
      utils.accounts.list.invalidate();
    },
    onError: (error) => toast.error(`فشل حذف الحسابات: ${error.message}`),
  });

  const importMutation = trpc.accounts.importFromExcel.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.successCount} من ${result.totalCount} حساب`);
      utils.accounts.list.invalidate();
    },
    onError: (error) => toast.error(`فشل الاستيراد: ${error.message}`),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const data = await parseExcelFile<{ code: string; name: string; type?: string; parentId?: number }>(
        file,
        ACCOUNT_COLUMNS
      );
      if (data.length === 0) {
        toast.error("الملف لا يحتوي على بيانات صالحة");
        return;
      }
      await importMutation.mutateAsync({ data });
    } catch (error) {
      toast.error("فشل قراءة الملف");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleExportExcel = () => {
    if (!accounts || accounts.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    generateExcelFile(accounts, ACCOUNT_COLUMNS, "دليل_الحسابات");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const getTypeName = (type: string) => {
    return ACCOUNT_TYPES.find(t => t.value === type)?.label || type;
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">دليل الحسابات</h1>
            <p className="text-muted-foreground">إدارة شجرة الحسابات</p>
          </div>
          <Link href="/settings"><Button variant="outline">العودة للإعدادات</Button></Link>
        </div>

        <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileSelect} />

        <div className="mb-6 flex flex-wrap gap-3">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-green-bg"><Plus className="ml-2 h-4 w-4" />إضافة حساب</Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>إضافة حساب جديد</DialogTitle>
                <DialogDescription>أدخل بيانات الحساب الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>رمز الحساب *</Label>
                  <Input
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    className="glass"
                    placeholder="مثال: 1001"
                  />
                </div>
                <div>
                  <Label>اسم الحساب *</Label>
                  <Input
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="glass"
                    placeholder="اسم الحساب"
                  />
                </div>
                <div>
                  <Label>نوع الحساب</Label>
                  <Select value={newAccount.type} onValueChange={(value) => setNewAccount({ ...newAccount, type: value })}>
                    <SelectTrigger className="glass">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>الحساب الأب</Label>
                  <Select
                    value={newAccount.parentId?.toString() || "none"}
                    onValueChange={(value) => setNewAccount({ ...newAccount, parentId: value === "none" ? undefined : parseInt(value) })}
                  >
                    <SelectTrigger className="glass">
                      <SelectValue placeholder="بدون حساب أب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون حساب أب</SelectItem>
                      {accounts?.map(acc => (
                        <SelectItem key={acc.id} value={acc.id.toString()}>{acc.code} - {acc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>إلغاء</Button>
                <Button
                  onClick={() => createMutation.mutate(newAccount as any)}
                  disabled={createMutation.isPending}
                  className="neon-green-bg"
                >
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="neon-green-border" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
            {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
            استيراد Excel
          </Button>

          <Button variant="outline" onClick={() => generateExcelTemplate(ACCOUNT_COLUMNS, "قالب_الحسابات")}>
            <FileSpreadsheet className="ml-2 h-4 w-4" />تحميل القالب
          </Button>

          {accounts && accounts.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExportExcel}><Download className="ml-2 h-4 w-4" />تصدير Excel</Button>
              <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
                <DialogTrigger asChild><Button variant="destructive"><Trash2 className="ml-2 h-4 w-4" />حذف الكل</Button></DialogTrigger>
                <DialogContent className="glass-strong">
                  <DialogHeader>
                    <DialogTitle className="text-red-500">تأكيد حذف جميع الحسابات</DialogTitle>
                    <DialogDescription>هل أنت متأكد؟ هذا الإجراء لا يمكن التراجع عنه.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>إلغاء</Button>
                    <Button variant="destructive" onClick={() => deleteAllMutation.mutate()} disabled={deleteAllMutation.isPending}>
                      {deleteAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف الكل"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5 neon-green" />دليل الحسابات ({accounts?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin neon-green" /></div>
            ) : accounts && accounts.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-right">الرمز</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-mono">{account.code}</TableCell>
                        <TableCell className="font-medium">{account.name}</TableCell>
                        <TableCell>{getTypeName(account.type)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setEditingAccount({ ...account }); setIsEditDialogOpen(true); }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (confirm("هل أنت متأكد؟")) deleteMutation.mutate({ id: account.id }); }}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد حسابات بعد</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader><DialogTitle>تعديل الحساب</DialogTitle></DialogHeader>
            {editingAccount && (
              <div className="space-y-4">
                <div><Label>الرمز</Label><Input value={editingAccount.code || ""} onChange={(e) => setEditingAccount({ ...editingAccount, code: e.target.value })} className="glass" /></div>
                <div><Label>الاسم</Label><Input value={editingAccount.name || ""} onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })} className="glass" /></div>
                <div>
                  <Label>النوع</Label>
                  <Select value={editingAccount.type} onValueChange={(value) => setEditingAccount({ ...editingAccount, type: value })}>
                    <SelectTrigger className="glass"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_TYPES.map(type => (<SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
              <Button onClick={() => updateMutation.mutate(editingAccount)} disabled={updateMutation.isPending} className="neon-green-bg">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
