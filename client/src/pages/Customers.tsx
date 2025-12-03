import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Users,
  Plus,
  Search,
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
  parseExcelFile,
  generateExcelFile,
  generateExcelTemplate,
  CUSTOMER_COLUMNS,
} from "@/lib/excel";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: customers, isLoading } = trpc.customers.list.useQuery();
  const { data: searchResults } = trpc.customers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة العميل بنجاح");
      setIsAddDialogOpen(false);
      setNewCustomer({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل إضافة العميل: ${error.message}`);
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث العميل بنجاح");
      setIsEditDialogOpen(false);
      setEditingCustomer(null);
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل تحديث العميل: ${error.message}`);
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف العميل بنجاح");
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف العميل: ${error.message}`);
    },
  });

  const deleteAllMutation = trpc.customers.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("تم حذف جميع العملاء بنجاح");
      setIsDeleteAllDialogOpen(false);
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف العملاء: ${error.message}`);
    },
  });

  const importMutation = trpc.customers.importFromExcel.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.successCount} من ${result.totalCount} عميل`);
      utils.customers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل الاستيراد: ${error.message}`);
    },
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) {
      toast.error("الرجاء إدخال اسم العميل");
      return;
    }
    createMutation.mutate(newCustomer);
  };

  const handleEditCustomer = () => {
    if (!editingCustomer?.name?.trim()) {
      toast.error("الرجاء إدخال اسم العميل");
      return;
    }
    updateMutation.mutate(editingCustomer);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا العميل؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel صالح");
      return;
    }

    setIsImporting(true);
    try {
      const data = await parseExcelFile<{ name: string; phone?: string; email?: string; address?: string; city?: string }>(
        file,
        CUSTOMER_COLUMNS
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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportExcel = () => {
    if (!customers || customers.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    generateExcelFile(customers, CUSTOMER_COLUMNS, "العملاء");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleDownloadTemplate = () => {
    generateExcelTemplate(CUSTOMER_COLUMNS, "قالب_العملاء");
    toast.success("تم تحميل القالب");
  };

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const displayCustomers = searchQuery.length > 0 ? searchResults : customers;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">العملاء</h1>
            <p className="text-muted-foreground">إدارة بيانات العملاء</p>
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
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-green-bg">
                <Plus className="ml-2 h-4 w-4" />
                إضافة عميل
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>إضافة عميل جديد</DialogTitle>
                <DialogDescription>أدخل بيانات العميل الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    className="glass"
                    placeholder="اسم العميل"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">الهاتف</Label>
                  <Input
                    id="phone"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="glass"
                    placeholder="رقم الهاتف"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="glass"
                    placeholder="البريد الإلكتروني"
                  />
                </div>
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    className="glass"
                    placeholder="المدينة"
                  />
                </div>
                <div>
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                    className="glass"
                    placeholder="العنوان"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddCustomer} disabled={createMutation.isPending} className="neon-green-bg">
                  {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "إضافة"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="neon-green-border"
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
          >
            {isImporting ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Upload className="ml-2 h-4 w-4" />}
            استيراد Excel
          </Button>

          <Button variant="outline" onClick={handleDownloadTemplate}>
            <FileSpreadsheet className="ml-2 h-4 w-4" />
            تحميل القالب
          </Button>

          {customers && customers.length > 0 && (
            <>
              <Button variant="outline" onClick={handleExportExcel}>
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
                    <DialogTitle className="text-red-500">تأكيد حذف جميع العملاء</DialogTitle>
                    <DialogDescription>
                      هل أنت متأكد من حذف جميع العملاء؟ هذا الإجراء لا يمكن التراجع عنه.
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
                      {deleteAllMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حذف الكل"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )}

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن عميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass pr-10"
              />
            </div>
          </div>
        </div>

        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 neon-green" />
              قائمة العملاء ({displayCustomers?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin neon-green" />
              </div>
            ) : displayCustomers && displayCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">المدينة</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell>{customer.city || "-"}</TableCell>
                        <TableCell className={customer.balance < 0 ? "text-red-500" : "text-green-500"}>
                          {formatCurrency(customer.balance)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingCustomer({ ...customer });
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCustomer(customer.id)}
                              disabled={deleteMutation.isPending}
                            >
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
              <p className="text-center text-muted-foreground py-8">
                لا توجد عملاء بعد
              </p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="glass-strong">
            <DialogHeader>
              <DialogTitle>تعديل العميل</DialogTitle>
            </DialogHeader>
            {editingCustomer && (
              <div className="space-y-4">
                <div>
                  <Label>الاسم</Label>
                  <Input
                    value={editingCustomer.name || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>الهاتف</Label>
                  <Input
                    value={editingCustomer.phone || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>البريد</Label>
                  <Input
                    value={editingCustomer.email || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>المدينة</Label>
                  <Input
                    value={editingCustomer.city || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, city: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label>العنوان</Label>
                  <Input
                    value={editingCustomer.address || ""}
                    onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                    className="glass"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>إلغاء</Button>
              <Button onClick={handleEditCustomer} disabled={updateMutation.isPending} className="neon-green-bg">
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "حفظ"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
