import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Download,
  FileSpreadsheet,
  FileText,
  Trash2,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface DataActionsProps {
  entityName: string;
  onImportExcel: (file: File) => Promise<void>;
  onExportExcel: () => void;
  onExportPDF?: () => void;
  onDownloadTemplate: () => void;
  onResetData?: () => Promise<void>;
  isImporting?: boolean;
  hasData?: boolean;
}

export function DataActions({
  entityName,
  onImportExcel,
  onExportExcel,
  onExportPDF,
  onDownloadTemplate,
  onResetData,
  isImporting = false,
  hasData = false,
}: DataActionsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel صالح (.xlsx أو .xls)");
      return;
    }

    try {
      await onImportExcel(file);
    } catch (error) {
      console.error("Import error:", error);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleReset = async () => {
    if (!onResetData) return;
    setIsResetting(true);
    try {
      await onResetData();
      setIsResetDialogOpen(false);
      toast.success(`تم حذف جميع ${entityName} بنجاح`);
    } catch (error) {
      toast.error(`فشل حذف ${entityName}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />

        <Button
          variant="outline"
          className="neon-green-border"
          onClick={() => fileInputRef.current?.click()}
          disabled={isImporting}
        >
          {isImporting ? (
            <Loader2 className="ml-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="ml-2 h-4 w-4" />
          )}
          استيراد Excel
        </Button>

        <Button
          variant="outline"
          onClick={onDownloadTemplate}
        >
          <FileSpreadsheet className="ml-2 h-4 w-4" />
          تحميل القالب
        </Button>

        {hasData && (
          <>
            <Button
              variant="outline"
              onClick={onExportExcel}
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Excel
            </Button>

            {onExportPDF && (
              <Button
                variant="outline"
                onClick={onExportPDF}
              >
                <FileText className="ml-2 h-4 w-4" />
                تصدير PDF
              </Button>
            )}

            {onResetData && (
              <Button
                variant="destructive"
                onClick={() => setIsResetDialogOpen(true)}
              >
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الكل
              </Button>
            )}
          </>
        )}
      </div>

      <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <DialogContent className="glass-strong">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الحذف
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف جميع {entityName}؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsResetDialogOpen(false)}
              disabled={isResetting}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري الحذف...
                </>
              ) : (
                "حذف الكل"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
