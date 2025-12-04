import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  QrCode, 
  CheckCircle2, 
  XCircle,
  Loader2,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import QRCodeLib from "qrcode";

export function ConnectionStatus() {
  const [qrCode, setQrCode] = useState<string>("");
  const [qrCodeImage, setQrCodeImage] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);

  // جلب حالة الاتصال
  const { data: status, refetch: refetchStatus } = trpc.whatsapp.status.useQuery(
    undefined,
    {
      refetchInterval: 3000, // تحديث كل 3 ثواني
    }
  );

  // Mutation للاتصال
  const connectMutation = trpc.whatsapp.connect.useMutation({
    onSuccess: () => {
      toast.success("جاري الاتصال... يرجى مسح QR Code");
      setIsConnecting(true);
      refetchStatus();
    },
    onError: (error) => {
      // تجاهل خطأ Connection Closed
      if (!error.message.includes('Connection Closed')) {
        toast.error(`فشل الاتصال: ${error.message}`);
      }
      setIsConnecting(false);
    },
  });

  // Mutation لقطع الاتصال
  const disconnectMutation = trpc.whatsapp.disconnect.useMutation({
    onSuccess: () => {
      toast.success("تم قطع الاتصال بنجاح");
      setQrCode("");
      setIsConnecting(false);
      refetchStatus();
    },
    onError: (error) => {
      toast.error(`فشل قطع الاتصال: ${error.message}`);
    },
  });

  // Mutation لتسجيل الخروج (إلغاء الجلسة)
  const logoutMutation = trpc.whatsapp.logout.useMutation({
    onSuccess: () => {
      toast.success("تم تسجيل الخروج وإلغاء الجلسة بنجاح");
      setQrCode("");
      setIsConnecting(false);
      refetchStatus();
      // إعادة الاتصال تلقائياً للحصول على QR جديد
      setTimeout(() => {
        connectMutation.mutate();
      }, 1000);
    },
    onError: (error) => {
      toast.error(`فشل تسجيل الخروج: ${error.message}`);
    },
  });

  // تحديث QR Code عند تغيير الحالة
  useEffect(() => {
    if (status?.qrCode) {
      setQrCode(status.qrCode);
      setIsConnecting(true);
      
      // تحويل QR Code النصي إلى صورة
      QRCodeLib.toDataURL(status.qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
        .then((url) => {
          setQrCodeImage(url);
        })
        .catch((err) => {
          console.error('Error generating QR code:', err);
          toast.error('فشل في إنشاء QR Code');
        });
    }
    if (status?.connected) {
      setIsConnecting(false);
      setQrCode("");
      setQrCodeImage("");
    }
  }, [status]);

  const handleConnect = () => {
    connectMutation.mutate();
  };

  const handleDisconnect = () => {
    disconnectMutation.mutate();
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const isConnected = status?.connected || false;
  const isLoading = connectMutation.isPending || disconnectMutation.isPending || logoutMutation.isPending;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isConnected ? (
              <Wifi className="w-8 h-8 text-green-400" />
            ) : (
              <WifiOff className="w-8 h-8 text-red-400" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">حالة الاتصال</h2>
              <p className="text-sm text-gray-400">WhatsApp Connection Status</p>
            </div>
          </div>
          
          <Badge
            variant={isConnected ? "default" : "destructive"}
            className={`text-lg px-4 py-2 ${
              isConnected
                ? "bg-green-500/20 text-green-400 border-green-500/50"
                : "bg-red-500/20 text-red-400 border-red-500/50"
            }`}
          >
            {isConnected ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                متصل
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                غير متصل
              </div>
            )}
          </Badge>
        </div>

        {/* Status Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">حالة الجلسة</p>
            <p className="text-lg font-semibold text-white">
              {status?.status || "غير متصل"}
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">الرد التلقائي</p>
            <p className="text-lg font-semibold text-white">
              {status?.autoReply ? "مفعل ✅" : "معطل ❌"}
            </p>
          </div>
        </div>

        {/* QR Code Display */}
        {qrCode && !isConnected && (
          <div className="bg-white p-6 rounded-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-gray-800">
                <QrCode className="w-6 h-6" />
                <h3 className="text-xl font-bold">امسح QR Code</h3>
              </div>
              {qrCodeImage ? (
                <img
                  src={qrCodeImage}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64 border-4 border-green-500 rounded-lg"
                />
              ) : (
                <div className="w-64 h-64 border-4 border-green-500 rounded-lg flex items-center justify-center bg-gray-100">
                  <Loader2 className="w-12 h-12 animate-spin text-green-600" />
                </div>
              )}
              <div className="text-center text-sm text-gray-600 space-y-1">
                <p>1. افتح WhatsApp على هاتفك</p>
                <p>2. اذهب إلى: الإعدادات → الأجهزة المرتبطة</p>
                <p>3. اضغط "ربط جهاز" وامسح الكود</p>
              </div>
              {isConnecting && (
                <div className="flex items-center gap-2 text-green-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>في انتظار المسح...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          {!isConnected ? (
            <Button
              onClick={handleConnect}
              disabled={isLoading || isConnecting}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {isLoading || isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  جاري الاتصال...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  اتصال جديد (QR Code)
                </>
              )}
            </Button>
          ) : (
            <>
              <Button
                onClick={handleDisconnect}
                disabled={isLoading}
                variant="destructive"
                className="flex-1"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري قطع الاتصال...
                  </>
                ) : (
                  <>
                    <WifiOff className="w-5 h-5 mr-2" />
                    قطع الاتصال
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleLogout}
                disabled={isLoading}
                variant="outline"
                className="flex-1 border-orange-500/30 hover:bg-orange-500/10 text-orange-400"
                size="lg"
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري تسجيل الخروج...
                  </>
                ) : (
                  <>
                    <LogOut className="w-5 h-5 mr-2" />
                    إعادة ربط (QR جديد)
                  </>
                )}
              </Button>
            </>
          )}
          
          <Button
            onClick={() => refetchStatus()}
            variant="outline"
            size="lg"
            className="border-green-500/30 hover:bg-green-500/10"
          >
            <RefreshCw className="w-5 h-5" />
          </Button>
        </div>

        {/* Railway Compatibility Warning */}
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="text-3xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-orange-300 mb-2">
                  مشكلة توافق مع Railway
                </h3>
                <p className="text-sm text-orange-200 mb-3">
                  مكتبة Baileys (المستخدمة للاتصال بـ WhatsApp) لها مشاكل معروفة على منصة Railway.
                  WhatsApp يرفض الاتصال من بعض الخوادم (Error 405).
                </p>
                
                <div className="bg-orange-500/20 rounded-lg p-4 mb-3">
                  <p className="text-sm text-orange-100 font-semibold mb-2">
                    📊 حالة الاتصال:
                  </p>
                  <ul className="text-sm text-orange-200 space-y-1">
                    <li>❌ Baileys على Railway: لا يعمل</li>
                    <li>✅ جميع الميزات الأخرى: تعمل بشكل طبيعي</li>
                    <li>✅ قاعدة البيانات: محفوظة ودائمة</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-orange-300 font-semibold">
                    🔧 الحلول البديلة:
                  </p>
                  <div className="space-y-2 text-sm text-orange-200">
                    <div className="bg-green-500/10 border border-green-500/30 rounded p-3">
                      <p className="font-semibold text-green-300 mb-1">
                        ✅ الحل الموصى به: WhatsApp Business API
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-green-200">
                        <li>احترافي وموثوق 100%</li>
                        <li>مجاني حتى 1000 رسالة/شهر</li>
                        <li>يعمل على أي منصة</li>
                        <li>دعم رسمي من Meta</li>
                      </ul>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
                      <p className="font-semibold text-blue-300 mb-1">
                        📱 بديل: Twilio WhatsApp API
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-blue-200">
                        <li>سهل الإعداد (15 دقيقة)</li>
                        <li>$0.005 لكل رسالة</li>
                        <li>API بسيط وواضح</li>
                      </ul>
                    </div>

                    <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3">
                      <p className="font-semibold text-purple-300 mb-1">
                        🖥️ بديل: نشر على VPS آخر
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-purple-200">
                        <li>DigitalOcean أو Linode</li>
                        <li>$4-5/شهر</li>
                        <li>Baileys قد يعمل على IPs مختلفة</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-orange-500/30">
                  <p className="text-xs text-orange-300">
                    💡 <strong>ملاحظة:</strong> جميع ميزات التطبيق الأخرى (العملاء، الفواتير، الحسابات، المخزون، إلخ) تعمل بشكل طبيعي.
                    فقط ميزة WhatsApp تحتاج حل بديل.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Connection Tips */}
        {!isConnected && !qrCode && !isConnecting && false && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <div className="space-y-2">
              <p className="text-sm text-blue-300">
                💡 <strong>للاتصال لأول مرة:</strong>
              </p>
              <ol className="text-sm text-blue-200 list-decimal list-inside space-y-1">
                <li>اضغط زر "اتصال جديد (QR Code)"</li>
                <li>انتظر ظهور QR Code (5-10 ثواني)</li>
                <li>امسح الكود من هاتفك</li>
              </ol>
            </div>
          </div>
        )}
        
        {isConnecting && !qrCode && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-yellow-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              <p className="text-sm">
                جاري إنشاء QR Code... يرجى الانتظار
              </p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
