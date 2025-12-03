import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "wouter";
import { UniversalUploader } from "@/components/UniversalUploader";

export default function Maintenance() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <Wrench className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              الصيانة
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة طلبات الصيانة والخدمات
            </p>
          </div>

          {/* Upload Section */}
          <UniversalUploader
            module="maintenance"
            title="رفع بيانات الصيانة"
            description="قم برفع ملفات Excel أو PDF لتحليل بيانات الصيانة تلقائياً"
          />

          {/* Features Card */}
          <Card className="glass-strong">
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
                <li>تسجيل طلبات الصيانة</li>
                <li>تتبع حالة الطلبات</li>
                <li>جدولة مواعيد الصيانة</li>
                <li>إدارة الفنيين والمهندسين</li>
                <li>تقارير الصيانة الدورية</li>
                <li>إدارة قطع الغيار</li>
                <li>تكاليف الصيانة والإصلاح</li>
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
