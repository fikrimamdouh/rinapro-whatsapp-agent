import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  MessageSquare,
  Power,
  PowerOff,
  Send,
  Users,
  Terminal,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

const WELCOME_MESSAGE = `أهــلـــاً ومرحبـــاً بك في جــروب إدارة التحصيل والمتــابعــة
🤖 المساعد التنفيذي الشخصي لك
بكامل جاهزيته… يبدأ نظام التحصيل الذكي خدمتك الآن، ليمنحك أعلى مستويات الدقّة في متابعة العملاء، السندات، الأقساط، المبيعات، المشتريات، المخازن، الصيانة، والأسطول… وكل ذلك عبر الواتس فقط وبضغطة زر.

⚡ مميزات التحكم الكامل عبر الواتس – النسخة التنفيذية المتقدمة ⚡

🌹 التحكم في المبيعات
• إنشاء طلب بيع أو استعلام عن فواتير اليوم
• تحليل أرباح الأصناف وحركة السوق
• معرفة أفضل وقت لزيادة أو خفض الأسعار
• مقارنة الفروع ومراقبة أداء مندوبي البيع

🌹 التحكم في المشتريات
• استعلام عن أوامر الشراء حسب المورد أو التاريخ
• تقييم الموردين ومعرفة أفضل سعر تم الشراء به
• اقتراح أفضل توقيت للشراء بناءً على حركة السوق
• تنبيه عند ارتفاع أسعار الصنف أو انخفاضه

🌹 التحكم في المخازن
• رصيد فوري لأي صنف عبر رسالة واحدة
• حركة المخزون (صرف – إضافة – جرد)
• كشف العجز، الزيادات، والحركات غير المعتادة
• أفضل 30 صنف حركة وأكثر الأصناف ركودًا

🌹 التحكم في الصيانة وقطع الغيار
• أوامر الشغل الجارية والمنتهية
• تكلفة كل عملية صيانة وربطها بالمخزون
• سجل الأعطال المتكررة وتحليل تكلفة المعدة
• تقرير استهلاك قطع الغيار بدقة

🌹 ربط كامل بأنظمة تتبع السيارات (GPS)
• متابعة المسارات والتوقفات
• معرفة عدد الترددات اليومية والمسافات
• تقييم أداء كل سائق وانضباطه
• ربط الرحلات بالفواتير والتحصيلات مباشرة

🌹 مساعد واتس تفاعلي
• اكتب: "هات كشف حساب أحمد علي" → يتحضر فورًا
• "مبيعات الأسبوع" → تحليل كامل بالأرقام
• "رصيد صنف 12" → يرجع الكمية بالمخازن
• "اعمل تقرير للمدير" → يرسل PDF كامل

🌹 إدارة مالية وتشغيلية فورية
• رصيد الخزينة
• المقبوضات والمدفوعات
• تسويات الصناديق
• كشف التحركات اليومية لكل فرع

🌹 متابعة فريق التحصيل
• عدد الزيارات – الإنجاز – المتأخرين – الحالات الحرجة
• تقرير مديونية يومي وأسبوعي وشهري
• كشف حسابات العملاء المتأخرة قبل حدوث المشكلة

🌹 اتخاذ قرارات الاستثمار لحظيًا
من خلال تحليل الحركة والأرقام يمكنك معرفة:
• متى تشتري؟
• متى تبيع؟
• كم تبيع؟
• هل الوقت مناسب لزيادة المخزون أم خفضه؟
• هل السوق في حالة صعود أم هبوط؟
— كل ذلك عبر رسالة واحدة فقط، ليكون النظام صديقك ومساعدك الشخصي في اتخاذ القرار.

🌹 مؤشرات تشغيل تنبّهك للقرارات الصحيحة
• "بيع الآن… السعر في ارتفاع"
• "لا تشترِ اليوم… التكلفة أعلى من المعتاد"
• "الصنف X عليه طلب غير طبيعي هذا الأسبوع"
• "ارتفاع حركة التكاليف في الصيانة"
• "سيارة رقم 14 خرجت عن النمط التشغيلي"

🌹 نظام مراقبة تشغيل لحظي
• من يعمل الآن؟
• ماذا تم إنجازه؟
• من لم يبدأ يومه؟
• متابعة التشغيل بدون فتح أي برنامج آخر

🌹 تقارير PDF فورية
• كشف حساب
• تقرير مديونية
• تقرير أسبوعي
• تحليل مبيعات
• تقرير مخزون
— جاهزة للطباعة والإرسال فورًا.

🌹 تذكير جماعي للمديونيات بضغطة زر
مع متابعة كاملة لمسار التحصيل والتشغيل لكل عميل حتى إقفال المديونية.

🌹 تذكير آلي لكل العملاء أصحاب المديونية
بضغطة زر واحدة يتم إرسال تذكير جماعي لكل العملاء المتأخرين، مع متابعة مسار التحصيل والتشغيل لكل عميل من أول رسالة حتى تمام السداد.

📞 للبدء، اكتب "مساعدة" أو "help" لعرض جميع الأوامر المتاحة.`;

export default function WhatsApp() {
  const [managerMessage, setManagerMessage] = useState("");

  const { data: status, refetch: refetchStatus } = trpc.whatsapp.status.useQuery();

  // Auto-refresh status every 3 seconds when not connected
  useEffect(() => {
    if (!status?.isConnected) {
      const interval = setInterval(() => {
        refetchStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [status?.isConnected, refetchStatus]);

  const { data: groups, refetch: refetchGroups } = trpc.whatsapp.getGroups.useQuery(undefined, {
    enabled: status?.isConnected === true,
  });
  
  const { data: messageLogs } = trpc.whatsapp.getMessageLogs.useQuery({ limit: 20 });

  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => {
      toast.success("جاري الاتصال بـ WhatsApp");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`فشل الاتصال: ${error.message}`);
    },
  });

  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("تم قطع الاتصال");
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`فشل قطع الاتصال: ${error.message}`);
    },
  });

  const sendToManagerMutation = trpc.whatsapp.sendToManager.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة للمدير");
      setManagerMessage("");
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح");
      refetchGroups();
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleSendToManager = () => {
    if (!managerMessage.trim()) {
      toast.error("الرجاء إدخال رسالة");
      return;
    }
    sendToManagerMutation.mutate({ message: managerMessage });
  };

  const handleSendWelcomeToGroup = (groupId: string, groupName: string) => {
    sendMessageMutation.mutate({ 
      to: groupId, 
      message: WELCOME_MESSAGE 
    });
    toast.info(`جاري إرسال رسالة الترحيب إلى: ${groupName}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">WhatsApp Integration</h1>
            <p className="text-muted-foreground">الربط الفعلي مع WhatsApp عبر Baileys</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        {/* Connection Status */}
        <Card className="glass-strong mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 neon-green" />
                <div>
                  <CardTitle>حالة الاتصال</CardTitle>
                  <CardDescription>حالة الاتصال الحالية بـ WhatsApp</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {status?.isConnected ? (
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">متصل</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-gray-500">
                    <XCircle className="h-5 w-5" />
                    <span className="font-semibold">غير متصل</span>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={handleConnect}
                disabled={status?.isConnected || connectMutation.isPending}
                className="neon-green-bg neon-green-border"
              >
                {connectMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري الاتصال...
                  </>
                ) : (
                  <>
                    <Power className="ml-2 h-4 w-4" />
                    اتصال
                  </>
                )}
              </Button>
              <Button
                onClick={handleDisconnect}
                disabled={!status?.isConnected || disconnectMutation.isPending}
                variant="destructive"
              >
                {disconnectMutation.isPending ? (
                  <>
                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                    جاري قطع الاتصال...
                  </>
                ) : (
                  <>
                    <PowerOff className="ml-2 h-4 w-4" />
                    قطع الاتصال
                  </>
                )}
              </Button>
            </div>

            {/* QR Code Display */}
            {status?.qrCode && !status?.isConnected && (
              <div className="mt-6 p-6 bg-white rounded-lg flex flex-col items-center gap-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">📱 امسح الرمز بهاتفك</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    افتح WhatsApp → الإعدادات → الأجهزة المرتبطة → ربط جهاز
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <QRCodeSVG
                    value={status.qrCode}
                    size={256}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center max-w-md">
                  💡 سيتم الاتصال تلقائياً بعد مسح الرمز
                </p>
              </div>
            )}

            {status?.lastConnected && (
              <p className="text-sm text-muted-foreground mt-4">
                آخر اتصال: {new Date(status.lastConnected).toLocaleString("ar-SA")}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Groups List */}
        {status?.isConnected && (
          <Card className="glass mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 neon-green" />
                المجموعات المتاحة
              </CardTitle>
              <CardDescription>
                جميع المجموعات المرتبطة بحسابك - اضغط لإرسال رسالة الترحيب
              </CardDescription>
            </CardHeader>
            <CardContent>
              {groups && groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {groups.map((group) => (
                    <Card key={group.id} className="glass-strong hover:border-green-500 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <Users className="h-4 w-4 neon-green flex-shrink-0" />
                              <h3 className="font-semibold truncate">{group.subject}</h3>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mb-3">
                              {group.id}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSendWelcomeToGroup(group.id, group.subject)}
                          disabled={sendMessageMutation.isPending}
                          className="w-full neon-green-bg neon-green-border"
                          size="sm"
                        >
                          {sendMessageMutation.isPending ? (
                            <>
                              <Loader2 className="ml-2 h-3 w-3 animate-spin" />
                              جاري الإرسال...
                            </>
                          ) : (
                            <>
                              <Sparkles className="ml-2 h-3 w-3" />
                              إرسال رسالة الترحيب
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لا توجد مجموعات متاحة</p>
                  <p className="text-sm mt-2">تأكد من إضافة الرقم إلى مجموعة WhatsApp</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Send to Manager */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 neon-green" />
                إرسال للمدير
              </CardTitle>
              <CardDescription>إرسال رسالة مباشرة لرقم المدير</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manager-message">الرسالة</Label>
                  <Input
                    id="manager-message"
                    value={managerMessage}
                    onChange={(e) => setManagerMessage(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    className="mt-2"
                  />
                </div>
                <Button
                  onClick={handleSendToManager}
                  disabled={!status?.isConnected || sendToManagerMutation.isPending}
                  className="w-full neon-green-bg"
                >
                  {sendToManagerMutation.isPending ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Send className="ml-2 h-4 w-4" />
                      إرسال
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Message Logs */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5 neon-green" />
                Terminal Log - سجل الرسائل
              </CardTitle>
              <CardDescription>آخر 20 رسالة</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {false ? (
                  <div></div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Terminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>لا توجد رسائل بعد</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
