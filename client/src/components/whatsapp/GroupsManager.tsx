import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { 
  Users, 
  Send, 
  Sparkles, 
  RefreshCw, 
  Loader2,
  MessageSquare 
} from "lucide-react";
import { toast } from "sonner";

export function GroupsManager() {
  const [selectedGroup, setSelectedGroup] = useState<string>("");
  const [message, setMessage] = useState<string>("");

  // جلب المجموعات
  const { data: groups, refetch: refetchGroups, isLoading } = trpc.whatsapp.getGroups.useQuery();

  // Mutation لإرسال رسالة
  const sendMessageMutation = trpc.whatsapp.sendToGroup.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة بنجاح!");
      setMessage("");
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  // Mutation لإرسال رسالة الترحيب
  const sendWelcomeMutation = trpc.whatsapp.sendToGroup.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال رسالة الترحيب بنجاح!");
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  const handleSendMessage = () => {
    if (!selectedGroup) {
      toast.error("يرجى اختيار مجموعة أولاً");
      return;
    }
    if (!message.trim()) {
      toast.error("يرجى كتابة رسالة");
      return;
    }

    sendMessageMutation.mutate({
      message: message.trim(),
    });
  };

  const handleSendWelcome = (groupJid: string) => {
    sendWelcomeMutation.mutate({
      message: "مرحبا", // سيتم استبدالها برسالة الترحيب الكاملة من commandEngine
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-green-500/20">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-400" />
            <div>
              <h2 className="text-2xl font-bold text-white">إدارة المجموعات</h2>
              <p className="text-sm text-gray-400">Groups Management</p>
            </div>
          </div>
          
          <Button
            onClick={() => refetchGroups()}
            variant="outline"
            size="sm"
            className="border-green-500/30 hover:bg-green-500/10"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Groups Count */}
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">عدد المجموعات</span>
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-lg px-3 py-1">
              {groups?.length || 0}
            </Badge>
          </div>
        </div>

        {/* Groups List */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-400" />
            المجموعات المتاحة
          </h3>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-green-400" />
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {groups.map((group) => (
                <div
                  key={group.id}
                  className={`bg-gray-800/50 rounded-lg p-4 border transition-all cursor-pointer ${
                    selectedGroup === group.id
                      ? "border-green-500 bg-green-500/10"
                      : "border-gray-700 hover:border-green-500/50"
                  }`}
                  onClick={() => setSelectedGroup(group.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{group.subject}</h4>
                      <p className="text-xs text-gray-400 font-mono">{group.id}</p>
                    </div>
                    
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSendWelcome(group.id);
                      }}
                      disabled={sendWelcomeMutation.isPending}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {sendWelcomeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" />
                          ترحيب
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>لا توجد مجموعات متاحة</p>
              <p className="text-sm mt-1">تأكد من اتصال WhatsApp أولاً</p>
            </div>
          )}
        </div>

        {/* Send Message Section */}
        {selectedGroup && (
          <div className="space-y-3 pt-4 border-t border-gray-700">
            <h3 className="text-lg font-semibold text-white">إرسال رسالة</h3>
            
            <div className="space-y-3">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="bg-gray-800 border-gray-700 text-white"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              
              <Button
                onClick={handleSendMessage}
                disabled={sendMessageMutation.isPending || !message.trim()}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                {sendMessageMutation.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    إرسال
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
