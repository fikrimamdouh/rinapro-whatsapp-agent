import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  FileText, 
  Bell, 
  Users, 
  TrendingUp,
  Package,
  DollarSign,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export function QuickActions() {
  const sendMessageMutation = trpc.whatsapp.sendMessage.useMutation();

  const sendToGroup = async (command: string) => {
    try {
      toast.loading("جاري إرسال الأمر...");
      await sendMessageMutation.mutateAsync({
        to: "group",
        message: command,
      });
      toast.success("✅ تم إرسال الأمر للجروب");
    } catch (error: any) {
      toast.error(`❌ خطأ: ${error.message}`);
    }
  };
  const actions = [
    {
      id: "daily-report",
      title: "تقرير يومي",
      description: "إرسال تقرير المبيعات اليومي",
      icon: FileText,
      color: "blue",
      action: () => sendToGroup("تقرير يومي"),
    },
    {
      id: "debt-reminders",
      title: "تذكير المديونيات",
      description: "إرسال تذكير جماعي للعملاء",
      icon: Bell,
      color: "orange",
      action: () => sendToGroup("تذكير المديونيات"),
    },
    {
      id: "customer-balance",
      title: "أرصدة العملاء",
      description: "عرض جميع أرصدة العملاء",
      icon: Users,
      color: "green",
      action: () => sendToGroup("أرصدة العملاء"),
    },
    {
      id: "sales-summary",
      title: "ملخص المبيعات",
      description: "ملخص مبيعات الأسبوع",
      icon: TrendingUp,
      color: "purple",
      action: () => sendToGroup("ملخص المبيعات"),
    },
    {
      id: "inventory-alert",
      title: "تنبيه المخزون",
      description: "الأصناف القريبة من النفاد",
      icon: Package,
      color: "red",
      action: () => sendToGroup("تنبيه المخزون"),
    },
    {
      id: "collection-status",
      title: "حالة التحصيل",
      description: "متابعة فريق التحصيل",
      icon: DollarSign,
      color: "yellow",
      action: () => sendToGroup("حالة التحصيل"),
    },
    {
      id: "overdue-installments",
      title: "أقساط متأخرة",
      description: "قائمة الأقساط المتأخرة",
      icon: AlertCircle,
      color: "pink",
      action: () => sendToGroup("أقساط متأخرة"),
    },
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; border: string; icon: string }> = {
      blue: { bg: "bg-blue-500/10", border: "border-blue-500/30", icon: "text-blue-400" },
      orange: { bg: "bg-orange-500/10", border: "border-orange-500/30", icon: "text-orange-400" },
      green: { bg: "bg-green-500/10", border: "border-green-500/30", icon: "text-green-400" },
      purple: { bg: "bg-purple-500/10", border: "border-purple-500/30", icon: "text-purple-400" },
      red: { bg: "bg-red-500/10", border: "border-red-500/30", icon: "text-red-400" },
      yellow: { bg: "bg-yellow-500/10", border: "border-yellow-500/30", icon: "text-yellow-400" },
      pink: { bg: "bg-pink-500/10", border: "border-pink-500/30", icon: "text-pink-400" },
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Zap className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">الإجراءات السريعة</h2>
            <p className="text-sm text-gray-400">Quick Actions</p>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action) => {
            const Icon = action.icon;
            const colors = getColorClasses(action.color);
            
            return (
              <Button
                key={action.id}
                onClick={action.action}
                variant="outline"
                className={`h-auto p-4 flex flex-col items-start gap-3 ${colors.bg} ${colors.border} hover:scale-105 transition-transform`}
              >
                <div className="flex items-center gap-3 w-full">
                  <Icon className={`w-6 h-6 ${colors.icon}`} />
                  <h3 className="text-white font-semibold text-right flex-1">
                    {action.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-400 text-right w-full">
                  {action.description}
                </p>
              </Button>
            );
          })}
        </div>

        {/* Info */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>نصيحة:</strong> استخدم الإجراءات السريعة لتوفير الوقت وإنجاز المهام الشائعة بضغطة واحدة
          </p>
        </div>
      </div>
    </Card>
  );
}
