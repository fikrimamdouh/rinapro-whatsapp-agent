import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  MessageCircle, 
  CheckCircle, 
  XCircle,
  Clock,
  TrendingUp,
  Loader2
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export function LiveMonitoring() {
  // جلب الإحصائيات الحقيقية من قاعدة البيانات
  const { data: statsData, isLoading } = trpc.whatsapp.getStats.useQuery(undefined, {
    refetchInterval: 5000, // تحديث كل 5 ثوان
  });

  // جلب المجموعات لحساب عددها
  const { data: groups } = trpc.whatsapp.getGroups.useQuery(undefined, {
    refetchInterval: 10000, // تحديث كل 10 ثوان
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
        </div>
      </Card>
    );
  }

  const stats = {
    messagesSent: statsData?.messagesSent || 0,
    messagesReceived: statsData?.messagesReceived || 0,
    successRate: statsData?.successRate ? (statsData.successRate / 10).toFixed(1) : "0.0",
    failedMessages: statsData?.messagesFailed || 0,
    avgResponseTime: statsData?.avgResponseTime 
      ? `${(statsData.avgResponseTime / 1000).toFixed(1)}s` 
      : "N/A",
    activeGroups: groups?.length || 0,
  };

  // آخر نشاط من قاعدة البيانات
  const lastActivity = statsData?.lastActivity 
    ? {
        message: statsData.lastActivity,
        time: statsData.lastActivityTime 
          ? formatTimeAgo(new Date(statsData.lastActivityTime))
          : "غير متاح",
        type: statsData.lastActivityType || "sent",
      }
    : null;

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Activity className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">المراقبة الحية</h2>
            <p className="text-sm text-gray-400">Live Monitoring - Real-time Data</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">رسائل مرسلة</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.messagesSent}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <MessageCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">رسائل مستلمة</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.messagesReceived}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">معدل النجاح</span>
            </div>
            <p className="text-2xl font-bold text-green-400">{stats.successRate}%</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-400" />
              <span className="text-sm text-gray-400">رسائل فاشلة</span>
            </div>
            <p className="text-2xl font-bold text-red-400">{stats.failedMessages}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              <span className="text-sm text-gray-400">متوسط الاستجابة</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.avgResponseTime}</p>
          </div>

          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">مجموعات نشطة</span>
            </div>
            <p className="text-2xl font-bold text-white">{stats.activeGroups}</p>
          </div>
        </div>

        {/* Last Activity */}
        {lastActivity && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">آخر نشاط</h3>
            
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700 flex items-center gap-3">
              {lastActivity.type === "failed" ? (
                <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
              ) : (
                <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className="text-white font-medium">{lastActivity.message}</p>
                <p className="text-sm text-gray-400">{lastActivity.time}</p>
              </div>

              <Badge
                variant={
                  lastActivity.type === "sent" 
                    ? "default" 
                    : lastActivity.type === "received" 
                    ? "secondary" 
                    : "destructive"
                }
                className="text-xs"
              >
                {lastActivity.type === "sent" 
                  ? "مرسل" 
                  : lastActivity.type === "received" 
                  ? "مستلم" 
                  : "فشل"}
              </Badge>
            </div>
          </div>
        )}

        {/* Live Indicator */}
        <div className="flex items-center justify-center gap-2 text-green-400">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-semibold">المراقبة نشطة - تحديث تلقائي كل 5 ثوان</span>
        </div>
      </div>
    </Card>
  );
}

// دالة مساعدة لتحويل الوقت إلى "منذ X"
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "الآن";
  if (diffMins === 1) return "منذ دقيقة";
  if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return "منذ ساعة";
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "منذ يوم";
  return `منذ ${diffDays} يوم`;
}
