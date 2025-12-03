import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Download, FileSpreadsheet, FileText, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UniversalUploaderProps {
  module: "sales" | "inventory" | "cashbox" | "reports" | "purchases" | "maintenance" | "logistics";
  title: string;
  description: string;
  acceptedTypes?: string[];
  maxFiles?: number;
}

export function UniversalUploader({
  module,
  title,
  description,
  acceptedTypes = [".xlsx", ".xls", ".pdf"],
  maxFiles = 2,
}: UniversalUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const uploadExcelMutation = trpc.uploads.uploadExcel.useMutation();
  const uploadPDFMutation = trpc.uploads.uploadPDF.useMutation();
  const downloadTemplateMutation = trpc.uploads.downloadTemplate.useMutation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > maxFiles) {
      toast.error(`يمكنك رفع ${maxFiles} ملف كحد أقصى`);
      return;
    }

    files.forEach((file) => handleFile(file));
  }, [maxFiles]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > maxFiles) {
      toast.error(`يمكنك رفع ${maxFiles} ملف كحد أقصى`);
      return;
    }

    files.forEach((file) => handleFile(file));
    e.target.value = "";
  };

  const handleFile = async (file: File) => {
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    
    if (!acceptedTypes.includes(fileExt)) {
      toast.error(`نوع الملف غير مدعوم. الأنواع المدعومة: ${acceptedTypes.join(", ")}`);
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setPreviewData(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const base64 = event.target?.result as string;
          const fileBase64 = base64.split(",")[1];

          if (fileExt === ".pdf") {
            // Upload PDF
            const result = await uploadPDFMutation.mutateAsync({
              module,
              fileBase64,
              filename: file.name,
            });

            if (result.success) {
              toast.success(result.message);
              setUploadResult(result);
            } else {
              toast.error(result.message);
            }
          } else {
            // Upload Excel
            const result = await uploadExcelMutation.mutateAsync({
              module,
              fileBase64,
              filename: file.name,
            });

            if (result.success) {
              toast.success(result.message);
              setPreviewData(result.data?.slice(0, 10) || []); // Show first 10 rows
              setPreviewHeaders(result.headers || []);
              setUploadResult(result);
            } else {
              toast.error(result.message);
              setUploadResult(result);
            }
          }
        } catch (error: any) {
          toast.error(`خطأ في معالجة الملف: ${error.message}`);
        } finally {
          setUploading(false);
        }
      };

      reader.onerror = () => {
        toast.error("فشل قراءة الملف");
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error: any) {
      toast.error(`خطأ: ${error.message}`);
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const result = await downloadTemplateMutation.mutateAsync({ module });

      if (result.success && result.fileBase64) {
        const byteCharacters = atob(result.fileBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.filename || `template-${module}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success("تم تحميل القالب بنجاح");
      }
    } catch (error: any) {
      toast.error(`فشل تحميل القالب: ${error.message}`);
    }
  };

  return (
    <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Upload className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="text-muted-foreground">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drag and Drop Area */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/10"
              : "border-border hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept={acceptedTypes.join(",")}
            onChange={handleFileInput}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            multiple={maxFiles > 1}
          />
          
          <div className="space-y-3">
            {uploading ? (
              <>
                <Loader2 className="h-12 w-12 mx-auto text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">جاري رفع الملف...</p>
              </>
            ) : (
              <>
                <div className="flex justify-center gap-2">
                  <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">اسحب الملفات هنا أو انقر للاختيار</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    الأنواع المدعومة: {acceptedTypes.join(", ")} (حد أقصى {maxFiles} ملف)
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 min-w-[200px]"
            onClick={handleDownloadTemplate}
            disabled={uploading}
          >
            <Download className="ml-2 h-4 w-4" />
            تحميل قالب Excel
          </Button>
        </div>

        {/* Preview Table */}
        {previewData && previewData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              معاينة البيانات (أول 10 صفوف)
            </h4>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {previewHeaders.map((header, index) => (
                        <TableHead key={index} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewData.map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {previewHeaders.map((header, colIndex) => (
                          <TableCell key={colIndex} className="whitespace-nowrap">
                            {typeof row[header] === "object"
                              ? JSON.stringify(row[header])
                              : String(row[header] || "")}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Upload Result */}
        {uploadResult && (
          <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
            <div className="flex items-center gap-2">
              {uploadResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <h4 className="font-semibold text-foreground">نتائج الرفع</h4>
            </div>

            {uploadResult.totalRows !== undefined && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-md bg-background/50 p-3 text-center">
                  <div className="text-2xl font-bold text-foreground">{uploadResult.totalRows}</div>
                  <div className="text-sm text-muted-foreground">إجمالي السجلات</div>
                </div>
                <div className="rounded-md bg-green-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-green-500">
                    {uploadResult.data?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">تم بنجاح</div>
                </div>
                <div className="rounded-md bg-red-500/10 p-3 text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {uploadResult.errors?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">أخطاء</div>
                </div>
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  الأخطاء ({uploadResult.errors.length})
                </div>
                <div className="max-h-40 overflow-y-auto rounded-md bg-background/50 p-3 text-sm">
                  {uploadResult.errors.map((error: string, index: number) => (
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
