import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function Sales() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <ShoppingCart className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              المبيعات
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة طلبات المبيعات والتحليلات
            </p>
          </div>

          {/* Status Card */}
          <Card className="glass-strong border-yellow-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-yellow-500" />
                قيد التطوير
              </CardTitle>
              <CardDescription>
                هذه الصفحة قيد التطوير حالياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                سيتم إضافة الوظائف التالية قريباً:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>إنشاء طلبات مبيعات جديدة</li>
                <li>عرض وإدارة الطلبات الحالية</li>
                <li>تحليل الأرباح والمبيعات</li>
                <li>مقارنة أداء الفروع</li>
                <li>تقارير المبيعات اليومية والشهرية</li>
                <li>إدارة العروض والخصومات</li>
                <li>تتبع حالة الطلبات</li>
              </ul>
              
              <div className="pt-4">
                <Link href="/">
                  <Button className="w-full sm:w-auto">
                    <ArrowRight className="ml-2 h-4 w-4" />
                    العودة إلى لوحة التحكم
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
