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
import { Calendar, Plus, Search, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function Installments() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    invoiceId: "",
    customerId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    notes: "",
  });

  // Queries
  const { data: installments, isLoading, refetch } = trpc.installments.list.useQuery();
  const { data: invoices } = trpc.invoices.list.useQuery();
  const { data: customers } = trpc.customers.list.useQuery();
  const { data: overdueInstallments } = trpc.installments.getOverdue.useQuery();

  // Mutations
  const createMutation = trpc.installments.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القسط بنجاح");
      refetch();
      setIsAddDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل إضافة القسط: ${error.message}`);
    },
  });

  const updateMutation = trpc.installments.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث القسط بنجاح");
      refetch();
      setIsPayDialogOpen(false);
      setSelectedInstallment(null);
    },
    onError: (error) => {
      toast.error(`فشل تحديث القسط: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      invoiceId: "",
      customerId: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = Math.round(parseFloat(formData.amount) * 100);

    createMutation.mutate({
      invoiceId: parseInt(formData.invoiceId),
      customerId: parseInt(formData.customerId),
      amount,
      dueDate: new Date(formData.dueDate),
      notes: formData.notes || undefined,
    });
  };

  const handlePayInstallment = (installment: any) => {
    setSelectedInstallment(installment);
    setIsPayDialogOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!selectedInstallment) return;

    updateMutation.mutate({
      id: selectedInstallment.id,
      status: "paid",
      paidDate: new Date(),
    });
  };

  const installmentsArray = Array.isArray(installments) ? installments : [];
  const customersArray = Array.isArray(customers) ? customers : [];
  const invoicesArray = Array.isArray(invoices) ? invoices : [];

  const filteredInstallments = installmentsArray.filter((installment) => {
    const customer = customersArray.find((c) => c.id === installment.customerId);
    const customerName = customer?.name || "";
    const invoice = invoicesArray.find((inv) => inv.id === installment.invoiceId);
    const invoiceNumber = invoice?.invoiceNumber || "";
    return (
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getCustomerName = (customerId: number) => {
    return customersArray.find((c) => c.id === customerId)?.name || "غير معروف";
  };

  const getInvoiceNumber = (invoiceId: number) => {
    return invoicesArray.find((inv) => inv.id === invoiceId)?.invoiceNumber || "غير معروف";
  };

  const getStatusBadge = (status: string, dueDate: Date) => {
    const now = new Date();
    const due = new Date(dueDate);
    
    if (status === "paid") {
      return (
        <span className="px-2 py-1 rounded-md text-xs border bg-green-500/20 text-green-400 border-green-500/30 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          مدفوع
        </span>
      );
    } else if (status === "overdue" || (status === "pending" && due < now)) {
      return (
        <span className="px-2 py-1 rounded-md text-xs border bg-red-500/20 text-red-400 border-red-500/30 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          متأخر
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 rounded-md text-xs border bg-yellow-500/20 text-yellow-400 border-yellow-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          قيد الانتظار
        </span>
      );
    }
  };

  // حساب الإحصائيات
  const overdueArray = Array.isArray(overdueInstallments) ? overdueInstallments : [];
  const totalInstallments = installmentsArray.length;
  const paidInstallments = installmentsArray.filter((i) => i.status === "paid").length;
  const pendingInstallments = installmentsArray.filter((i) => i.status === "pending").length;
  const overdueCount = overdueArray.length;
  const totalAmount = installmentsArray.reduce((sum, inst) => sum + inst.amount, 0);
  const paidAmount =
    installmentsArray
      .filter((i) => i.status === "paid")
      .reduce((sum, inst) => sum + inst.amount, 0);
  const pendingAmount =
    installmentsArray
      .filter((i) => i.status === "pending")
      .reduce((sum, inst) => sum + inst.amount, 0);

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackToHome />
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Calendar className="w-8 h-8 text-[#00ff88]" />
              الأقساط والسندات
            </h1>
            <p className="text-gray-400 mt-1">إدارة الأقساط والمدفوعات</p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة قسط
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">إجمالي الأقساط</CardDescription>
              <CardTitle className="text-2xl text-white">{totalInstallments}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">مدفوع</CardDescription>
              <CardTitle className="text-2xl text-green-400">{paidInstallments}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">قيد الانتظار</CardDescription>
              <CardTitle className="text-2xl text-yellow-400">{pendingInstallments}</CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">متأخر</CardDescription>
              <CardTitle className="text-2xl text-red-400">{overdueCount}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Amount Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                {(paidAmount / 100).toLocaleString()} ريال
              </CardTitle>
            </CardHeader>
          </Card>
          <Card className="bg-[#0f1729]/50 border-[#00ff88]/20 backdrop-blur">
            <CardHeader className="pb-2">
              <CardDescription className="text-gray-400">المتبقي</CardDescription>
              <CardTitle className="text-2xl text-yellow-400">
                {(pendingAmount / 100).toLocaleString()} ريال
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
                placeholder="البحث عن قسط..."
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
            ) : filteredInstallments && filteredInstallments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="border-[#00ff88]/20 hover:bg-[#00ff88]/5">
                    <TableHead className="text-[#00ff88]">رقم الفاتورة</TableHead>
                    <TableHead className="text-[#00ff88]">العميل</TableHead>
                    <TableHead className="text-[#00ff88]">المبلغ</TableHead>
                    <TableHead className="text-[#00ff88]">تاريخ الاستحقاق</TableHead>
                    <TableHead className="text-[#00ff88]">تاريخ الدفع</TableHead>
                    <TableHead className="text-[#00ff88]">الحالة</TableHead>
                    <TableHead className="text-[#00ff88]">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInstallments.map((installment) => (
                    <TableRow
                      key={installment.id}
                      className="border-[#00ff88]/10 hover:bg-[#00ff88]/5"
                    >
                      <TableCell className="text-white font-mono">
                        {getInvoiceNumber(installment.invoiceId)}
                      </TableCell>
                      <TableCell className="text-white">
                        {getCustomerName(installment.customerId)}
                      </TableCell>
                      <TableCell className="text-white">
                        {(installment.amount / 100).toLocaleString()} ريال
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {new Date(installment.dueDate).toLocaleDateString("ar-SA")}
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {installment.paidDate
                          ? new Date(installment.paidDate).toLocaleDateString("ar-SA")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(installment.status, installment.dueDate)}
                      </TableCell>
                      <TableCell>
                        {installment.status !== "paid" && (
                          <Button
                            size="sm"
                            onClick={() => handlePayInstallment(installment)}
                            className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            دفع
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-gray-400">
                لا توجد أقساط. اضغط "إضافة قسط" للبدء.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="bg-[#0f1729] border-[#00ff88]/30 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#00ff88]">إضافة قسط جديد</DialogTitle>
              <DialogDescription className="text-gray-400">
                أدخل بيانات القسط الجديد
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceId" className="text-gray-300">
                    الفاتورة *
                  </Label>
                  <Select
                    value={formData.invoiceId}
                    onValueChange={(value) => {
                      const invoice = invoices?.find((inv) => inv.id === parseInt(value));
                      setFormData({
                        ...formData,
                        invoiceId: value,
                        customerId: invoice?.customerId.toString() || "",
                      });
                    }}
                    required
                  >
                    <SelectTrigger className="bg-[#0a0f1a] border-[#00ff88]/30 text-white">
                      <SelectValue placeholder="اختر فاتورة" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0f1729] border-[#00ff88]/30">
                      {invoices?.map((invoice) => (
                        <SelectItem
                          key={invoice.id}
                          value={invoice.id.toString()}
                          className="text-white"
                        >
                          {invoice.invoiceNumber} - {getCustomerName(invoice.customerId)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-gray-300">
                    المبلغ (ريال) *
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-gray-300">
                  تاريخ الاستحقاق *
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                  className="bg-[#0a0f1a] border-[#00ff88]/30 text-white"
                />
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

        {/* Pay Dialog */}
        <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
          <DialogContent className="bg-[#0f1729] border-[#00ff88]/30 text-white">
            <DialogHeader>
              <DialogTitle className="text-[#00ff88]">تأكيد الدفع</DialogTitle>
              <DialogDescription className="text-gray-400">
                هل أنت متأكد من دفع هذا القسط؟
              </DialogDescription>
            </DialogHeader>
            {selectedInstallment && (
              <div className="space-y-3 py-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">رقم الفاتورة:</span>
                  <span className="text-white font-mono">
                    {getInvoiceNumber(selectedInstallment.invoiceId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">العميل:</span>
                  <span className="text-white">
                    {getCustomerName(selectedInstallment.customerId)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">المبلغ:</span>
                  <span className="text-[#00ff88] font-bold">
                    {(selectedInstallment.amount / 100).toLocaleString()} ريال
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">تاريخ الاستحقاق:</span>
                  <span className="text-white">
                    {new Date(selectedInstallment.dueDate).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsPayDialogOpen(false)}
                className="border-[#00ff88]/30 text-white hover:bg-[#00ff88]/10"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleConfirmPayment}
                disabled={updateMutation.isPending}
                className="bg-[#00ff88] text-black hover:bg-[#00ff88]/90"
              >
                {updateMutation.isPending ? "جاري الدفع..." : "تأكيد الدفع"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
