import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ExcelUploaderProps {
  title: string;
  description: string;
  onUpload: (fileBase64: string) => Promise<{
    success: boolean;
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: string[];
    message: string;
  }>;
  onDownloadTemplate: () => Promise<{
    fileBase64: string;
    filename: string;
  }>;
}

export function ExcelUploader({
  title,
  description,
  onUpload,
  onDownloadTemplate,
}: ExcelUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    totalRows: number;
    successCount: number;
    failedCount: number;
    errors: string[];
    message: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("❌ الرجاء اختيار ملف Excel (.xlsx أو .xls)");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      // قراءة الملف كـ Base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const fileBase64 = base64.split(",")[1]; // إزالة البادئة

          // رفع الملف
          const uploadResult = await onUpload(fileBase64);
          setResult(uploadResult);

          if (uploadResult.success) {
            toast.success(uploadResult.message);
          } else {
            toast.error(uploadResult.message);
          }
        } catch (error: any) {
          toast.error(`❌ خطأ في معالجة الملف: ${error.message}`);
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("❌ فشل قراءة الملف");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(`❌ خطأ: ${error.message}`);
      setUploading(false);
    }

    // إعادة تعيين input
    e.target.value = "";
  };

  const handleDownloadTemplate = async () => {
    try {
      const { fileBase64, filename } = await onDownloadTemplate();

      // تحويل Base64 إلى Blob
      const byteCharacters = atob(fileBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // تحميل الملف
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("✅ تم تحميل القالب بنجاح");
    } catch (error: any) {
      toast.error(`❌ فشل تحميل القالب: ${error.message}`);
    }
  };

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <FileSpreadsheet className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {/* زر رفع الملف */}
          <label className="flex-1 min-w-[200px]">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
            <Button
              type="button"
              variant="default"
              className="w-full"
              disabled={uploading}
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
            >
              <Upload className="ml-2 h-4 w-4" />
              {uploading ? "جاري الرفع..." : "رفع ملف Excel"}
            </Button>
          </label>

          {/* زر تحميل القالب */}
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[200px]"
            onClick={handleDownloadTemplate}
          >
            <Download className="ml-2 h-4 w-4" />
            تحميل قالب Excel
          </Button>
        </div>

        {/* عرض النتائج */}
        {result && (
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-semibold text-foreground">نتائج الاستيراد</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-md bg-background/50 p-3 text-center">
                <div className="text-2xl font-bold text-foreground">{result.totalRows}</div>
                <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
              </div>
              <div className="rounded-md bg-green-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-green-500">{result.successCount}</div>
                <div className="text-sm text-muted-foreground">تم بنجاح</div>
              </div>
              <div className="rounded-md bg-red-500/10 p-3 text-center">
                <div className="text-2xl font-bold text-red-500">{result.failedCount}</div>
                <div className="text-sm text-muted-foreground">فشل</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  الأخطاء ({result.errors.length})
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md bg-background/50 p-3 text-sm">
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-muted-foreground">
                      • {error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
