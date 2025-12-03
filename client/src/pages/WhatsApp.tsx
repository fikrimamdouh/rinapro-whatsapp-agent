import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ConnectionStatus } from "@/components/whatsapp/ConnectionStatus";
import { GroupsManager } from "@/components/whatsapp/GroupsManager";
import { QuickActions } from "@/components/whatsapp/QuickActions";
import { LiveMonitoring } from "@/components/whatsapp/LiveMonitoring";
import { GeneralSettings } from "@/components/whatsapp/GeneralSettings";
import { SendMessage } from "@/components/whatsapp/SendMessage";
import { BackToHome } from "@/components/BackToHome";
import { trpc } from "@/lib/trpc";
import { 
  Wifi, 
  Users, 
  Zap, 
  Activity, 
  Settings,
  MessageSquare,
  Send
} from "lucide-react";

type TabType = "connection" | "groups" | "actions" | "monitoring" | "settings" | "send";

export default function WhatsApp() {
  const [activeTab, setActiveTab] = useState<TabType>("connection");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black">
      
        <BackToHome />
        {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-green-500 to-emerald-600 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <MessageSquare className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                لوحة تحكم WhatsApp
              </h1>
              <p className="text-green-100">
                WhatsApp Business Management Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Tabs Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 bg-gray-900/50 p-2 rounded-lg border border-green-500/20 mb-6">
          <Button
            onClick={() => setActiveTab("connection")}
            variant={activeTab === "connection" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "connection"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Wifi className="w-4 h-4" />
            <span className="hidden sm:inline">الاتصال</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("groups")}
            variant={activeTab === "groups" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "groups"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">المجموعات</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("actions")}
            variant={activeTab === "actions" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "actions"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">إجراءات سريعة</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("monitoring")}
            variant={activeTab === "monitoring" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "monitoring"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span className="hidden sm:inline">المراقبة</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("settings")}
            variant={activeTab === "settings" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "settings"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">الإعدادات</span>
          </Button>
          
          <Button
            onClick={() => setActiveTab("send")}
            variant={activeTab === "send" ? "default" : "ghost"}
            className={`flex items-center gap-2 ${
              activeTab === "send"
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "text-gray-300 hover:text-white hover:bg-gray-800"
            }`}
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">إرسال رسائل</span>
          </Button>
        </div>

        {/* Tab Contents - Conditional Rendering */}
        <div className="space-y-6">
          {activeTab === "connection" && <ConnectionStatus />}
          {activeTab === "groups" && <GroupsManager />}
          {activeTab === "actions" && <QuickActions />}
          {activeTab === "monitoring" && <LiveMonitoring />}
          {activeTab === "settings" && <GeneralSettings />}
          {activeTab === "send" && <SendMessage />}
        </div>
      </div>

      {/* Footer */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gray-900/50 rounded-lg p-6 border border-green-500/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <h3 className="text-green-400 font-semibold mb-2">نظام ذكي</h3>
              <p className="text-gray-400 text-sm">
                يفهم الأسئلة بالعربي الطبيعي ويرد تلقائياً
              </p>
            </div>
            <div>
              <h3 className="text-green-400 font-semibold mb-2">تقارير فورية</h3>
              <p className="text-gray-400 text-sm">
                تقارير PDF جاهزة بضغطة واحدة
              </p>
            </div>
            <div>
              <h3 className="text-green-400 font-semibold mb-2">إدارة كاملة</h3>
              <p className="text-gray-400 text-sm">
                تحكم كامل في المبيعات والمشتريات والمخزون
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
