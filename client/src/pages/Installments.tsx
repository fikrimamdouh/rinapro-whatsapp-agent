import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Calendar,
  DollarSign,
  FileText,
  Upload,
  Plus,
  Search,
  Download,
  User,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";

export default function Installments() {
  const [activeTab, setActiveTab] = useState("installments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddInstallmentOpen, setIsAddInstallmentOpen] = useState(false);
  const [isAddBondOpen, setIsAddBondOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [installmentForm, setInstallmentForm] = useState({
    customerCode: "",
    customerName: "",
    customerPhone: "",
    totalAmount: "",
    installmentAmount: "",
    dueDate: "",
    notes: "",
  });

  const [bondForm, setBondForm] = useState({
    bondType: "receipt",
    customerCode: "",
    customerName: "",
    amount: "",
    bondDate: "",
    description: "",
    paymentMethod: "cash",
    referenceNumber: "",
    notes: "",
  });

  // Queries
  const { data: installments, refetch: refetchInstallments } =
    trpc.installmentsBonds.getInstallments.useQuery();
  const { data: bonds, refetch: refetchBonds } =
    trpc.installmentsBonds.getBonds.useQuery();
  const { data: stats } = trpc.installmentsBonds.getStats.useQuery();

  // Mutations
  const createInstallment = trpc.installmentsBonds.createInstallment.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة القسط بنجاح");
      refetchInstallments();
      setIsAddInstallmentOpen(false);
      resetInstallmentForm();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const createBond = trpc.installmentsBonds.createBond.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة السند بنجاح");
      refetchBonds();
      setIsAddBondOpen(false);
      resetBondForm();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const uploadExcel = trpc.installmentsBonds.uploadExcel.useMutation({
    onSuccess: (data) => {
      toast.success(`تم رفع ${data.count} قسط بنجاح`);
      refetchInstallments();
    },
    onError: (error) => {
      toast.error(`خطأ في رفع الملف: ${error.message}`);
    },
  });

  const uploadPDF = trpc.installmentsBonds.uploadPDF.useMutation({
    onSuccess: (data) => {
      toast.success(`تم رفع السند بنجاح`);
      refetchBonds();
    },
    onError: (error) => {
      toast.error(`خطأ في رفع الملف: ${error.message}`);
    },
  });

  const markAsPaid = trpc.installmentsBonds.markInstallmentPaid.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل السداد");
      refetchInstallments();
    },
  });

  const resetInstallmentForm = () => {
    setInstallmentForm({
      customerCode: "",
      customerName: "",
      customerPhone: "",
      totalAmount: "",
      installmentAmount: "",
      dueDate: "",
      notes: "",
    });
  };

  const resetBondForm = () => {
    setBondForm({
      bondType: "receipt",
      customerCode: "",
      customerName: "",
      amount: "",
      bondDate: "",
      description: "",
      paymentMethod: "cash",
      referenceNumber: "",
      notes: "",
    });
  };

  const handleInstallmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInstallment.mutate({
      customerCode: installmentForm.customerCode,
      customerName: installmentForm.customerName,
      customerPhone: installmentForm.customerPhone,
      totalAmount: Math.round(parseFloat(installmentForm.totalAmount) * 100),
      installmentAmount: Math.round(parseFloat(installmentForm.installmentAmount) * 100),
      dueDate: installmentForm.dueDate,
      notes: installmentForm.notes,
    });
  };

  const handleBondSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBond.mutate({
      bondType: bondForm.bondType,
      customerCode: bondForm.customerCode,
      customerName: bondForm.customerName,
      amount: Math.round(parseFloat(bondForm.amount) * 100),
      bondDate: bondForm.bondDate,
      description: bondForm.description,
      paymentMethod: bondForm.paymentMethod,
      referenceNumber: bondForm.referenceNumber,
      notes: bondForm.notes,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "excel" | "pdf") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (type === "excel") {
        uploadExcel.mutate({ fileData: base64, filename: file.name });
      } else {
        uploadPDF.mutate({ fileData: base64, filename: file.name });
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredInstallments = installments?.filter((inst) => {
    const matchesSearch =
      inst.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.installmentNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inst.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredBonds = bonds?.filter((bond) => {
    const matchesSearch =
      bond.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bond.bondNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "paid":
        return "مدفوع";
      case "pending":
        return "قيد الانتظار";
      case "overdue":
        return "متأخر";
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Calendar className="h-10 w-10 text-primary" />
            الأقساط والسندات
          </h1>
          <p className="text-muted-foreground">
            إدارة أقساط العملاء والسندات المالية - مستقلة عن الفواتير
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الأقساط</p>
                  <p className="text-2xl font-bold">{stats?.totalInstallments || 0}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">المبلغ المستحق</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {((stats?.totalDue || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">تم السداد</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((stats?.totalPaid || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي السندات</p>
                  <p className="text-2xl font-bold">{stats?.totalBonds || 0}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="installments">الأقساط</TabsTrigger>
            <TabsTrigger value="bonds">السندات</TabsTrigger>
          </TabsList>

          {/* Installments Tab */}
          <TabsContent value="installments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة الأقساط</CardTitle>
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept=".xlsx,.xls"
                      onChange={(e) => handleFileUpload(e, "excel")}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 ml-2" />
                      رفع Excel
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm" onClick={() => setIsAddInstallmentOpen(true)}>
                      <Plus className="h-4 w-4 ml-2" />
                      قسط جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم القسط أو اسم العميل..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="paid">مدفوع</SelectItem>
                      <SelectItem value="overdue">متأخر</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredInstallments?.map((installment) => (
                    <Card key={installment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {installment.installmentNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  installment.status
                                )}`}
                              >
                                {getStatusText(installment.status)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-medium">{installment.customerName}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {installment.customerCode}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span>{installment.customerPhone || "لا يوجد"}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <p className="font-bold text-orange-600">
                                    {(installment.installmentAmount / 100).toFixed(2)} ر.س
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    من {(installment.totalAmount / 100).toFixed(2)} ر.س
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>
                                  {new Date(installment.dueDate).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {installment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => markAsPaid.mutate({ id: installment.id })}
                            >
                              تسجيل السداد
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredInstallments?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد أقساط</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bonds Tab */}
          <TabsContent value="bonds" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>قائمة السندات</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Upload className="h-4 w-4 ml-2" />
                      رفع PDF
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm" onClick={() => setIsAddBondOpen(true)}>
                      <Plus className="h-4 w-4 ml-2" />
                      سند جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredBonds?.map((bond) => (
                    <Card key={bond.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <FileText className="h-5 w-5 text-purple-500" />
                              <h3 className="font-semibold text-lg">{bond.bondNumber}</h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  bond.bondType === "receipt"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {bond.bondType === "receipt" ? "سند قبض" : "سند صرف"}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">العميل: </span>
                                <span className="font-medium">
                                  {bond.customerName || "غير محدد"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المبلغ: </span>
                                <span className="font-bold text-purple-600">
                                  {(bond.amount / 100).toFixed(2)} ر.س
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">التاريخ: </span>
                                <span className="font-medium">
                                  {new Date(bond.bondDate).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الطريقة: </span>
                                <span className="font-medium">{bond.paymentMethod}</span>
                              </div>
                            </div>
                            {bond.description && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {bond.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredBonds?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد سندات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Installment Dialog */}
        <Dialog open={isAddInstallmentOpen} onOpenChange={setIsAddInstallmentOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة قسط جديد</DialogTitle>
              <DialogDescription>
                أدخل بيانات القسط - مستقل عن الفواتير
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInstallmentSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>كود العميل</Label>
                    <Input
                      value={installmentForm.customerCode}
                      onChange={(e) =>
                        setInstallmentForm({ ...installmentForm, customerCode: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>اسم العميل</Label>
                    <Input
                      value={installmentForm.customerName}
                      onChange={(e) =>
                        setInstallmentForm({ ...installmentForm, customerName: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={installmentForm.customerPhone}
                    onChange={(e) =>
                      setInstallmentForm({ ...installmentForm, customerPhone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>إجمالي المبلغ</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={installmentForm.totalAmount}
                      onChange={(e) =>
                        setInstallmentForm({ ...installmentForm, totalAmount: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label>قيمة القسط</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={installmentForm.installmentAmount}
                      onChange={(e) =>
                        setInstallmentForm({
                          ...installmentForm,
                          installmentAmount: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>تاريخ الاستحقاق</Label>
                  <Input
                    type="date"
                    value={installmentForm.dueDate}
                    onChange={(e) =>
                      setInstallmentForm({ ...installmentForm, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={installmentForm.notes}
                    onChange={(e) =>
                      setInstallmentForm({ ...installmentForm, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddInstallmentOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إضافة القسط</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Bond Dialog */}
        <Dialog open={isAddBondOpen} onOpenChange={setIsAddBondOpen}>
          <DialogContent className="max-w-2xl" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة سند جديد</DialogTitle>
              <DialogDescription>أدخل بيانات السند المالي</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBondSubmit}>
              <div className="grid gap-4 py-4">
                <div>
                  <Label>نوع السند</Label>
                  <Select
                    value={bondForm.bondType}
                    onValueChange={(value) => setBondForm({ ...bondForm, bondType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">سند قبض</SelectItem>
                      <SelectItem value="payment">سند صرف</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>كود العميل</Label>
                    <Input
                      value={bondForm.customerCode}
                      onChange={(e) =>
                        setBondForm({ ...bondForm, customerCode: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>اسم العميل</Label>
                    <Input
                      value={bondForm.customerName}
                      onChange={(e) =>
                        setBondForm({ ...bondForm, customerName: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>المبلغ</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={bondForm.amount}
                      onChange={(e) => setBondForm({ ...bondForm, amount: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>تاريخ السند</Label>
                    <Input
                      type="date"
                      value={bondForm.bondDate}
                      onChange={(e) => setBondForm({ ...bondForm, bondDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>الوصف</Label>
                  <Input
                    value={bondForm.description}
                    onChange={(e) => setBondForm({ ...bondForm, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>طريقة الدفع</Label>
                    <Select
                      value={bondForm.paymentMethod}
                      onValueChange={(value) =>
                        setBondForm({ ...bondForm, paymentMethod: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">نقدي</SelectItem>
                        <SelectItem value="bank_transfer">تحويل بنكي</SelectItem>
                        <SelectItem value="check">شيك</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>رقم المرجع</Label>
                    <Input
                      value={bondForm.referenceNumber}
                      onChange={(e) =>
                        setBondForm({ ...bondForm, referenceNumber: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>ملاحظات</Label>
                  <Textarea
                    value={bondForm.notes}
                    onChange={(e) => setBondForm({ ...bondForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddBondOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit">إضافة السند</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
