import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { UniversalUploader } from "@/components/UniversalUploader";
import { DataViewer } from "@/components/DataViewer";

export default function Inventory() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <Package className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              المخزون
            </h1>
            <p className="text-xl text-muted-foreground">
              إدارة المخزون والمنتجات
            </p>
          </div>

          {/* Upload Section */}
          <UniversalUploader
            module="inventory"
            title="رفع بيانات المخزون"
            description="قم برفع ملفات Excel أو PDF لتحليل بيانات المخزون تلقائياً"
          />

          {/* Data Viewer */}
          <DataViewer
            module="inventory"
            title="سجلات المخزون"
          />

          {/* Features Card */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>الوظائف المتاحة</CardTitle>
              <CardDescription>
                يمكنك الآن رفع وتحليل بيانات المخزون
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>رفع ملفات Excel للمنتجات</li>
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
