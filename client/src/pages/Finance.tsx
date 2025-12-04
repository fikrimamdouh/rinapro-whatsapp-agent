import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  Building2,
  FileCheck,
  Plus,
  Search,
  Download,
} from "lucide-react";

export default function Finance() {
  const [activeTab, setActiveTab] = useState("payments");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Queries
  const { data: payments, refetch: refetchPayments } = trpc.finance.getPayments.useQuery();
  const { data: receipts, refetch: refetchReceipts } = trpc.finance.getReceipts.useQuery();
  const { data: bankTransactions } = trpc.finance.getBankTransactions.useQuery();
  const { data: checks } = trpc.finance.getChecks.useQuery();
  const { data: cashFlow } = trpc.finance.getCashFlow.useQuery();
  const { data: stats } = trpc.finance.getStats.useQuery();

  // Mutations
  const reconcileTransaction = trpc.finance.reconcileTransaction.useMutation({
    onSuccess: () => {
      toast.success("تم التسوية بنجاح");
    },
  });

  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch =
      payment.paymentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredReceipts = receipts?.filter((receipt) => {
    const matchesSearch =
      receipt.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || receipt.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "مكتمل";
      case "pending":
        return "قيد الانتظار";
      case "cancelled":
        return "ملغي";
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
            <Wallet className="h-10 w-10 text-primary" />
            الإدارة المالية
          </h1>
          <p className="text-muted-foreground">
            إدارة المقبوضات والمدفوعات والتسويات البنكية والشيكات
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المقبوضات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((stats?.totalReceipts || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدفوعات</p>
                  <p className="text-2xl font-bold text-red-600">
                    {((stats?.totalPayments || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">الرصيد الحالي</p>
                  <p
                    className={`text-2xl font-bold ${
                      (stats?.currentBalance || 0) >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {((stats?.currentBalance || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <Wallet className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">شيكات مستحقة</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats?.pendingChecks || 0}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            <TabsTrigger value="receipts">المقبوضات</TabsTrigger>
            <TabsTrigger value="bank">التسويات البنكية</TabsTrigger>
            <TabsTrigger value="checks">الشيكات</TabsTrigger>
            <TabsTrigger value="cashflow">التدفق النقدي</TabsTrigger>
          </TabsList>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>المدفوعات</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      دفعة جديدة
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم الدفعة..."
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
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredPayments?.map((payment) => (
                    <Card key={payment.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {payment.paymentNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  payment.status
                                )}`}
                              >
                                {getStatusText(payment.status)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {payment.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">المبلغ: </span>
                                <span className="font-bold text-red-600">
                                  {(payment.amount / 100).toFixed(2)} ر.س
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">التاريخ: </span>
                                <span className="font-medium">
                                  {new Date(payment.paymentDate).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الطريقة: </span>
                                <span className="font-medium">{payment.paymentMethod}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المرجع: </span>
                                <span className="font-medium">
                                  {payment.referenceNumber || "لا يوجد"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredPayments?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مدفوعات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipts Tab */}
          <TabsContent value="receipts" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>المقبوضات</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 ml-2" />
                      تصدير
                    </Button>
                    <Button size="sm">
                      <Plus className="h-4 w-4 ml-2" />
                      إيصال جديد
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="بحث برقم الإيصال..."
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
                      <SelectItem value="completed">مكتمل</SelectItem>
                      <SelectItem value="pending">قيد الانتظار</SelectItem>
                      <SelectItem value="cancelled">ملغي</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {filteredReceipts?.map((receipt) => (
                    <Card key={receipt.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">
                                {receipt.receiptNumber}
                              </h3>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  receipt.status
                                )}`}
                              >
                                {getStatusText(receipt.status)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {receipt.description}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">المبلغ: </span>
                                <span className="font-bold text-green-600">
                                  {(receipt.amount / 100).toFixed(2)} ر.س
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">التاريخ: </span>
                                <span className="font-medium">
                                  {new Date(receipt.receiptDate).toLocaleDateString("ar-SA")}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الطريقة: </span>
                                <span className="font-medium">{receipt.paymentMethod}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المرجع: </span>
                                <span className="font-medium">
                                  {receipt.referenceNumber || "لا يوجد"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {filteredReceipts?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد مقبوضات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bank Reconciliation Tab */}
          <TabsContent value="bank" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التسويات البنكية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bankTransactions?.map((transaction) => (
                    <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Building2 className="h-5 w-5 text-blue-500" />
                              <h3 className="font-semibold">{transaction.bankName}</h3>
                              {transaction.reconciled ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                              ) : (
                                <Clock className="h-5 w-5 text-orange-500" />
                              )}
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">رقم العملية: </span>
                                <span className="font-medium">
                                  {transaction.transactionNumber}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">المبلغ: </span>
                                <span
                                  className={`font-bold ${
                                    transaction.transactionType === "credit"
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {(transaction.amount / 100).toFixed(2)} ر.س
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">التاريخ: </span>
                                <span className="font-medium">
                                  {new Date(transaction.transactionDate).toLocaleDateString(
                                    "ar-SA"
                                  )}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">الحالة: </span>
                                <span className="font-medium">
                                  {transaction.reconciled ? "تمت التسوية" : "قيد المراجعة"}
                                </span>
                              </div>
                            </div>
                          </div>
                          {!transaction.reconciled && (
                            <Button
                              size="sm"
                              onClick={() =>
                                reconcileTransaction.mutate({ id: transaction.id })
                              }
                            >
                              تسوية
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {bankTransactions?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد معاملات بنكية</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checks Tab */}
          <TabsContent value="checks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>الشيكات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {checks?.map((check) => {
                    const isOverdue =
                      new Date(check.dueDate) < new Date() && check.status === "pending";
                    return (
                      <Card
                        key={check.id}
                        className={`hover:shadow-md transition-shadow ${
                          isOverdue ? "border-red-300 bg-red-50" : ""
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">{check.checkNumber}</h3>
                                <span
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                    check.status
                                  )}`}
                                >
                                  {getStatusText(check.status)}
                                </span>
                                {isOverdue && (
                                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                    متأخر
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">المبلغ: </span>
                                  <span className="font-bold">
                                    {(check.amount / 100).toFixed(2)} ر.س
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">تاريخ الإصدار: </span>
                                  <span className="font-medium">
                                    {new Date(check.issueDate).toLocaleDateString("ar-SA")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">تاريخ الاستحقاق: </span>
                                  <span className="font-medium">
                                    {new Date(check.dueDate).toLocaleDateString("ar-SA")}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">البنك: </span>
                                  <span className="font-medium">{check.bankName}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {checks?.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>لا توجد شيكات</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التدفق النقدي</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">التدفقات الداخلة</p>
                        <p className="text-2xl font-bold text-green-600">
                          {((cashFlow?.inflow || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">التدفقات الخارجة</p>
                        <p className="text-2xl font-bold text-red-600">
                          {((cashFlow?.outflow || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">صافي التدفق</p>
                        <p
                          className={`text-2xl font-bold ${
                            (cashFlow?.netFlow || 0) >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {((cashFlow?.netFlow || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">التدفقات حسب الفئة</h3>
                    <div className="space-y-2">
                      {cashFlow?.byCategory?.map((category: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <span className="font-medium">{category.name}</span>
                          <span
                            className={`font-bold ${
                              category.amount >= 0 ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {(category.amount / 100).toFixed(2)} ر.س
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
