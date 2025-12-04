import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Bot,
  Send,
  Mic,
  Loader2,
  Sparkles,
} from "lucide-react";

export default function AIAssistant() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Array<{role: string; content: string}>>([]);
  const [isRecording, setIsRecording] = useState(false);

  const askMutation = trpc.ai.askQuestion.useMutation({
    onSuccess: (data) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: question },
        { role: 'assistant', content: data.answer }
      ]);
      setQuestion("");
    },
    onError: (error) => {
      toast.error(\`خطأ: \${error.message}\`);
    },
  });

  const { data: suggestions } = trpc.ai.getSuggestions.useQuery();

  const handleAsk = () => {
    if (!question.trim()) return;
    askMutation.mutate({ question });
  };

  const handleSuggestion = (suggestion: string) => {
    setQuestion(suggestion);
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-4xl">
        <BackToHome />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-green mb-2 flex items-center gap-3">
            <Bot className="w-10 h-10" />
            المساعد الذكي
          </h1>
          <p className="text-muted-foreground">اسأل أي سؤال محاسبي وسأجيبك فوراً</p>
        </div>

        {/* Suggestions */}
        <Card className="mb-6 glass-strong">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              أسئلة مقترحة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {suggestions?.suggestions.map((s, i) => (
                <Button
                  key={i}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuggestion(s)}
                  className="text-sm"
                >
                  {s}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6 glass-strong">
          <CardContent className="p-6">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bot className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>ابدأ بطرح سؤال...</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={\`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}\`}
                  >
                    <div
                      className={\`max-w-[80%] p-4 rounded-lg \${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-800 text-white'
                      }\`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <Card className="glass-strong">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                placeholder="اكتب سؤالك هنا..."
                className="flex-1 glass"
                disabled={askMutation.isPending}
              />
              <Button
                onClick={handleAsk}
                disabled={askMutation.isPending || !question.trim()}
                className="neon-green-bg"
              >
                {askMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => toast.info("الرسائل الصوتية قريباً")}
                disabled={isRecording}
              >
                <Mic className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="mt-6 bg-blue-500/10 border-blue-500/30">
          <CardContent className="p-4">
            <p className="text-sm text-blue-300">
              💡 <strong>نصيحة:</strong> يمكنك السؤال عن أرصدة العملاء، الموردين، الحسابات، وأي معلومة محاسبية أخرى.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
