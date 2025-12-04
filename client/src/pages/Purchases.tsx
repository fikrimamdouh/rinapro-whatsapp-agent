import { useState } from "react";
import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  FileText,
  TrendingUp,
  Package,
  DollarSign,
  Calendar
} from "lucide-react";
import { UniversalUploader } from "@/components/UniversalUploader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplier: string;
  date: string;
  totalAmount: number;
  status: "pending" | "approved" | "received" | "cancelled";
  items: number;
}

export default function Purchases() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Sample data
  const [purchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: "1",
      orderNumber: "PO-2024-001",
      supplier: "شركة التوريدات المتحدة",
      date: "2024-12-01",
      totalAmount: 15000,
      status: "approved",
      items: 5
    },
    {
      id: "2",
      orderNumber: "PO-2024-002",
      supplier: "مؤسسة النور التجارية",
      date: "2024-12-03",
      totalAmount: 8500,
      status: "pending",
      items: 3
    },
    {
      id: "3",
      orderNumber: "PO-2024-003",
      supplier: "شركة الأمل للمواد",
      date: "2024-12-04",
      totalAmount: 22000,
      status: "received",
      items: 8
    }
  ]);

  const stats = [
    {
      title: "إجمالي المشتريات",
      value: "45,500 ر.س",
      icon: DollarSign,
      color: "text-green-500"
    },
    {
      title: "أوامر الشراء",
      value: "3",
      icon: FileText,
      color: "text-blue-500"
    },
    {
      title: "قيد الانتظار",
      value: "1",
      icon: Package,
      color: "text-yellow-500"
    },
    {
      title: "تم الاستلام",
      value: "1",
      icon: TrendingUp,
      color: "text-purple-500"
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { label: "قيد الانتظار", variant: "secondary" },
      approved: { label: "معتمد", variant: "default" },
      received: { label: "تم الاستلام", variant: "outline" },
      cancelled: { label: "ملغي", variant: "destructive" }
    };
    return variants[status] || variants.pending;
  };

  const filteredOrders = purchaseOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <ShoppingBag className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              المشتريات
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة أوامر الشراء والموردين
            </p>
          </div>

          {/* Upload Section */}
          <UniversalUploader
            module="purchases"
            title="رفع بيانات المشتريات"
            description="قم برفع ملفات Excel أو PDF لتحليل بيانات المشتريات تلقائياً"
          />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <Card key={index} className="glass-strong">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold mt-2">{stat.value}</p>
                    </div>
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions Bar */}
          <Card className="glass-strong">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="بحث عن أمر شراء أو مورد..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="ml-2 h-4 w-4" />
                      أمر شراء جديد
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إنشاء أمر شراء جديد</DialogTitle>
                      <DialogDescription>
                        أدخل تفاصيل أمر الشراء الجديد
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="orderNumber">رقم الأمر</Label>
                        <Input id="orderNumber" placeholder="PO-2024-004" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="supplier">المورد</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر المورد" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="supplier1">شركة التوريدات المتحدة</SelectItem>
                            <SelectItem value="supplier2">مؤسسة النور التجارية</SelectItem>
                            <SelectItem value="supplier3">شركة الأمل للمواد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">التاريخ</Label>
                        <Input id="date" type="date" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">المبلغ الإجمالي</Label>
                        <Input id="amount" type="number" placeholder="0.00" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="notes">ملاحظات</Label>
                        <Textarea id="notes" placeholder="ملاحظات إضافية..." />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={() => setIsDialogOpen(false)}>
                        حفظ
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Purchase Orders Table */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>أوامر الشراء</CardTitle>
              <CardDescription>
                قائمة بجميع أوامر الشراء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>رقم الأمر</TableHead>
                    <TableHead>المورد</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>عدد الأصناف</TableHead>
                    <TableHead>المبلغ</TableHead>
                    <TableHead>الحالة</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        لا توجد أوامر شراء
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map((order) => {
                      const statusInfo = getStatusBadge(order.status);
                      return (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.orderNumber}</TableCell>
                          <TableCell>{order.supplier}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {order.date}
                            </div>
                          </TableCell>
                          <TableCell>{order.items}</TableCell>
                          <TableCell className="font-semibold">
                            {order.totalAmount.toLocaleString()} ر.س
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusInfo.variant}>
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
