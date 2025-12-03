import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import { Settings as SettingsIcon, Save, Loader2, Trash2, BookOpen, AlertTriangle } from "lucide-react";
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
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState("");

  const utils = trpc.useUtils();
  const { data: settings } = trpc.settings.list.useQuery();

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

  useEffect(() => {
    if (settings && Array.isArray(settings)) {
      const manager = settings.find((s) => s.settingKey === "MANAGER_NUMBER");
      const group = settings.find((s) => s.settingKey === "GROUP_NAME");
      const token = settings.find((s) => s.settingKey === "API_TOKEN");

      if (manager) setManagerNumber(manager.settingValue || "");
      if (group) setGroupName(group.settingValue || "");
      if (token) setApiToken(token.settingValue || "");
    }
  }, [settings]);

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
      </div>
    </div>
  );
}
