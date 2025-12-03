import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import { FileText, Plus, Search, Upload, Download, Trash2, Edit } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Invoices() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    customerId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    totalAmount: "",
    paidAmount: "0",
    remainingAmount: "",
    status: "unpaid" as "paid" | "partial" | "unpaid",
    notes: "",
  });

  // Queries
  const { data: invoices, isLoading, refetch } = trpc.invoices.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();

  // Mutations
  const createMutation = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الفاتورة بنجاح");
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل إضافة الفاتورة: ${error.message}`);
    },
  });

  const updateMutation = trpc.invoices.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الفاتورة بنجاح");
      refetch();
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error) => {
      toast.error(`فشل تحديث الفاتورة: ${error.message}`);
    },
  });

  const deleteMutation = trpc.invoices.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الفاتورة بنجاح");
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل حذف الفاتورة: ${error.message}`);
    },
  });

  const importMutation = trpc.invoices.importFromExcel.useMutation({
    onSuccess: (result) => {
      toast.success(`تم استيراد ${result.successCount} فاتورة بنجاح`);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل الاستيراد: ${error.message}`);
    },
  });

  const downloadTemplateMutation = trpc.invoices.downloadTemplate.useQuery(undefined, {
    enabled: false,
  });

  const downloadTemplate = async () => {
    try {
      const result = await downloadTemplateMutation.refetch();
      if (!result.data) throw new Error("فشل تحميل القالب");
      const link = document.createElement("a");
      link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.data.fileBase64}`;
      link.download = result.data.filename;
      link.click();
      toast.success("تم تحميل القالب بنجاح");
    } catch (error: any) {
      toast.error(`فشل تحميل القالب: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      invoiceNumber: "",
      customerId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      totalAmount: "",
      paidAmount: "0",
      remainingAmount: "",
      status: "unpaid",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const totalAmount = Math.round(parseFloat(formData.totalAmount) * 100);
    const paidAmount = Math.round(parseFloat(formData.paidAmount) * 100);
    const remainingAmount = totalAmount - paidAmount;

    createMutation.mutate({
      invoiceNumber: formData.invoiceNumber,
      customerId: parseInt(formData.customerId),
      invoiceDate: new Date(formData.invoiceDate),
      totalAmount,
      paidAmount,
      remainingAmount,
      status: formData.status,
      notes: formData.notes || undefined,
    });
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const totalAmount = formData.totalAmount
      ? Math.round(parseFloat(formData.totalAmount) * 100)
      : undefined;
    const paidAmount = formData.paidAmount
      ? Math.round(parseFloat(formData.paidAmount) * 100)
      : undefined;
    const remainingAmount =
      totalAmount && paidAmount ? totalAmount - paidAmount : undefined;

    updateMutation.mutate({
      id: selectedInvoice.id,
      invoiceNumber: formData.invoiceNumber || undefined,
      customerId: formData.customerId ? parseInt(formData.customerId) : undefined,
      invoiceDate: formData.invoiceDate ? new Date(formData.invoiceDate) : undefined,
      totalAmount,
      paidAmount,
      remainingAmount,
      status: formData.status,
      notes: formData.notes || undefined,
    });
  };

  const handleEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setFormData({
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId.toString(),
      invoiceDate: new Date(invoice.invoiceDate).toISOString().split("T")[0],
      totalAmount: (invoice.totalAmount / 100).toString(),
      paidAmount: (invoice.paidAmount / 100).toString(),
      remainingAmount: (invoice.remainingAmount / 100).toString(),
      status: invoice.status,
      notes: invoice.notes || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الفاتورة؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result?.toString().split(",")[1];
      if (base64) {
        importMutation.mutate({ fileBase64: base64 });
      }
    };
    reader.readAsDataURL(file);
  };

  const invoicesArray = Array.isArray(invoices) ? invoices : [];
  const customersArray = Array.isArray(customers) ? customers : [];

  const filteredInvoices = invoicesArray.filter((invoice) => {
    const customer = customersArray.find((c) => c.id === invoice.customerId);
    const customerName = customer?.name || "";
    return (
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getCustomerName = (customerId: number) => {
    return customersArray.find((c) => c.id === customerId)?.name || "غير معروف";
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      paid: "bg-green-500/20 text-green-400 border-green-500/30",
      partial: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      unpaid: "bg-red-500/20 text-red-400 border-red-500/30",
    };
    const labels = {
      paid: "مدفوعة",
      partial: "مدفوعة جزئياً",
      unpaid: "غير مدفوعة",
    };
    return (
      <span
        className={`px-2 py-1 rounded-md text-xs border ${badges[status as keyof typeof badges]}`}
      >
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  // حساب الإحصائيات
  const totalInvoices = invoicesArray.length;
  const totalAmount = invoicesArray.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalPaid = invoicesArray.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalRemaining = invoicesArray.reduce((sum, inv) => sum + inv.remainingAmount, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackToHome />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <FileText className="w-8 h-8 text-[#00ff88]" />
              الفواتير
            </h1>
            <p className="text-gray-400 mt-1">إدارة الفواتير</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={downloadTemplate}
              variant="outline"
              className="border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10"
            >
              <Download className="w-4 h-4 mr-2" />
              تحميل قالب Excel
            </Button>
            <Button
              onClick={() => document.getElementById("file-upload")?.click()}
              variant="outline"
              className="border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/10"
            >
              <Upload className="w-4 h-4 mr-2" />
              رفع Excel
            </Button>
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileUpload}
            />
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              إضافة فاتورة
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">إجمالي الفواتير</CardDescription>
              <CardTitle className="text-2xl text-white">{totalInvoices}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">إجمالي المبالغ</CardDescription>
              <CardTitle className="text-2xl text-[#00ff88]">
                {(totalAmount / 100).toLocaleString()} ريال
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">المدفوع</CardDescription>
              <CardTitle className="text-2xl text-green-400">
                {(totalPaid / 100).toLocaleString()} ريال
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">المتبقي</CardDescription>
              <CardTitle className="text-2xl text-red-400">
                {(totalRemaining / 100).toLocaleString()} ريال
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search */}
        <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث عن فاتورة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-[#0a0f1a] border-[#00ff88]/30 text-white"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="text-center py-8 text-gray-400">جاري التحميل...</div>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#00ff88]/20 hover:bg-[#00ff88]/5">
                    <TableHead className="text-[#00ff88]">رقم الفاتورة</TableHead>
                    <TableHead className="text-[#00ff88]">العميل</TableHead>
                    <TableHead className="text-[#00ff88]">التاريخ</TableHead>
                    <TableHead className="text-[#00ff88]">المبلغ الإجمالي</TableHead>
                    <TableHead className="text-[#00ff88]">المدفوع</TableHead>
                    <TableHead className="text-[#00ff88]">المتبقي</TableHead>
                    <TableHead className="text-[#00ff88]">الحالة</TableHead>
                    <TableHead className="text-[#00ff88]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="border-[#00ff88]/10 hover:bg-[#00ff88]/5"
                    >
                      <TableCell className="text-white font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell className="text-white">
                        {getCustomerName(invoice.customerId)}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(invoice.invoiceDate).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell className="text-white">
                        {(invoice.totalAmount / 100).toLocaleString()} ريال
                      </TableCell>
                      <TableCell className="text-green-400">
                        {(invoice.paidAmount / 100).toLocaleString()} ريال
                      </TableCell>
                      <TableCell className="text-red-400">
                        {(invoice.remainingAmount / 100).toLocaleString()} ريال
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(invoice)}
                            className="text-[#00ff88] hover:bg-[#00ff88]/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                لا توجد فواتير. اضغط "إضافة فاتورة" للبدء.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="bg-[#0f1729] border-[#00ff88]/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#00ff88]">إضافة فاتورة جديدة</DialogTitle>
              <DialogDescription className="text-gray-400">
                أدخل بيانات الفاتورة الجديدة
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceNumber" className="text-gray-300">
                    رقم الفاتورة *
                  </Label>
                  <Input
                    id="invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                    required
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="customerId" className="text-gray-300">
                    العميل *
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    required
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#00ff88]/30 text-white">
                      <SelectValue placeholder="اختر عميل" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1729] border-[#00ff88]/30">
                      {customersArray.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                          className="text-white"
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate" className="text-gray-300">
                    تاريخ الفاتورة *
                  </Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceDate: e.target.value })
                    }
                    required
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-gray-300">
                    الحالة *
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                    required
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#00ff88]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1729] border-[#00ff88]/30">
                      <SelectItem value="unpaid" className="text-white">
                        غير مدفوعة
                      </SelectItem>
                      <SelectItem value="partial" className="text-white">
                        مدفوعة جزئياً
                      </SelectItem>
                      <SelectItem value="paid" className="text-white">
                        مدفوعة
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalAmount" className="text-gray-300">
                    المبلغ الإجمالي (ريال) *
                  </Label>
                  <Input
                    id="totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      const paid = parseFloat(formData.paidAmount) || 0;
                      setFormData({
                        ...formData,
                        totalAmount: e.target.value,
                        remainingAmount: (total - paid).toString(),
                      });
                    }}
                    required
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paidAmount" className="text-gray-300">
                    المبلغ المدفوع (ريال)
                  </Label>
                  <Input
                    id="paidAmount"
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => {
                      const total = parseFloat(formData.totalAmount) || 0;
                      const paid = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        paidAmount: e.target.value,
                        remainingAmount: (total - paid).toString(),
                      });
                    }}
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300">
                  ملاحظات
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#0a0f1a] border-[#00ff88]/30 text-white min-h-[80px]"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-[#00ff88]/30 text-white hover:bg-[#00ff88]/10"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
                >
                  {createMutation.isPending ? "جاري الإضافة..." : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#0f1729] border-[#00ff88]/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#00ff88]">تعديل الفاتورة</DialogTitle>
              <DialogDescription className="text-gray-400">
                تعديل بيانات الفاتورة
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-invoiceNumber" className="text-gray-300">
                    رقم الفاتورة
                  </Label>
                  <Input
                    id="edit-invoiceNumber"
                    value={formData.invoiceNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceNumber: e.target.value })
                    }
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-customerId" className="text-gray-300">
                    العميل
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#00ff88]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1729] border-[#00ff88]/30">
                      {customersArray.map((customer) => (
                        <SelectItem
                          key={customer.id}
                          value={customer.id.toString()}
                          className="text-white"
                        >
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-invoiceDate" className="text-gray-300">
                    تاريخ الفاتورة
                  </Label>
                  <Input
                    id="edit-invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) =>
                      setFormData({ ...formData, invoiceDate: e.target.value })
                    }
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-gray-300">
                    الحالة
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: any) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#00ff88]/30 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1729] border-[#00ff88]/30">
                      <SelectItem value="unpaid" className="text-white">
                        غير مدفوعة
                      </SelectItem>
                      <SelectItem value="partial" className="text-white">
                        مدفوعة جزئياً
                      </SelectItem>
                      <SelectItem value="paid" className="text-white">
                        مدفوعة
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-totalAmount" className="text-gray-300">
                    المبلغ الإجمالي (ريال)
                  </Label>
                  <Input
                    id="edit-totalAmount"
                    type="number"
                    step="0.01"
                    value={formData.totalAmount}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      const paid = parseFloat(formData.paidAmount) || 0;
                      setFormData({
                        ...formData,
                        totalAmount: e.target.value,
                        remainingAmount: (total - paid).toString(),
                      });
                    }}
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paidAmount" className="text-gray-300">
                    المبلغ المدفوع (ريال)
                  </Label>
                  <Input
                    id="edit-paidAmount"
                    type="number"
                    step="0.01"
                    value={formData.paidAmount}
                    onChange={(e) => {
                      const total = parseFloat(formData.totalAmount) || 0;
                      const paid = parseFloat(e.target.value) || 0;
                      setFormData({
                        ...formData,
                        paidAmount: e.target.value,
                        remainingAmount: (total - paid).toString(),
                      });
                    }}
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-notes" className="text-gray-300">
                  ملاحظات
                </Label>
                <Textarea
                  id="edit-notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-[#0a0f1a] border-[#00ff88]/30 text-white min-h-[80px]"
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  className="border-[#00ff88]/30 text-white hover:bg-[#00ff88]/10"
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
                >
                  {updateMutation.isPending ? "جاري التحديث..." : "تحديث"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
