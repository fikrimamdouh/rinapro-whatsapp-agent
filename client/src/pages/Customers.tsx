import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Users,
  Search,
  Upload,
  Download,
  Loader2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Send,
  Filter,
  AlertTriangle,
  MessageSquare,
} from "lucide-react";
import { Link } from "wouter";
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
import * as XLSX from 'xlsx';
import { getActiveCompanyId } from "@/lib/company";

export default function Customers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<string>("all");
  const companyId = getActiveCompanyId();

  // جلب البيانات من ميزان العملاء
  const { data: customerBalances, isLoading, refetch } = trpc.customerBalances.getAll.useQuery();
  
  // تحويل بيانات الميزان إلى صيغة العملاء
  const customers = customerBalances?.map(balance => ({
    id: balance.id,
    customerId: balance.customerCode,
    name: balance.customerName,
    phone: balance.phone || '',
    balance: balance.currentBalance,
    debit: balance.debit,
    credit: balance.credit,
    previousBalance: balance.previousBalance,
  })) || [];

  // تطبيق الفلاتر
  let filteredCustomers = customers;
  
  // فلتر البحث
  if (searchQuery.length > 0) {
    filteredCustomers = filteredCustomers.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone?.includes(searchQuery)
    );
  }
  
  // فلتر الرصيد
  if (balanceFilter === "hasBalance") {
    filteredCustomers = filteredCustomers.filter(c => c.previousBalance !== 0);
  } else if (balanceFilter === "zeroBalance") {
    filteredCustomers = filteredCustomers.filter(c => c.previousBalance === 0);
  } else if (balanceFilter === "positive") {
    filteredCustomers = filteredCustomers.filter(c => c.balance > 0);
  } else if (balanceFilter === "negative") {
    filteredCustomers = filteredCustomers.filter(c => c.balance < 0);
  }
  
  const displayCustomers = filteredCustomers;

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح");
  };

  const handleExportExcel = () => {
    if (!displayCustomers || displayCustomers.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    try {
      // تحضير البيانات للتصدير
      const exportData = displayCustomers.map(customer => ({
        'كود العميل': customer.customerId || '',
        'اسم العميل': customer.name,
        'رقم الهاتف': customer.phone || '',
        'رصيد أول المدة': (customer.previousBalance / 100).toFixed(2),
        'مدين': (customer.debit / 100).toFixed(2),
        'دائن': (customer.credit / 100).toFixed(2),
        'الرصيد الحالي': (customer.balance / 100).toFixed(2),
      }));

      // إنشاء ورقة عمل
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // تنسيق العرض
      const wscols = [
        { wch: 15 }, // كود العميل
        { wch: 30 }, // اسم العميل
        { wch: 15 }, // رقم الهاتف
        { wch: 15 }, // رصيد أول المدة
        { wch: 15 }, // مدين
        { wch: 15 }, // دائن
        { wch: 15 }, // الرصيد الحالي
      ];
      ws['!cols'] = wscols;

      // إنشاء كتاب عمل
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'العملاء');

      // تصدير الملف
      const fileName = `customers_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success(`تم تصدير ${displayCustomers.length} عميل بنجاح`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("حدث خطأ أثناء التصدير");
    }
  };

  const handleQuickSend = (customer: any) => {
    const message = `مرحباً ${customer.name}،\n\nرصيدك الحالي: ${formatCurrency(customer.balance)}\n\nشكراً لتعاملكم معنا`;
    const whatsappUrl = `https://wa.me/${customer.phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    toast.success(`تم فتح WhatsApp لإرسال رسالة إلى ${customer.name}`);
  };

  const handleExport = () => {
    if (!customers || customers.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    // تحويل البيانات إلى CSV
    const headers = ["كود العميل", "الاسم", "الهاتف", "المدين", "الدائن", "الرصيد الحالي"];
    const rows = customers.map(c => [
      c.customerId,
      c.name,
      c.phone || '',
      (c.debit / 100).toFixed(2),
      (c.credit / 100).toFixed(2),
      (c.balance / 100).toFixed(2),
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `العملاء_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success("تم تصدير البيانات بنجاح");
  };

  // حساب الإحصائيات
  const totalCustomers = customers.length;
  const totalDebit = customers.reduce((sum, c) => sum + (c.debit || 0), 0);
  const totalCredit = customers.reduce((sum, c) => sum + (c.credit || 0), 0);
  const totalBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">العملاء</h1>
            <p className="text-muted-foreground">إدارة بيانات العملاء من ميزان العملاء</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي العملاء</p>
                  <p className="text-2xl font-bold">{totalCustomers}</p>
                </div>
                <Users className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي المدين</p>
                  <p className="text-2xl font-bold text-blue-400">{formatCurrency(totalDebit)}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">إجمالي الدائن</p>
                  <p className="text-2xl font-bold text-orange-400">{formatCurrency(totalCredit)}</p>
                </div>
                <TrendingDown className="w-10 h-10 text-orange-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">الرصيد الإجمالي</p>
                  <p className={`text-2xl font-bold ${totalBalance < 0 ? 'text-red-400' : 'text-green-400'}`}>
                    {formatCurrency(totalBalance)}
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              📊 البيانات معروضة مباشرة من <strong>ميزان العملاء</strong>. لتحديث البيانات، قم برفع ملف Excel جديد في صفحة ميزان العملاء.
            </p>
          </CardContent>
        </Card>

        <div className="mb-6 space-y-4">
          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-3">
            <Link href="/customer-balances">
              <Button className="neon-green-bg">
                <Upload className="ml-2 h-4 w-4" />
                رفع ميزان العملاء
              </Button>
            </Link>

            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={isLoading}
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>

            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              className="border-green-500/30 hover:bg-green-500/10"
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>

            <Button variant="outline" onClick={handleExport}>
              <Download className="ml-2 h-4 w-4" />
              تصدير CSV
            </Button>
          </div>

          {/* الفلاتر */}
          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search" className="mb-2 block">بحث</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      id="search"
                      placeholder="ابحث عن عميل..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="balance-filter" className="mb-2 block">فلتر الرصيد</Label>
                  <Select value={balanceFilter} onValueChange={setBalanceFilter}>
                    <SelectTrigger id="balance-filter">
                      <SelectValue placeholder="اختر الفلتر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      <SelectItem value="hasBalance">لديهم رصيد أول المدة</SelectItem>
                      <SelectItem value="zeroBalance">رصيد أول المدة صفر</SelectItem>
                      <SelectItem value="positive">رصيد موجب</SelectItem>
                      <SelectItem value="negative">رصيد سالب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-3 text-sm text-muted-foreground">
                عرض {displayCustomers.length} من {customers.length} عميل
              </div>
            </CardContent>
          </Card>

          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث بالاسم أو الكود أو الهاتف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 glass"
              />
            </div>
          </div>
        </div>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              قائمة العملاء ({displayCustomers.length})
            </CardTitle>
            <CardDescription>
              عرض جميع العملاء من ميزان العملاء
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayCustomers.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">كود العميل</TableHead>
                      <TableHead className="text-right">الاسم</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">رصيد أول المدة</TableHead>
                      <TableHead className="text-right">المدين</TableHead>
                      <TableHead className="text-right">الدائن</TableHead>
                      <TableHead className="text-right">الرصيد الحالي</TableHead>
                      <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayCustomers.map((customer) => (
                      <TableRow key={customer.id} className={customer.balance < 0 ? "bg-red-500/5" : ""}>
                        <TableCell className="font-mono text-sm">{customer.customerId}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {customer.balance < 0 && (
                              <AlertTriangle className="h-4 w-4 text-red-500" title="رصيد سالب - يحتاج متابعة" />
                            )}
                            {customer.name}
                          </div>
                        </TableCell>
                        <TableCell>{customer.phone || "-"}</TableCell>
                        <TableCell className="text-purple-500">{formatCurrency(customer.previousBalance || 0)}</TableCell>
                        <TableCell className="text-blue-500">{formatCurrency(customer.debit || 0)}</TableCell>
                        <TableCell className="text-orange-500">{formatCurrency(customer.credit || 0)}</TableCell>
                        <TableCell className={customer.balance < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          <div className="flex items-center gap-2">
                            {formatCurrency(customer.balance)}
                            {customer.balance < 0 && <span className="text-xs">(دائن)</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {customer.phone && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleQuickSend(customer)}
                                className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                title="إرسال رسالة واتساب"
                              >
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد بيانات. قم برفع ملف ميزان العملاء أولاً."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
