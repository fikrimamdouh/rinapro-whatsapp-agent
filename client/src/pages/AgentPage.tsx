/**
 * AI Agent Page
 * صفحة الوكيل الذكي
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Play, Square, RefreshCw, TestTube, Globe, LogIn, Database } from "lucide-react";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";

export default function AgentPage() {
  const [isRunning, setIsRunning] = useState(false);

  // الحصول على حالة Agent
  const { data: status, refetch: refetchStatus } = trpc.agent.getStatus.useQuery(undefined, {
    refetchInterval: 5000, // تحديث كل 5 ثواني
  });

  // تشغيل المزامنة يدوياً
  const runSync = trpc.agent.runSync.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  // بدء الجدولة
  const startScheduler = trpc.agent.startScheduler.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  // إيقاف الجدولة
  const stopScheduler = trpc.agent.stopScheduler.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  // اختبار الاتصال
  const testConnection = trpc.agent.testConnection.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`${data.message}\n${data.data?.title || ""}`);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  // اختبار تسجيل الدخول
  const testLogin = trpc.agent.testLogin.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  // سحب البيانات
  const fetchData = trpc.agent.fetchData.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(
          `${data.message}\nالعملاء: ${data.data?.customersCount}\nالفواتير: ${data.data?.invoicesCount}\nالمدفوعات: ${data.data?.paymentsCount}\nالمنتجات: ${data.data?.productsCount}`
        );
      } else {
        toast.error(data.message);
      }
    },
    onError: (error) => {
      toast.error(`حدث خطأ: ${error.message}`);
    },
  });

  const handleRunSync = async () => {
    setIsRunning(true);
    try {
      await runSync.mutateAsync();
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <BackToHome />
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
            🤖 الوكيل الذكي
          </h1>
          <p className="text-gray-400">
            مزامنة تلقائية للبيانات من المواقع الخارجية
          </p>
        </div>

        {/* Status Card */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-400 flex items-center gap-2">
              <Database className="w-5 h-5" />
              حالة النظام
            </CardTitle>
            <CardDescription className="text-gray-400">
              معلومات عن حالة الوكيل الذكي والجدولة
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">حالة الجدولة</span>
                <Badge variant={status?.running ? "default" : "secondary"}>
                  {status?.running ? "مفعل" : "متوقف"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">المزامنة الحالية</span>
                <Badge variant={status?.syncInProgress ? "default" : "secondary"}>
                  {status?.syncInProgress ? "قيد التنفيذ" : "متوقف"}
                </Badge>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">الموعد القادم</span>
                <span className="text-green-400 font-mono">
                  {status?.nextRun || "غير محدد"}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <span className="text-gray-300">الموقع المستهدف</span>
                <span className="text-blue-400 text-sm truncate max-w-[200px]">
                  {status?.config?.targetUrl || "غير محدد"}
                </span>
              </div>
            </div>

            {/* Sync Settings */}
            <div className="p-4 bg-gray-800/30 rounded-lg space-y-2">
              <h3 className="text-green-400 font-semibold mb-3">إعدادات المزامنة</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Badge variant={status?.config?.syncCustomers ? "default" : "secondary"}>
                  {status?.config?.syncCustomers ? "✓" : "✗"} العملاء
                </Badge>
                <Badge variant={status?.config?.syncInvoices ? "default" : "secondary"}>
                  {status?.config?.syncInvoices ? "✓" : "✗"} الفواتير
                </Badge>
                <Badge variant={status?.config?.syncPayments ? "default" : "secondary"}>
                  {status?.config?.syncPayments ? "✓" : "✗"} المدفوعات
                </Badge>
                <Badge variant={status?.config?.syncProducts ? "default" : "secondary"}>
                  {status?.config?.syncProducts ? "✓" : "✗"} المنتجات
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <Card className="bg-gray-900/50 border-gray-800 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-400">لوحة التحكم</CardTitle>
            <CardDescription className="text-gray-400">
              إدارة وتشغيل الوكيل الذكي
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Main Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={handleRunSync}
                disabled={isRunning || runSync.isPending || status?.syncInProgress}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 h-16"
              >
                {runSync.isPending || isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري المزامنة...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    تشغيل المزامنة الآن
                  </>
                )}
              </Button>

              {status?.running ? (
                <Button
                  onClick={() => stopScheduler.mutate()}
                  disabled={stopScheduler.isPending}
                  variant="destructive"
                  className="h-16"
                >
                  {stopScheduler.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      جاري الإيقاف...
                    </>
                  ) : (
                    <>
                      <Square className="w-5 h-5 mr-2" />
                      إيقاف الجدولة التلقائية
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => startScheduler.mutate()}
                  disabled={startScheduler.isPending}
                  variant="outline"
                  className="h-16 border-green-600 text-green-400 hover:bg-green-600/10"
                >
                  {startScheduler.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      جاري التشغيل...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5 mr-2" />
                      تفعيل الجدولة التلقائية
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Test Actions */}
            <div className="border-t border-gray-800 pt-4 mt-4">
              <h3 className="text-gray-300 font-semibold mb-3">اختبارات</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Button
                  onClick={() => testConnection.mutate()}
                  disabled={testConnection.isPending}
                  variant="outline"
                  className="border-gray-700"
                >
                  {testConnection.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  اختبار الاتصال
                </Button>

                <Button
                  onClick={() => testLogin.mutate()}
                  disabled={testLogin.isPending}
                  variant="outline"
                  className="border-gray-700"
                >
                  {testLogin.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <LogIn className="w-4 h-4 mr-2" />
                  )}
                  اختبار تسجيل الدخول
                </Button>

                <Button
                  onClick={() => fetchData.mutate()}
                  disabled={fetchData.isPending}
                  variant="outline"
                  className="border-gray-700"
                >
                  {fetchData.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4 mr-2" />
                  )}
                  اختبار سحب البيانات
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-green-400">ℹ️ معلومات</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-2">
            <p>• الوكيل الذكي يقوم بالمزامنة التلقائية يومياً في الساعة 6 صباحاً</p>
            <p>• يتم سحب البيانات من الموقع المستهدف وتحديث قاعدة البيانات تلقائياً</p>
            <p>• سيتم إرسال تقرير مفصل عبر WhatsApp بعد كل عملية مزامنة</p>
            <p>• يمكنك تشغيل المزامنة يدوياً في أي وقت من خلال الزر أعلاه</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
