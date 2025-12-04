import { useState } from "react";
import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Building2, 
  Plus, 
  Search, 
  Edit,
  Trash2,
  MapPin,
  Phone,
  Mail
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Company {
  id: string;
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxNumber?: string;
  welcomeMessage?: string;
  isActive: boolean;
  branches: Branch[];
}

interface Branch {
  id: string;
  companyId: string;
  name: string;
  code: string;
  phone?: string;
  address?: string;
  whatsappGroupId?: string;
  whatsappGroupName?: string;
  managerPhone?: string;
  isActive: boolean;
}

export default function Companies() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [isBranchDialogOpen, setIsBranchDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  
  // Sample data - will be replaced with real data from database
  const [companies] = useState<Company[]>([
    {
      id: "1",
      name: "الشركة الرئيسية",
      phone: "0501234567",
      email: "info@company.com",
      address: "الرياض، المملكة العربية السعودية",
      taxNumber: "123456789",
      welcomeMessage: "مرحباً بك في نظام إدارة الشركة",
      isActive: true,
      branches: [
        {
          id: "1",
          companyId: "1",
          name: "الفرع الرئيسي",
          code: "MAIN",
          phone: "0501234567",
          address: "الرياض",
          whatsappGroupId: "120363XXX@g.us",
          whatsappGroupName: "جروب الفرع الرئيسي",
          managerPhone: "966501234567",
          isActive: true
        },
        {
          id: "2",
          companyId: "1",
          name: "فرع جدة",
          code: "JED",
          phone: "0509876543",
          address: "جدة",
          whatsappGroupId: "120363YYY@g.us",
          whatsappGroupName: "جروب فرع جدة",
          managerPhone: "966509876543",
          isActive: true
        }
      ]
    }
  ]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
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
                <Building2 className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              إدارة الشركات والفروع
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة الشركات والفروع وجروبات WhatsApp
            </p>
          </div>

          {/* Actions Bar */}
          <Card className="glass-strong">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="relative flex-1 w-full">
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="بحث عن شركة..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full sm:w-auto">
                      <Plus className="ml-2 h-4 w-4" />
                      شركة جديدة
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>إضافة شركة جديدة</DialogTitle>
                      <DialogDescription>
                        أدخل بيانات الشركة الجديدة
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="company-name">اسم الشركة</Label>
                        <Input id="company-name" placeholder="الشركة الرئيسية" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company-phone">رقم الهاتف</Label>
                        <Input id="company-phone" placeholder="0501234567" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company-email">البريد الإلكتروني</Label>
                        <Input id="company-email" type="email" placeholder="info@company.com" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company-address">العنوان</Label>
                        <Textarea id="company-address" placeholder="الرياض، المملكة العربية السعودية" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company-tax">الرقم الضريبي</Label>
                        <Input id="company-tax" placeholder="123456789" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="company-welcome">رسالة الترحيب</Label>
                        <Textarea id="company-welcome" placeholder="مرحباً بك في نظام إدارة الشركة" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
                        إلغاء
                      </Button>
                      <Button onClick={() => setIsCompanyDialogOpen(false)}>
                        حفظ
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Companies List */}
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="glass-strong">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {company.name}
                      {company.isActive && (
                        <Badge variant="outline" className="mr-2">نشط</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2 space-y-1">
                      {company.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {company.phone}
                        </div>
                      )}
                      {company.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {company.email}
                        </div>
                      )}
                      {company.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {company.address}
                        </div>
                      )}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="branches">
                  <TabsList>
                    <TabsTrigger value="branches">
                      الفروع ({company.branches.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="branches" className="mt-4">
                    <div className="flex justify-end mb-4">
                      <Dialog open={isBranchDialogOpen} onOpenChange={setIsBranchDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" onClick={() => setSelectedCompany(company)}>
                            <Plus className="ml-2 h-4 w-4" />
                            فرع جديد
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>إضافة فرع جديد</DialogTitle>
                            <DialogDescription>
                              أدخل بيانات الفرع الجديد لشركة {selectedCompany?.name}
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                              <Label htmlFor="branch-name">اسم الفرع</Label>
                              <Input id="branch-name" placeholder="الفرع الرئيسي" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-code">كود الفرع</Label>
                              <Input id="branch-code" placeholder="MAIN" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-phone">رقم الهاتف</Label>
                              <Input id="branch-phone" placeholder="0501234567" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-address">العنوان</Label>
                              <Input id="branch-address" placeholder="الرياض" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-group-id">معرف جروب WhatsApp</Label>
                              <Input id="branch-group-id" placeholder="120363XXX@g.us" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-group-name">اسم جروب WhatsApp</Label>
                              <Input id="branch-group-name" placeholder="جروب الفرع الرئيسي" />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor="branch-manager">رقم المدير</Label>
                              <Input id="branch-manager" placeholder="966501234567" />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsBranchDialogOpen(false)}>
                              إلغاء
                            </Button>
                            <Button onClick={() => setIsBranchDialogOpen(false)}>
                              حفظ
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>اسم الفرع</TableHead>
                          <TableHead>الكود</TableHead>
                          <TableHead>الهاتف</TableHead>
                          <TableHead>جروب WhatsApp</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead>إجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {company.branches.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground">
                              لا توجد فروع
                            </TableCell>
                          </TableRow>
                        ) : (
                          company.branches.map((branch) => (
                            <TableRow key={branch.id}>
                              <TableCell className="font-medium">{branch.name}</TableCell>
                              <TableCell>{branch.code}</TableCell>
                              <TableCell>{branch.phone}</TableCell>
                              <TableCell>{branch.whatsappGroupName || "-"}</TableCell>
                              <TableCell>
                                {branch.isActive ? (
                                  <Badge variant="outline">نشط</Badge>
                                ) : (
                                  <Badge variant="secondary">غير نشط</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
