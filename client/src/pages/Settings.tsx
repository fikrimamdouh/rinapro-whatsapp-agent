import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import { Settings as SettingsIcon, Save, Loader2, Trash2, BookOpen, AlertTriangle, Building2, Plus, Edit, X } from "lucide-react";
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

export default function Settings() {
  const [managerNumber, setManagerNumber] = useState("");
  const [groupName, setGroupName] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");
  
  // Company management states
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [newCompanyPhone, setNewCompanyPhone] = useState("");
  const [newCompanyEmail, setNewCompanyEmail] = useState("");
  const [newCompanyAddress, setNewCompanyAddress] = useState("");

  const utils = trpc.useUtils();
  const { data: settings } = trpc.settings.list.useQuery();
  const { data: companies } = trpc.companies.list.useQuery();

  const setSettingMutation = trpc.settings.set.useMutation({
    onSuccess: () => {
      toast.success("تم حفظ الإعدادات بنجاح");
      utils.settings.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    },
  });

  const resetSystemMutation = trpc.system.resetSystem.useMutation({
    onSuccess: () => {
      toast.success("تم إعادة ضبط النظام بنجاح");
      setIsResetDialogOpen(false);
      setResetConfirmText("");
      utils.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل إعادة ضبط النظام: ${error.message}`);
    },
  });

  const createCompanyMutation = trpc.companies.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة الشركة بنجاح");
      setIsCompanyDialogOpen(false);
      resetCompanyForm();
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل إضافة الشركة: ${error.message}`);
    },
  });

  const updateCompanyMutation = trpc.companies.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث الشركة بنجاح");
      setIsCompanyDialogOpen(false);
      resetCompanyForm();
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل تحديث الشركة: ${error.message}`);
    },
  });

  const deleteCompanyMutation = trpc.companies.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الشركة بنجاح");
      utils.companies.list.invalidate();
    },
    onError: (error) => {
      toast.error(`فشل حذف الشركة: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const manager = settings.find((s) => s.settingKey === "MANAGER_NUMBER");
      const group = settings.find((s) => s.settingKey === "GROUP_NAME");
      const token = settings.find((s) => s.settingKey === "API_TOKEN");
      const company = settings.find((s) => s.settingKey === "COMPANY_NAME");
      const logo = settings.find((s) => s.settingKey === "COMPANY_LOGO");
      const welcome = settings.find((s) => s.settingKey === "WELCOME_MESSAGE");

      if (manager) setManagerNumber(manager.settingValue || "");
      if (group) setGroupName(group.settingValue || "");
      if (token) setApiToken(token.settingValue || "");
      if (company) setCompanyName(company.settingValue || "");
      if (logo) setCompanyLogo(logo.settingValue || "");
      if (welcome) setWelcomeMessage(welcome.settingValue || "");
    }
  }, [settings]);

  const resetCompanyForm = () => {
    setNewCompanyName("");
    setNewCompanyPhone("");
    setNewCompanyEmail("");
    setNewCompanyAddress("");
    setEditingCompany(null);
  };

  const handleOpenCompanyDialog = (company?: any) => {
    if (company) {
      setEditingCompany(company);
      setNewCompanyName(company.name || "");
      setNewCompanyPhone(company.phone || "");
      setNewCompanyEmail(company.email || "");
      setNewCompanyAddress(company.address || "");
    } else {
      resetCompanyForm();
    }
    setIsCompanyDialogOpen(true);
  };

  const handleSaveCompany = async () => {
    if (!newCompanyName.trim()) {
      toast.error("يرجى إدخال اسم الشركة");
      return;
    }

    try {
      if (editingCompany) {
        await updateCompanyMutation.mutateAsync({
          id: editingCompany.id,
          name: newCompanyName,
          phone: newCompanyPhone,
          email: newCompanyEmail,
          address: newCompanyAddress,
        });
      } else {
        await createCompanyMutation.mutateAsync({
          name: newCompanyName,
          phone: newCompanyPhone,
          email: newCompanyEmail,
          address: newCompanyAddress,
        });
      }
    } catch (error) {
      console.error("Error saving company:", error);
    }
  };

  const handleDeleteCompany = async (id: number) => {
    if (confirm("هل أنت متأكد من حذف هذه الشركة؟")) {
      await deleteCompanyMutation.mutateAsync({ id });
    }
  };

  const handleSaveSettings = async () => {
    try {
      await setSettingMutation.mutateAsync({
        key: "MANAGER_NUMBER",
        value: managerNumber,
        description: "رقم المدير للتواصل عبر WhatsApp",
      });

      await setSettingMutation.mutateAsync({
        key: "GROUP_NAME",
        value: groupName,
        description: "اسم جروب WhatsApp للتقارير",
      });

      await setSettingMutation.mutateAsync({
        key: "COMPANY_NAME",
        value: companyName,
        description: "اسم الشركة",
      });

      await setSettingMutation.mutateAsync({
        key: "COMPANY_LOGO",
        value: companyLogo,
        description: "شعار الشركة (URL)",
      });

      await setSettingMutation.mutateAsync({
        key: "WELCOME_MESSAGE",
        value: welcomeMessage,
        description: "رسالة الترحيب",
      });

      await setSettingMutation.mutateAsync({
        key: "API_TOKEN",
        value: apiToken,
        description: "API Token للنظام",
      });

      toast.success("تم حفظ جميع الإعدادات بنجاح");
    } catch (error: any) {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <BackToHome />
        
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">الإعدادات</h1>
            <p className="text-muted-foreground">إعدادات النظام العامة</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        {/* Companies Management Card */}
        <Card className="glass-strong mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg neon-green-bg">
                  <Building2 className="h-6 w-6 neon-green" />
                </div>
                <div>
                  <CardTitle>إدارة الشركات</CardTitle>
                  <CardDescription>
                    إضافة وإدارة الشركات المختلفة في النظام
                  </CardDescription>
                </div>
              </div>
              <Button onClick={() => handleOpenCompanyDialog()} className="neon-green-bg">
                <Plus className="ml-2 h-4 w-4" />
                إضافة شركة
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {companies && companies.length > 0 ? (
                companies.map((company: any) => (
                  <div key={company.id} className="flex items-center justify-between p-4 glass rounded-lg">
                    <div>
                      <h3 className="font-semibold">{company.name}</h3>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        {company.phone && <p>📞 {company.phone}</p>}
                        {company.email && <p>📧 {company.email}</p>}
                        {company.address && <p>📍 {company.address}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleOpenCompanyDialog(company)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCompany(company.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  لا توجد شركات مضافة. اضغط "إضافة شركة" للبدء.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card className="glass-strong">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg neon-green-bg">
                <SettingsIcon className="h-6 w-6 neon-green" />
              </div>
              <div>
                <CardTitle>إعدادات WhatsApp</CardTitle>
                <CardDescription>
                  قم بتعديل رقم المدير واسم الجروب للربط مع WhatsApp
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="manager-number">رقم المدير</Label>
              <Input
                id="manager-number"
                value={managerNumber}
                onChange={(e) => setManagerNumber(e.target.value)}
                placeholder="+966557111398"
                className="glass"
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground mt-1">
                رقم الهاتف بصيغة دولية (مثال: +966557111398)
              </p>
            </div>

            <div>
              <Label htmlFor="group-name">اسم الجروب</Label>
              <Input
                id="group-name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="إدارة التحصيل والمتابعة – مصنع بن حامد"
                className="glass"
              />
              <p className="text-sm text-muted-foreground mt-1">
                اسم جروب WhatsApp الذي سيتم إرسال التقارير إليه
              </p>
            </div>

            <div>
              <Label htmlFor="company-name">اسم الشركة</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="شركة رينا برو للتقنية"
                className="glass"
              />
              <p className="text-sm text-muted-foreground mt-1">
                سيظهر في التقارير والرسائل
              </p>
            </div>

            <div>
              <Label htmlFor="company-logo">شعار الشركة (URL)</Label>
              <Input
                id="company-logo"
                value={companyLogo}
                onChange={(e) => setCompanyLogo(e.target.value)}
                placeholder="https://example.com/logo.png"
                className="glass"
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground mt-1">
                رابط شعار الشركة (سيظهر في التقارير)
              </p>
            </div>

            <div>
              <Label htmlFor="welcome-message">رسالة الترحيب</Label>
              <Input
                id="welcome-message"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                placeholder="مرحباً بك في نظام إدارة الشركة"
                className="glass"
              />
              <p className="text-sm text-muted-foreground mt-1">
                رسالة الترحيب التي تظهر في لوحة التحكم
              </p>
            </div>

            <div>
              <Label htmlFor="api-token">API Token</Label>
              <Input
                id="api-token"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="RINAPRO-DEV-999"
                className="glass"
                dir="ltr"
              />
              <p className="text-sm text-muted-foreground mt-1">
                رمز API للنظام (اختياري)
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                onClick={handleSaveSettings}
                disabled={setSettingMutation.isPending}
                className="neon-green-bg"
              >
                {setSettingMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ الإعدادات
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Chart of Accounts Card */}
        <Card className="glass mt-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/20">
                <BookOpen className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <CardTitle>دليل الحسابات</CardTitle>
                <CardDescription>إدارة شجرة الحسابات المحاسبية</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link href="/chart-of-accounts">
              <Button variant="outline" className="neon-green-border">
                <BookOpen className="ml-2 h-4 w-4" />
                فتح دليل الحسابات
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Current Settings Display */}
        <Card className="glass mt-6">
          <CardHeader>
            <CardTitle>الإعدادات الحالية</CardTitle>
            <CardDescription>عرض جميع الإعدادات المحفوظة</CardDescription>
          </CardHeader>
          <CardContent>
            {settings && Array.isArray(settings) && settings.length > 0 ? (
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="p-3 rounded-lg glass-strong"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm neon-green">
                          {setting.settingKey}
                        </p>
                        {setting.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {setting.description}
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {setting.settingValue || "-"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                لا توجد إعدادات محفوظة بعد
              </p>
            )}
          </CardContent>
        </Card>

        {/* System Reset Card */}
        <Card className="glass mt-6 border-red-500/30">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/20">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <CardTitle className="text-red-400">إعادة ضبط النظام</CardTitle>
                <CardDescription>حذف جميع البيانات وإعادة النظام للحالة الأولية</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              تحذير: هذا الإجراء سيحذف جميع العملاء والموردين والفواتير والأقساط والحسابات. لا يمكن التراجع عن هذا الإجراء.
            </p>
            <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="ml-2 h-4 w-4" />
                  إعادة ضبط النظام
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-strong">
                <DialogHeader>
                  <DialogTitle className="text-red-500">تأكيد إعادة ضبط النظام</DialogTitle>
                  <DialogDescription>
                    هذا الإجراء سيحذف جميع البيانات نهائياً. اكتب "حذف" للتأكيد.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    value={resetConfirmText}
                    onChange={(e) => setResetConfirmText(e.target.value)}
                    placeholder='اكتب "حذف" للتأكيد'
                    className="glass"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsResetDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => resetSystemMutation.mutate()}
                    disabled={resetConfirmText !== "حذف" || resetSystemMutation.isPending}
                  >
                    {resetSystemMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "تأكيد الحذف"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        {/* Company Dialog */}
        <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCompany ? "تعديل الشركة" : "إضافة شركة جديدة"}
              </DialogTitle>
              <DialogDescription>
                أدخل بيانات الشركة
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="company-name">اسم الشركة *</Label>
                <Input
                  id="company-name"
                  value={newCompanyName}
                  onChange={(e) => setNewCompanyName(e.target.value)}
                  placeholder="شركة رينا برو للتقنية"
                />
              </div>
              <div>
                <Label htmlFor="company-phone">رقم الهاتف</Label>
                <Input
                  id="company-phone"
                  value={newCompanyPhone}
                  onChange={(e) => setNewCompanyPhone(e.target.value)}
                  placeholder="+966557111398"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="company-email">البريد الإلكتروني</Label>
                <Input
                  id="company-email"
                  value={newCompanyEmail}
                  onChange={(e) => setNewCompanyEmail(e.target.value)}
                  placeholder="info@company.com"
                  dir="ltr"
                />
              </div>
              <div>
                <Label htmlFor="company-address">العنوان</Label>
                <Input
                  id="company-address"
                  value={newCompanyAddress}
                  onChange={(e) => setNewCompanyAddress(e.target.value)}
                  placeholder="الرياض، المملكة العربية السعودية"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCompanyDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleSaveCompany}
                disabled={createCompanyMutation.isPending || updateCompanyMutation.isPending}
                className="neon-green-bg"
              >
                {(createCompanyMutation.isPending || updateCompanyMutation.isPending) ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="ml-2 h-4 w-4" />
                    حفظ
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
