import { BackToHome } from "@/components/BackToHome";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { UniversalUploader } from "@/components/UniversalUploader";

export default function Reports() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-6xl">
        <BackToHome />
        
        <div className="mt-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-4 rounded-full neon-green-bg">
                <BarChart3 className="h-12 w-12 neon-green" />
              </div>
            </div>
            <h1 className="text-4xl font-bold neon-green">
              التقارير اليومية
            </h1>
            <p className="text-xl text-muted-foreground">
              تقارير الحركة والتحليلات المالية
            </p>
          </div>

          {/* Upload Section */}
          <UniversalUploader
            module="reports"
            title="رفع بيانات التقارير"
            description="قم برفع ملفات Excel أو PDF لتحليل البيانات وإنشاء التقارير تلقائياً"
          />

          {/* Features Card */}
          <Card className="glass-strong">
            <CardHeader>
              <CardTitle>الوظائف المتاحة</CardTitle>
              <CardDescription>
                هذه الصفحة قيد التطوير حالياً
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                سيتم إضافة الوظائف التالية قريباً:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground mr-4">
                <li>تقرير الإيرادات اليومية</li>
                <li>تقرير المصروفات اليومية</li>
                <li>تقرير الأرصدة والحسابات</li>
                <li>تقرير حركة المخزون</li>
                <li>تقرير المبيعات والمشتريات</li>
                <li>تحليل الأرباح والخسائر</li>
                <li>تصدير التقارير إلى Excel وPDF</li>
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
