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
  FileText,
  Download,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";

export default function Reports() {
  const [activeTab, setActiveTab] = useState("financial");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [reportType, setReportType] = useState("income_statement");

  // Queries
  const { data: financialSummary } = trpc.reports.getFinancialSummary.useQuery({
    dateFrom,
    dateTo,
  });
  const { data: salesReport } = trpc.reports.getSalesReport.useQuery({ dateFrom, dateTo });
  const { data: inventoryReport } = trpc.reports.getInventoryReport.useQuery();
  const { data: profitLoss } = trpc.reports.getProfitLoss.useQuery({ dateFrom, dateTo });

  // Mutations
  const exportReport = trpc.reports.exportReport.useMutation({
    onSuccess: (data) => {
      toast.success("تم تصدير التقرير بنجاح");
      // Download file
      const link = document.createElement("a");
      link.href = data.url;
      link.download = data.filename;
      link.click();
    },
    onError: (error) => {
      toast.error(`خطأ: ${error.message}`);
    },
  });

  const handleExport = (format: "excel" | "pdf") => {
    exportReport.mutate({
      reportType,
      format,
      dateFrom,
      dateTo,
    });
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <FileText className="h-10 w-10 text-primary" />
            التقارير المالية
          </h1>
          <p className="text-muted-foreground">
            تقارير شاملة للإيرادات والمصروفات والأرباح والخسائر
          </p>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label>من تاريخ</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <Label>إلى تاريخ</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <Label>نوع التقرير</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income_statement">قائمة الدخل</SelectItem>
                    <SelectItem value="balance_sheet">الميزانية العمومية</SelectItem>
                    <SelectItem value="cash_flow">التدفق النقدي</SelectItem>
                    <SelectItem value="sales">تقرير المبيعات</SelectItem>
                    <SelectItem value="purchases">تقرير المشتريات</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleExport("excel")}
                >
                  <Download className="h-4 w-4 ml-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleExport("pdf")}
                >
                  <Download className="h-4 w-4 ml-2" />
                  PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الإيرادات</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((financialSummary?.totalRevenue || 0) / 100).toFixed(2)} ر.س
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
                  <p className="text-sm text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-red-600">
                    {((financialSummary?.totalExpenses || 0) / 100).toFixed(2)} ر.س
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
                  <p className="text-sm text-muted-foreground">صافي الربح</p>
                  <p
                    className={`text-2xl font-bold ${
                      (financialSummary?.netProfit || 0) >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {((financialSummary?.netProfit || 0) / 100).toFixed(2)} ر.س
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">هامش الربح</p>
                  <p className="text-2xl font-bold">
                    {financialSummary?.profitMargin || 0}%
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="financial">المالية</TabsTrigger>
            <TabsTrigger value="sales">المبيعات</TabsTrigger>
            <TabsTrigger value="inventory">المخزون</TabsTrigger>
            <TabsTrigger value="profitloss">الربح والخسارة</TabsTrigger>
          </TabsList>

          {/* Financial Reports Tab */}
          <TabsContent value="financial" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>التقارير المالية</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Revenue Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      تفصيل الإيرادات
                    </h3>
                    <div className="space-y-2">
                      {financialSummary?.revenueBreakdown?.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <span className="font-medium">{item.category}</span>
                          <span className="text-green-600 font-bold">
                            {(item.amount / 100).toFixed(2)} ر.س
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Expenses Breakdown */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-red-500" />
                      تفصيل المصروفات
                    </h3>
                    <div className="space-y-2">
                      {financialSummary?.expensesBreakdown?.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <span className="font-medium">{item.category}</span>
                          <span className="text-red-600 font-bold">
                            {(item.amount / 100).toFixed(2)} ر.س
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Reports Tab */}
          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تقرير المبيعات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">إجمالي المبيعات</p>
                        <p className="text-2xl font-bold">
                          {((salesReport?.totalSales || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">عدد الفواتير</p>
                        <p className="text-2xl font-bold">{salesReport?.invoiceCount || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">متوسط الفاتورة</p>
                        <p className="text-2xl font-bold">
                          {((salesReport?.averageInvoice || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Top Products */}
                  <div>
                    <h3 className="font-semibold mb-3">أكثر المنتجات مبيعاً</h3>
                    <div className="space-y-2">
                      {salesReport?.topProducts?.map((product: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-primary">#{index + 1}</span>
                            <span className="font-medium">{product.name}</span>
                          </div>
                          <div className="text-left">
                            <p className="font-bold">{product.quantity} وحدة</p>
                            <p className="text-sm text-muted-foreground">
                              {(product.revenue / 100).toFixed(2)} ر.س
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Inventory Reports Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>تقرير المخزون</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
                        <p className="text-2xl font-bold">{inventoryReport?.totalItems || 0}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">قيمة المخزون</p>
                        <p className="text-2xl font-bold">
                          {((inventoryReport?.totalValue || 0) / 100).toFixed(2)} ر.س
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">أصناف منخفضة</p>
                        <p className="text-2xl font-bold text-red-600">
                          {inventoryReport?.lowStockItems || 0}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Low Stock Items */}
                  <div>
                    <h3 className="font-semibold mb-3 text-red-600">أصناف تحتاج إعادة طلب</h3>
                    <div className="space-y-2">
                      {inventoryReport?.lowStockList?.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <span className="font-medium">{item.name}</span>
                          <div className="text-left">
                            <p className="font-bold text-red-600">
                              {item.currentStock} / {item.minStock}
                            </p>
                            <p className="text-sm text-muted-foreground">الحد الأدنى</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profit & Loss Tab */}
          <TabsContent value="profitloss" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>قائمة الأرباح والخسائر</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Revenue Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-green-600">الإيرادات</h3>
                    <div className="space-y-2 pr-4">
                      {profitLoss?.revenue?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className="font-medium">
                            {(item.amount / 100).toFixed(2)} ر.س
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t-2 font-bold text-green-600">
                        <span>إجمالي الإيرادات</span>
                        <span>{((profitLoss?.totalRevenue || 0) / 100).toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Section */}
                  <div>
                    <h3 className="font-semibold text-lg mb-3 text-red-600">المصروفات</h3>
                    <div className="space-y-2 pr-4">
                      {profitLoss?.expenses?.map((item: any, index: number) => (
                        <div key={index} className="flex justify-between">
                          <span>{item.label}</span>
                          <span className="font-medium">
                            {(item.amount / 100).toFixed(2)} ر.س
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between pt-2 border-t-2 font-bold text-red-600">
                        <span>إجمالي المصروفات</span>
                        <span>{((profitLoss?.totalExpenses || 0) / 100).toFixed(2)} ر.س</span>
                      </div>
                    </div>
                  </div>

                  {/* Net Profit */}
                  <div className="pt-4 border-t-4 border-primary">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold">صافي الربح / (الخسارة)</h3>
                      <p
                        className={`text-3xl font-bold ${
                          (profitLoss?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {((profitLoss?.netProfit || 0) / 100).toFixed(2)} ر.س
                      </p>
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
