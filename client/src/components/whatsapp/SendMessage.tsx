import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, User, Users, Home } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function SendMessage() {
  const [messageToManager, setMessageToManager] = useState("");
  const [messageToGroup, setMessageToGroup] = useState("");
  
  const sendToManagerMutation = trpc.whatsapp.sendToManager.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة للمدير بنجاح");
      setMessageToManager("");
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  const sendToGroupMutation = trpc.whatsapp.sendToGroup.useMutation({
    onSuccess: () => {
      toast.success("تم إرسال الرسالة للجروب بنجاح");
      setMessageToGroup("");
    },
    onError: (error) => {
      toast.error(`فشل الإرسال: ${error.message}`);
    },
  });

  const handleSendToManager = () => {
    if (!messageToManager.trim()) {
      toast.error("الرجاء كتابة رسالة");
      return;
    }
    sendToManagerMutation.mutate({ message: messageToManager });
  };

  const handleSendToGroup = () => {
    if (!messageToGroup.trim()) {
      toast.error("الرجاء كتابة رسالة");
      return;
    }
    sendToGroupMutation.mutate({ message: messageToGroup });
  };

  return (
    <div className="space-y-6">
      {/* زر العودة للرئيسية */}
      <Button
        variant="outline"
        className="mb-4"
        onClick={() => window.location.href = "/"}
      >
        <Home className="w-4 h-4 mr-2" />
        العودة للرئيسية
      </Button>

      {/* إرسال للمدير */}
      <Card className="bg-gray-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="w-5 h-5 text-green-500" />
            إرسال للمدير
          </CardTitle>
          <CardDescription className="text-gray-400">
            إرسال رسالة مباشرة لرقم المدير
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="messageToManager" className="text-white">
              اكتب رسالتك هنا...
            </Label>
            <Textarea
              id="messageToManager"
              value={messageToManager}
              onChange={(e) => setMessageToManager(e.target.value)}
              placeholder="مثال: تقرير المبيعات اليومية جاهز للمراجعة"
              className="mt-2 bg-gray-800/50 border-gray-700 text-white min-h-[120px]"
              disabled={sendToManagerMutation.isPending}
            />
          </div>
          <Button
            onClick={handleSendToManager}
            disabled={sendToManagerMutation.isPending || !messageToManager.trim()}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendToManagerMutation.isPending ? "جاري الإرسال..." : "إرسال"}
          </Button>
        </CardContent>
      </Card>

      {/* إرسال للجروب */}
      <Card className="bg-gray-900/50 border-green-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="w-5 h-5 text-green-500" />
            إرسال للجروب
          </CardTitle>
          <CardDescription className="text-gray-400">
            إرسال رسالة للجروب المحدد
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="messageToGroup" className="text-white">
              اكتب رسالتك هنا...
            </Label>
            <Textarea
              id="messageToGroup"
              value={messageToGroup}
              onChange={(e) => setMessageToGroup(e.target.value)}
              placeholder="مثال: تذكير: اجتماع الفريق غداً الساعة 10 صباحاً"
              className="mt-2 bg-gray-800/50 border-gray-700 text-white min-h-[120px]"
              disabled={sendToGroupMutation.isPending}
            />
          </div>
          <Button
            onClick={handleSendToGroup}
            disabled={sendToGroupMutation.isPending || !messageToGroup.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4 mr-2" />
            {sendToGroupMutation.isPending ? "جاري الإرسال..." : "إرسال"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
