import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Truck,
  Search,
  RefreshCw,
  Loader2,
  MapPin,
  Navigation,
  User,
  Gauge,
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

export default function Fleet() {
  const [searchQuery, setSearchQuery] = useState("");

  // جلب بيانات المركبات من ميزان الحسابات (حسابات النقليات)
  const { data: accountBalances, isLoading, refetch } = trpc.accountBalances.getAll.useQuery();
  
  // تصفية المركبات (الحسابات المتعلقة بالنقليات والمركبات)
  const vehicles = accountBalances?.filter(account => 
    account.accountName?.includes('النقليات') ||
    account.accountName?.includes('تريلا') ||
    account.accountName?.includes('سيارة') ||
    account.accountName?.includes('شاحنة') ||
    account.accountCode.startsWith('201134') // مؤسسة محمد مهدى فرع النقليات
  ).map(account => ({
    id: account.id,
    code: account.accountCode,
    name: account.accountName,
    balance: (account.debitBalance || 0) - (account.creditBalance || 0),
    status: Math.abs((account.debitBalance || 0) - (account.creditBalance || 0)) < 1000 ? 'متوقف' : 'نشط',
  })) || [];

  // البحث
  const displayVehicles = searchQuery.length > 0 
    ? vehicles.filter(v => 
        v.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.code?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : vehicles;

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ر.س`;
  };

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح");
  };

  // حساب الإحصائيات
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'نشط').length;
  const totalBalance = vehicles.reduce((sum, v) => sum + (v.balance || 0), 0);

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">الأسطول GPS</h1>
            <p className="text-muted-foreground">تتبع ومسارات المركبات</p>
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
                  <p className="text-sm text-muted-foreground mb-1">إجمالي المركبات</p>
                  <p className="text-2xl font-bold">{totalVehicles}</p>
                </div>
                <Truck className="w-10 h-10 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">المركبات النشطة</p>
                  <p className="text-2xl font-bold text-green-400">{activeVehicles}</p>
                </div>
                <Navigation className="w-10 h-10 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">المركبات المتوقفة</p>
                  <p className="text-2xl font-bold text-orange-400">{totalVehicles - activeVehicles}</p>
                </div>
                <Gauge className="w-10 h-10 text-orange-400" />
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
                <MapPin className="w-10 h-10 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6 bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              🚛 البيانات معروضة من <strong>ميزان المراجعة</strong> (حسابات النقليات والمركبات). لتحديث البيانات، قم برفع ملف ميزان المراجعة جديد.
            </p>
          </CardContent>
        </Card>

        <div className="mb-6 flex flex-wrap gap-3">
          <Link href="/account-balances">
            <Button className="neon-green-bg">
              <Truck className="ml-2 h-4 w-4" />
              رفع ميزان المراجعة
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

          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث بالاسم أو الكود..."
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
              <Truck className="h-5 w-5" />
              قائمة المركبات ({displayVehicles.length})
            </CardTitle>
            <CardDescription>
              عرض جميع المركبات من ميزان المراجعة
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : displayVehicles.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">كود الحساب</TableHead>
                      <TableHead className="text-right">اسم المركبة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id}>
                        <TableCell className="font-mono text-sm">{vehicle.code}</TableCell>
                        <TableCell className="font-medium">{vehicle.name}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-xs ${
                            vehicle.status === 'نشط' 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-orange-500/20 text-orange-400'
                          }`}>
                            {vehicle.status}
                          </span>
                        </TableCell>
                        <TableCell className={vehicle.balance < 0 ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                          {formatCurrency(vehicle.balance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {searchQuery ? "لا توجد نتائج للبحث" : "لا توجد بيانات. قم برفع ملف ميزان المراجعة أولاً."}
              </p>
            )}
          </CardContent>
        </Card>


      </div>
    </div>
  );
}
