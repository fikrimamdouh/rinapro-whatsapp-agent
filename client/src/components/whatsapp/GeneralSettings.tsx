import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings, Save, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function GeneralSettings() {
  const [settings, setSettings] = useState({
    groupName: "إدارة التحصيل والمتابعة مصنع بن حامد",
    managerNumber: "+966557111398",
    autoReply: true,
    welcomeMessage: true,
    dailyReports: true,
    debtReminders: false,
    reportTime: "08:00",
    reminderTime: "10:00",
  });

  const [isSaving, setIsSaving] = useState(false);

  // جلب الإعدادات الحالية
  const { data: groupNameSetting } = trpc.settings.get.useQuery({ key: "GROUP_NAME" });
  const { data: managerNumberSetting } = trpc.settings.get.useQuery({ key: "MANAGER_NUMBER" });

  // تحديث الإعدادات عند التحميل
  useEffect(() => {
    if (groupNameSetting?.value) {
      setSettings(prev => ({ ...prev, groupName: groupNameSetting.value }));
    }
    if (managerNumberSetting?.value) {
      setSettings(prev => ({ ...prev, managerNumber: managerNumberSetting.value }));
    }
  }, [groupNameSetting, managerNumberSetting]);

  // Mutation لحفظ الإعدادات
  const saveGroupName = trpc.settings.set.useMutation();
  const saveManagerNumber = trpc.settings.set.useMutation();

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveGroupName.mutateAsync({
        key: "GROUP_NAME",
        value: settings.groupName,
        description: "اسم مجموعة WhatsApp للتقارير"
      });
      await saveManagerNumber.mutateAsync({
        key: "MANAGER_NUMBER",
        value: settings.managerNumber,
        description: "رقم المدير لاستقبال التنبيهات"
      });
      toast.success("تم حفظ الإعدادات بنجاح!");
    } catch (error: any) {
      toast.error(`فشل حفظ الإعدادات: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      groupName: "إدارة التحصيل والمتابعة مصنع بن حامد",
      managerNumber: "+966557111398",
      autoReply: true,
      welcomeMessage: true,
      dailyReports: true,
      debtReminders: false,
      reportTime: "08:00",
      reminderTime: "10:00",
    });
    toast.info("تم إعادة تعيين الإعدادات");
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">الإعدادات العامة</h2>
            <p className="text-sm text-gray-400">General Settings</p>
          </div>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Group Name */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-white">
              اسم المجموعة
            </Label>
            <Input
              id="groupName"
              value={settings.groupName}
              onChange={(e) =>
                setSettings({ ...settings, groupName: e.target.value })
              }
              placeholder="إدارة التحصيل والمتابعة مصنع بن حامد"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">
              اسم مجموعة WhatsApp التي سيتم إرسال التقارير إليها
            </p>
          </div>

          {/* Manager Number */}
          <div className="space-y-2">
            <Label htmlFor="managerNumber" className="text-white">
              رقم المدير
            </Label>
            <Input
              id="managerNumber"
              value={settings.managerNumber}
              onChange={(e) =>
                setSettings({ ...settings, managerNumber: e.target.value })
              }
              placeholder="+966557111398"
              className="bg-gray-800 border-gray-700 text-white"
            />
            <p className="text-xs text-gray-400">
              رقم المدير الذي سيستقبل التنبيهات والتقارير
            </p>
          </div>

          {/* Auto Reply */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div>
              <Label htmlFor="autoReply" className="text-white font-semibold">
                الرد التلقائي
              </Label>
              <p className="text-sm text-gray-400">
                تفعيل الرد التلقائي على الرسائل
              </p>
            </div>
            <Switch
              id="autoReply"
              checked={settings.autoReply}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, autoReply: checked })
              }
            />
          </div>

          {/* Welcome Message */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div>
              <Label htmlFor="welcomeMessage" className="text-white font-semibold">
                رسالة الترحيب
              </Label>
              <p className="text-sm text-gray-400">
                إرسال رسالة ترحيب تلقائية للأعضاء الجدد
              </p>
            </div>
            <Switch
              id="welcomeMessage"
              checked={settings.welcomeMessage}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, welcomeMessage: checked })
              }
            />
          </div>

          {/* Daily Reports */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div>
              <Label htmlFor="dailyReports" className="text-white font-semibold">
                التقارير اليومية
              </Label>
              <p className="text-sm text-gray-400">
                إرسال تقرير يومي تلقائي
              </p>
            </div>
            <Switch
              id="dailyReports"
              checked={settings.dailyReports}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, dailyReports: checked })
              }
            />
          </div>

          {/* Report Time */}
          {settings.dailyReports && (
            <div className="space-y-2 mr-8">
              <Label htmlFor="reportTime" className="text-white">
                وقت إرسال التقرير
              </Label>
              <Input
                id="reportTime"
                type="time"
                value={settings.reportTime}
                onChange={(e) =>
                  setSettings({ ...settings, reportTime: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}

          {/* Debt Reminders */}
          <div className="flex items-center justify-between bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div>
              <Label htmlFor="debtReminders" className="text-white font-semibold">
                تذكير المديونيات
              </Label>
              <p className="text-sm text-gray-400">
                إرسال تذكير تلقائي بالمديونيات
              </p>
            </div>
            <Switch
              id="debtReminders"
              checked={settings.debtReminders}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, debtReminders: checked })
              }
            />
          </div>

          {/* Reminder Time */}
          {settings.debtReminders && (
            <div className="space-y-2 mr-8">
              <Label htmlFor="reminderTime" className="text-white">
                وقت إرسال التذكير
              </Label>
              <Input
                id="reminderTime"
                type="time"
                value={settings.reminderTime}
                onChange={(e) =>
                  setSettings({ ...settings, reminderTime: e.target.value })
                }
                className="bg-gray-800 border-gray-700 text-white"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-700">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            size="lg"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                حفظ الإعدادات
              </>
            )}
          </Button>

          <Button
            onClick={handleReset}
            variant="outline"
            className="border-gray-700 hover:bg-gray-800"
            size="lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            إعادة تعيين
          </Button>
        </div>
      </div>
    </Card>
  );
}
