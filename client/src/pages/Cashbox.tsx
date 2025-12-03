import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { UniversalUploader } from "@/components/UniversalUploader";
import { DataViewer } from "@/components/DataViewer";

export default function Cashbox() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <Wallet className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              الصندوق
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة الصندوق والمدفوعات النقدية
            </p>
          </div>

          {/* Upload Section */}
          <UniversalUploader
            module="cashbox"
            title="رفع بيانات الصندوق"
            description="قم برفع ملفات Excel أو PDF لتحليل بيانات الصندوق تلقائياً"
          />

          {/* Data Viewer */}
          <DataViewer
            module="cashbox"
            title="سجلات الصندوق"
          />

          {/* Features Card */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>الوظائف المتاحة</CardTitle>
              <CardDescription>
                يمكنك الآن رفع وتحليل بيانات الصندوق
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>رفع ملفات Excel للصندوق</li>
                <li>تحليل تلقائي للبيانات</li>
                <li>معاينة البيانات قبل الحفظ</li>
                <li>إرسال تقارير عبر WhatsApp</li>
                <li>تحديث لوحة التحكم تلقائياً</li>
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
