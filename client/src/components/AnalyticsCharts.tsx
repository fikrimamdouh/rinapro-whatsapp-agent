import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, DollarSign, Package, AlertTriangle } from "lucide-react";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export function AnalyticsCharts() {
  const { data: kpis } = trpc.system.getKPIs.useQuery();
  const { data: salesTrend } = trpc.system.getSalesTrend.useQuery();
  const { data: topItems } = trpc.system.getTopSellingItems.useQuery();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ar-SA", { month: "short", day: "numeric" });
  };

  // Prepare cashflow data
  const cashflowData = [
    { name: "الإيرادات", value: kpis?.totalRevenue || 0, color: "#10b981" },
    { name: "المصروفات", value: kpis?.totalExpenses || 0, color: "#ef4444" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي المبيعات</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.totalSales || 0}</div>
            <p className="text-xs text-muted-foreground">عملية بيع</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">رصيد الصندوق</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.cashBalance || 0)}</div>
            <p className="text-xs text-muted-foreground">الرصيد الحالي</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">قيمة المخزون</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(kpis?.inventoryValue || 0)}</div>
            <p className="text-xs text-muted-foreground">إجمالي القيمة</p>
          </CardContent>
        </Card>

        <Card className="glass-strong">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تنبيهات المخزون</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis?.lowStockItems || 0}</div>
            <p className="text-xs text-muted-foreground">أصناف منخفضة</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Trend Chart */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>اتجاه المبيعات</CardTitle>
            <CardDescription>آخر 7 أيام</CardDescription>
          </CardHeader>
          <CardContent>
            {salesTrend && salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                  />
                  <YAxis 
                    tickFormatter={(value) => formatCurrency(value)}
                    stroke="#9ca3af"
                  />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={formatDate}
                    contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="المبيعات"
                    dot={{ fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                لا توجد بيانات مبيعات لعرضها
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cashflow Chart */}
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>تحليل التدفق النقدي</CardTitle>
            <CardDescription>الإيرادات مقابل المصروفات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis 
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                />
                <Bar dataKey="value" name="المبلغ">
                  {cashflowData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      {topItems && topItems.length > 0 && (
        <Card className="glass-strong">
          <CardHeader>
            <CardTitle>الأصناف الأكثر مبيعاً</CardTitle>
            <CardDescription>أعلى 5 منتجات</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  type="number"
                  tickFormatter={(value) => formatCurrency(value)}
                  stroke="#9ca3af"
                />
                <YAxis 
                  type="category"
                  dataKey="itemName" 
                  width={150}
                  stroke="#9ca3af"
                />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: "#1f2937", border: "1px solid #374151" }}
                />
                <Bar dataKey="revenue" fill="#3b82f6" name="الإيرادات" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
