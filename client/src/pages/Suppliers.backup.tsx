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
  Plus,
  Search,
  Edit,
  Trash2,
  Upload,
  Loader2,
} from "lucide-react";
import { ExcelUploader } from "@/components/ExcelUploader";
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

export default function Suppliers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const importMutation = trpc.suppliers.importFromExcel.useMutation();
  const { data: templateData } = trpc.suppliers.downloadTemplate.useQuery();
  const { data: suppliers, isLoading } = trpc.suppliers.list.useQuery();
  const { data: searchResults } = trpc.suppliers.search.useQuery(
    { query: searchQuery },
    { enabled: searchQuery.length > 0 }
  );

  const createMutation = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة المورد بنجاح");
      setIsAddDialogOpen(false);
      setNewSupplier({ name: "", phone: "", email: "", address: "", city: "", notes: "" });
      utils.suppliers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل إضافة المورد: ${error.message}`);
    },
  });

  const deleteMutation = trpc.suppliers.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف المورد بنجاح");
      utils.suppliers.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف المورد: ${error.message}`);
    },
  });

  const handleAddCustomer = () => {
    if (!newSupplier.name.trim()) {
      toast.error("الرجاء إدخال اسم المورد");
      return;
    }
    createMutation.mutate(newSupplier);
  };

  const handleDeleteCustomer = (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذا المورد؟")) {
      deleteMutation.mutate({ id });
    }
  };

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toFixed(2)} ريال`;
  };

  const displayCustomers = searchQuery.length > 0 ? searchResults : suppliers;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">الموردين</h1>
            <p className="text-muted-foreground">إدارة بيانات الموردين</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        {/* Excel Uploader */}
        <div className="mb-6">
          <ExcelUploader
            title="استيراد الموردين من Excel"
            description="قم برفع ملف Excel يحتوي على بيانات الموردين للاستيراد التلقائي"
            onUpload={async (fileBase64) => {
              const result = await importMutation.mutateAsync({ fileBase64 });
              utils.suppliers.list.invalidate();
              return result;
            }}
            onDownloadTemplate={async () => {
              if (!templateData) {
                throw new Error("فشل تحميل القالب");
              }
              return templateData;
            }}
          />
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="neon-green-bg">
                <Plus className="ml-2 h-4 w-4" />
                إضافة مورد
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle>إضافة مورد جديد</DialogTitle>
                <DialogDescription>أدخل بيانات المورد الجديد</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">الاسم *</Label>
                  <Input
                    id="name"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">الهاتف</Label>
                  <Input
                    id="phone"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="city">المدينة</Label>
                  <Input
                    id="city"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier({ ...newSupplier, city: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="address">العنوان</Label>
                  <Input
                    id="address"
                    value={newSupplier.address}
                    onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                    className="glass"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">ملاحظات</Label>
                  <Input
                    id="notes"
                    value={newSupplier.notes}
                    onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                    className="glass"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleAddCustomer} disabled={createMutation.isPending} className="neon-green-bg">
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : (
                    "إضافة"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="neon-green-border" onClick={() => toast.info("قريباً: رفع ملف Excel")}>
            <Upload className="ml-2 h-4 w-4" />
            رفع Excel
          </Button>

          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث عن مورد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass pr-10"
              />
            </div>
          </div>
        </div>

        {/* Customers Table */}
        <Card className="glass">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 neon-green" />
              قائمة الموردين ({displayCustomers?.length || 0})
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
                  <TableHeader>
                    <TableRow>
                      <TableHead>الاسم</TableHead>
                      <TableHead>الهاتف</TableHead>
                      <TableHead>المدينة</TableHead>
                      <TableHead>الرصيد</TableHead>
                      <TableHead>الإجراءات</TableHead>
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
                              onClick={() => toast.info("قريباً: تعديل المورد")}
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
      </div>
    </div>
  );
}
