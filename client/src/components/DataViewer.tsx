import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, Download, Send } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface DataViewerProps {
  module: "sales" | "inventory" | "cashbox" | "reports" | "purchases" | "maintenance" | "logistics";
  title: string;
}

export function DataViewer({ module, title }: DataViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const { data: uploadedData, isLoading, refetch } = trpc.uploads.getUploadedData.useQuery({
    module,
    limit: 100,
  });

  const { data: uploadHistory } = trpc.uploads.getUploadHistory.useQuery({
    module,
    limit: 10,
  });

  const sendWhatsAppMutation = trpc.whatsapp.sendToManager.useMutation();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const handleSendSummary = async () => {
    try {
      const totalRecords = uploadedData?.data?.length || 0;
      const summary = `📊 *ملخص ${title}*\n\n` +
        `📁 عدد السجلات: ${totalRecords}\n` +
        `📅 آخر تحديث: ${new Date().toLocaleString("ar-SA")}\n\n` +
        `تم إنشاء التقرير تلقائياً من نظام RinaPro`;

      await sendWhatsAppMutation.mutateAsync({ message: summary });
      toast.success("تم إرسال الملخص عبر WhatsApp");
    } catch (error: any) {
      toast.error(`فشل إرسال الملخص: ${error.message}`);
    }
  };

  const filteredData = uploadedData?.data?.filter((row: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return Object.values(row).some((value) =>
      String(value).toLowerCase().includes(searchLower)
    );
  }) || [];

  const sortedData = [...filteredData].sort((a: any, b: any) => {
    if (!sortField) return 0;
    const aVal = a[sortField];
    const bVal = b[sortField];
    const direction = sortDirection === "asc" ? 1 : -1;
    return aVal > bVal ? direction : -direction;
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">جاري التحميل...</p>
        </CardContent>
      </Card>
    );
  }

  const headers = sortedData.length > 0 ? Object.keys(sortedData[0]).filter(k => k !== "id" && k !== "uploadId") : [];

  return (
    <Card className="glass-strong">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendSummary}
              disabled={sendWhatsAppMutation.isLoading}
            >
              <Send className="ml-2 h-4 w-4" />
              إرسال ملخص
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          إجمالي السجلات: {sortedData.length}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Upload History */}
        {uploadHistory && uploadHistory.uploads && uploadHistory.uploads.length > 0 && (
          <div className="text-sm text-muted-foreground">
            آخر رفع: {new Date(uploadHistory.uploads[0].createdAt).toLocaleString("ar-SA")} 
            ({uploadHistory.uploads[0].successRows} سجل)
          </div>
        )}

        {/* Data Table */}
        {sortedData.length > 0 ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="max-h-[600px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead
                        key={header}
                        className="whitespace-nowrap cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort(header)}
                      >
                        <div className="flex items-center gap-2">
                          {header}
                          <ArrowUpDown className="h-3 w-3" />
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData.map((row: any, index: number) => (
                    <TableRow key={index}>
                      {headers.map((header) => (
                        <TableCell key={header} className="whitespace-nowrap">
                          {typeof row[header] === "number" && header.includes("Price")
                            ? (row[header] / 100).toFixed(2)
                            : typeof row[header] === "number" && header.includes("amount")
                            ? (row[header] / 100).toFixed(2)
                            : row[header] instanceof Date
                            ? new Date(row[header]).toLocaleDateString("ar-SA")
                            : String(row[header] || "")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد بيانات لعرضها. قم برفع ملف Excel أو PDF أولاً.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
