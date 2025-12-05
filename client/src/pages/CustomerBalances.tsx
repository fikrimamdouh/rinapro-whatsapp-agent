import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  Users,
  Search,
  Upload,
  Download,
  Trash2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Send,
  RefreshCw,
  AlertTriangle,
  Filter,
  MessageSquare,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import * as XLSX from 'xlsx';
import { Link } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  parseExcelFile,
  generateExcelFile,
  CUSTOMER_BALANCE_COLUMNS,
  formatCurrency,
} from "@/lib/excel";

export default function CustomerBalances() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [smartFilter, setSmartFilter] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [minBalance, setMinBalance] = useState<string>("");
  const [maxBalance, setMaxBalance] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: customerBalances, isLoading, refetch } = trpc.customerBalances.getAll.useQuery();
  
  // تطبيق الفلاتر الذكية
  let filteredBalances = customerBalances || [];
  
  // فلتر البحث
  if (searchQuery.length > 0) {
    filteredBalances = filteredBalances.filter(c => 
      c.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customerCode?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  
  // الفلاتر الذكية لكشف التلاعب
  if (smartFilter === "openingMatchesDebit") {
    // الرصيد السابق مطابق للحركة المدينة (مشبوه جداً)
    filteredBalances = filteredBalances.filter(c => {
      const previousBalance = c.previousBalance || 0;
      const debit = c.debit || 0;
      // إذا كان الرصيد السابق = المدين تماماً (فرق أقل من 1 هللة)
      return Math.abs(previousBalance - debit) <= 1 && debit !== 0;
    });
  } else if (smartFilter === "openingWithMovementToZero") {
    // رصيد أول المدة + حركة = رصيد نهائي صفر (مشبوه!)
    filteredBalances = filteredBalances.filter(c => {
      const previousBalance = c.previousBalance || 0;
      const hasMovement = (c.debit || 0) !== 0 || (c.credit || 0) !== 0;
      const currentBalance = c.currentBalance || 0;
      // كان له رصيد سابق + حدثت حركة + الرصيد النهائي صفر
      return previousBalance !== 0 && hasMovement && Math.abs(currentBalance) <= 1;
    });
  } else if (smartFilter === "zero") {
    // رصيد صفر
    filteredBalances = filteredBalances.filter(c => Math.abs(c.currentBalance || 0) <= 1);
  } else if (smartFilter === "debit") {
    // مدينون (رصيد موجب)
    filteredBalances = filteredBalances.filter(c => (c.currentBalance || 0) > 0);
  } else if (smartFilter === "credit") {
    // دائنون (رصيد سالب)
    filteredBalances = filteredBalances.filter(c => (c.currentBalance || 0) < 0);
  } else if (smartFilter === "top10") {
    // أكبر 10 عملاء
    filteredBalances = [...filteredBalances]
      .sort((a, b) => Math.abs(b.currentBalance || 0) - Math.abs(a.currentBalance || 0))
      .slice(0, 10);
  } else if (smartFilter === "bottom10") {
    // أصغر 10 عملاء
    filteredBalances = [...filteredBalances]
      .sort((a, b) => Math.abs(a.currentBalance || 0) - Math.abs(b.currentBalance || 0))
      .slice(0, 10);
  } else if (smartFilter === "range") {
    // نطاق محدد (من - إلى)
    const min = minBalance ? parseFloat(minBalance) * 100 : -Infinity;
    const max = maxBalance ? parseFloat(maxBalance) * 100 : Infinity;
    filteredBalances = filteredBalances.filter(c => {
      const balance = Math.abs(c.currentBalance || 0);
      return balance >= min && balance <= max;
    });
  } else if (smartFilter === "suspicious") {
    // حالات مشبوهة: رصيد سالب كبير أو حركة غير منطقية
    filteredBalances = filteredBalances.filter(c => {
      const balance = c.currentBalance || 0;
      const movement = (c.debit || 0) + (c.credit || 0);
      return balance < -100000 || movement > 1000000;
    });
  } else if (smartFilter === "negativeBalance") {
    // رصيد سالب (دائن)
    filteredBalances = filteredBalances.filter(c => 
      (c.currentBalance || 0) < 0
    );
  } else if (smartFilter === "largeMovement") {
    // حركة كبيرة (أكثر من 500,000 هللة = 5,000 ريال)
    filteredBalances = filteredBalances.filter(c => 
      ((c.debit || 0) + (c.credit || 0)) > 500000
    );
  } else if (smartFilter === "noMovement") {
    // لا توجد حركة (مدين ودائن = 0)
    filteredBalances = filteredBalances.filter(c => 
      (c.debit || 0) === 0 && (c.credit || 0) === 0
    );
  } else if (smartFilter === "balanceMismatch") {
    // عدم تطابق الرصيد: الرصيد الحالي لا يساوي (الرصيد السابق + المدين - الدائن)
    filteredBalances = filteredBalances.filter(c => {
      const expectedBalance = (c.previousBalance || 0) + (c.debit || 0) - (c.credit || 0);
      const actualBalance = c.currentBalance || 0;
      // فرق أكثر من 1 هللة يعتبر خطأ
      return Math.abs(actualBalance - expectedBalance) > 1;
    });
  } else if (smartFilter === "zeroOpening") {
    // رصيد افتتاحي صفر (رصيد سابق = 0)
    filteredBalances = filteredBalances.filter(c => 
      (c.previousBalance || 0) === 0
    );
  } else if (smartFilter === "hasOpening") {
    // لديه رصيد افتتاحي (رصيد سابق ≠ 0)
    filteredBalances = filteredBalances.filter(c => 
      (c.previousBalance || 0) !== 0
    );
  } else if (smartFilter === "debitOnly") {
    // حركة مدين فقط (لا يوجد دائن)
    filteredBalances = filteredBalances.filter(c => 
      (c.debit || 0) > 0 && (c.credit || 0) === 0
    );
  } else if (smartFilter === "creditOnly") {
    // حركة دائن فقط (لا يوجد مدين)
    filteredBalances = filteredBalances.filter(c => 
      (c.credit || 0) > 0 && (c.debit || 0) === 0
    );
  } else if (smartFilter === "bothMovements") {
    // حركة مدين ودائن معاً
    filteredBalances = filteredBalances.filter(c => 
      (c.debit || 0) > 0 && (c.credit || 0) > 0
    );
  } else if (smartFilter === "highDebit") {
    // مدين كبير (أكثر من 10,000 ر.س)
    filteredBalances = filteredBalances.filter(c => 
      (c.debit || 0) > 1000000
    );
  } else if (smartFilter === "highCredit") {
    // دائن كبير (أكثر من 10,000 ر.س)
    filteredBalances = filteredBalances.filter(c => 
      (c.credit || 0) > 1000000
    );
  } else if (smartFilter === "balanceIncreased") {
    // الرصيد زاد (الرصيد الحالي > الرصيد السابق)
    filteredBalances = filteredBalances.filter(c => 
      (c.currentBalance || 0) > (c.previousBalance || 0)
    );
  } else if (smartFilter === "balanceDecreased") {
    // الرصيد نقص (الرصيد الحالي < الرصيد السابق)
    filteredBalances = filteredBalances.filter(c => 
      (c.currentBalance || 0) < (c.previousBalance || 0)
    );
  } else if (smartFilter === "debitMoreThanCredit") {
    // المدين أكبر من الدائن
    filteredBalances = filteredBalances.filter(c => 
      (c.debit || 0) > (c.credit || 0) && (c.credit || 0) > 0
    );
  } else if (smartFilter === "creditMoreThanDebit") {
    // الدائن أكبر من المدين
    filteredBalances = filteredBalances.filter(c => 
      (c.credit || 0) > (c.debit || 0) && (c.debit || 0) > 0
    );
  } else if (smartFilter === "roundNumbers") {
    // أرقام مدورة (مشبوه - قد يكون تقدير)
    filteredBalances = filteredBalances.filter(c => {
      const balance = Math.abs(c.currentBalance || 0);
      // رقم مدور إذا كان من مضاعفات 100,000 هللة (1,000 ر.س)
      return balance > 0 && balance % 100000 === 0;
    });
  } else if (smartFilter === "exactMatch") {
    // الرصيد السابق = الرصيد الحالي (لا توجد حركة فعلية)
    filteredBalances = filteredBalances.filter(c => 
      Math.abs((c.currentBalance || 0) - (c.previousBalance || 0)) <= 1 && 
      ((c.debit || 0) > 0 || (c.credit || 0) > 0)
    );
  }

  const uploadBatchMutation = trpc.customerBalances.uploadBatch.useMutation({
    onSuccess: () => {
      // سيتم استدعاء refetch بعد كل الـ batches
    },
    onError: (error) => {
      toast.error(`فشل الرفع: ${error.message}`);
      setIsImporting(false);
    },
  });

  const deleteAllMutation = trpc.customerBalances.deleteAll.useMutation({
    onSuccess: () => {
      toast.success("تم حذف جميع البيانات بنجاح");
      setIsDeleteAllDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      toast.error("يرجى اختيار ملف Excel صالح");
      return;
    }

    setIsImporting(true);
    try {
      console.log('📁 Reading file:', file.name);
      
      const data = await parseExcelFile<{
        customerCode: string | number;
        customerName?: string;
        previousBalance?: number;
        debit?: number;
        credit?: number;
        currentBalance?: number;
      }>(file, CUSTOMER_BALANCE_COLUMNS, { headerRowIndex: 2 });
      
      console.log('📊 Parsed data:', data.length, 'rows');
      console.log('📋 Sample:', JSON.stringify(data.slice(0, 2), null, 2));
      
      if (!data || data.length === 0) {
        toast.error("الملف لا يحتوي على بيانات صالحة");
        return;
      }
      
      // Clean data - add default values for missing fields and filter invalid rows
      const cleanedData = data
        .filter(item => {
          // Skip rows with invalid data (headers, totals, etc.)
          const code = String(item.customerCode || '').trim();
          const name = String(item.customerName || '').trim();
          
          // Skip if both are empty
          if (!code && !name) return false;
          
          // Skip if code is "العميل" (header row)
          if (code === 'العميل' || name === 'العميل') return false;
          
          // Skip if it's a header row (contains keywords)
          const combined = (code + ' ' + name).toLowerCase();
          if (combined.includes('ميزان') || 
              combined.includes('مراجعه') ||
              combined.includes('اجمالي') ||
              combined.includes('المجموع') ||
              combined.includes('total') ||
              combined.includes('الكود')) {
            return false;
          }
          
          return true;
        })
        .map(item => ({
          customerCode: item.customerCode || '',
          customerName: item.customerName || '',
          previousBalance: item.previousBalance || 0,
          debit: item.debit || 0,
          credit: item.credit || 0,
          currentBalance: item.currentBalance || 0,
        }));
      
      console.log('🧹 Cleaned data sample:', JSON.stringify(cleanedData.slice(0, 2), null, 2));
      
      // Split into batches of 50 rows (smaller for stability)
      const BATCH_SIZE = 50;
      const batches = [];
      for (let i = 0; i < cleanedData.length; i += BATCH_SIZE) {
        batches.push(cleanedData.slice(i, i + BATCH_SIZE));
      }
      
      console.log(`📦 Split into ${batches.length} batches`);
      
      let totalSuccess = 0;
      let totalFailed = 0;
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`📤 Sending batch ${i + 1}/${batches.length}...`);
        toast.loading(`جاري الاستيراد... ${i + 1}/${batches.length}`, { id: 'import-progress' });
        
        try {
          const result = await uploadBatchMutation.mutateAsync({ 
            data: batches[i],
            isFirstBatch: i === 0,
            isLastBatch: i === batches.length - 1
          });
          
          totalSuccess += result.count || 0;
          
          console.log(`✅ Batch ${i + 1} done: ${result.count} rows`);
        } catch (error: any) {
          console.error(`❌ Batch ${i + 1} failed:`, error);
          totalFailed += batches[i].length;
        }
      }
      
      toast.dismiss('import-progress');
      toast.success(`تم استيراد ${totalSuccess} سجل بنجاح`);
      
      // تحديث البيانات
      await refetch();
    } catch (error: any) {
      console.error("❌ Import error:", error);
      console.error("Error details:", error.message, error.data);
      toast.error(`فشل الاستيراد: ${error.message || 'خطأ غير معروف'}`);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleExportExcel = () => {
    const balancesArray = Array.isArray(customerBalances) ? customerBalances : [];
    if (balancesArray.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    const exportData = balancesArray.map(b => ({
      customerCode: b.customerCode,
      customerName: b.customerName,
      previousBalance: (b.previousBalance || 0) / 100,
      debit: (b.debit || 0) / 100,
      credit: (b.credit || 0) / 100,
      currentBalance: (b.currentBalance || 0) / 100,
    }));
    generateExcelFile(exportData, CUSTOMER_BALANCE_COLUMNS, "أرصدة_العملاء");
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleExportFilteredExcel = () => {
    if (displayBalances.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }
    
    // تحديد اسم الملف حسب الفلتر
    let fileName = "أرصدة_العملاء";
    if (smartFilter === "openingMatchesDebit") {
      fileName = "رصيد_سابق_يساوي_مدين";
    } else if (smartFilter === "openingWithMovementToZero") {
      fileName = "رصيد_وحركة_يساوي_صفر";
    } else if (smartFilter === "balanceMismatch") {
      fileName = "أخطاء_حسابية";
    } else if (smartFilter === "negativeBalance") {
      fileName = "عملاء_دائنون";
    } else if (smartFilter === "largeMovement") {
      fileName = "حركة_كبيرة";
    } else if (smartFilter === "noMovement") {
      fileName = "بدون_حركة";
    } else if (smartFilter === "suspicious") {
      fileName = "حالات_مشبوهة";
    } else if (smartFilter === "zero") {
      fileName = "رصيد_صفر";
    } else if (smartFilter === "debit") {
      fileName = "عملاء_مدينون";
    } else if (smartFilter === "credit") {
      fileName = "عملاء_دائنون";
    } else if (smartFilter === "top10") {
      fileName = "أكبر_10_عملاء";
    } else if (smartFilter === "bottom10") {
      fileName = "أصغر_10_عملاء";
    } else if (smartFilter === "range") {
      fileName = `نطاق_من_${minBalance || 0}_إلى_${maxBalance || "∞"}`;
    } else if (smartFilter === "debitOnly") {
      fileName = "حركة_مدين_فقط";
    } else if (smartFilter === "creditOnly") {
      fileName = "حركة_دائن_فقط";
    } else if (smartFilter === "bothMovements") {
      fileName = "حركة_مدين_ودائن";
    } else if (smartFilter === "highDebit") {
      fileName = "مدين_كبير";
    } else if (smartFilter === "highCredit") {
      fileName = "دائن_كبير";
    } else if (smartFilter === "balanceIncreased") {
      fileName = "الرصيد_زاد";
    } else if (smartFilter === "balanceDecreased") {
      fileName = "الرصيد_نقص";
    } else if (smartFilter === "debitMoreThanCredit") {
      fileName = "المدين_أكبر_من_الدائن";
    } else if (smartFilter === "creditMoreThanDebit") {
      fileName = "الدائن_أكبر_من_المدين";
    } else if (smartFilter === "roundNumbers") {
      fileName = "أرقام_مدورة_مشبوهة";
    } else if (smartFilter === "exactMatch") {
      fileName = "رصيد_سابق_يساوي_حالي";
    }
    
    const exportData = displayBalances.map(b => ({
      'كود العميل': b.customerCode || '',
      'اسم العميل': b.customerName,
      'رقم الهاتف': b.phone || '',
      'رصيد سابق': (b.previousBalance || 0) / 100,
      'مدين': (b.debit || 0) / 100,
      'دائن': (b.credit || 0) / 100,
      'رصيد حالي': (b.currentBalance || 0) / 100,
      'الحالة': (b.currentBalance || 0) > 0 ? 'مدين' : (b.currentBalance || 0) < 0 ? 'دائن' : 'صفر',
    }));
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // تنسيق العرض
    const colWidths = [
      { wch: 12 }, // كود العميل
      { wch: 25 }, // اسم العميل
      { wch: 15 }, // رقم الهاتف
      { wch: 12 }, // رصيد سابق
      { wch: 12 }, // مدين
      { wch: 12 }, // دائن
      { wch: 12 }, // رصيد حالي
      { wch: 10 }, // الحالة
    ];
    ws['!cols'] = colWidths;
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'نتيجة الفلتر');
    
    // إضافة ورقة ملخص
    const summaryData = [
      { 'البيان': 'عدد العملاء', 'القيمة': displayBalances.length },
      { 'البيان': 'إجمالي الأرصدة', 'القيمة': (displayBalances.reduce((sum, b) => sum + (b.currentBalance || 0), 0) / 100).toFixed(2) },
      { 'البيان': 'إجمالي المدين', 'القيمة': (displayBalances.reduce((sum, b) => sum + (b.debit || 0), 0) / 100).toFixed(2) },
      { 'البيان': 'إجمالي الدائن', 'القيمة': (displayBalances.reduce((sum, b) => sum + (b.credit || 0), 0) / 100).toFixed(2) },
      { 'البيان': 'الفلتر المطبق', 'القيمة': smartFilter === "all" ? "الكل" : fileName.replace(/_/g, ' ') },
      { 'البيان': 'تاريخ التصدير', 'القيمة': new Date().toLocaleString('ar-SA') },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    wsSummary['!cols'] = [{ wch: 20 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSummary, 'الملخص');
    
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success(`تم تصدير ${displayBalances.length} سجل بنجاح`);
  };

  // Filter and sort functions
  const getFilteredBalances = () => {
    let filtered = Array.isArray(customerBalances) ? customerBalances : [];
    
    // Apply search
    if (searchQuery.length > 0) {
      filtered = filtered.filter(b => 
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.customerCode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply balance filters
    if (filterType === "zero") {
      filtered = filtered.filter(b => b.currentBalance === 0);
    } else if (filterType === "range" && (minBalance || maxBalance)) {
      const min = minBalance ? parseFloat(minBalance) * 100 : -Infinity;
      const max = maxBalance ? parseFloat(maxBalance) * 100 : Infinity;
      filtered = filtered.filter(b => {
        const balance = b.currentBalance || 0;
        return balance >= min && balance <= max;
      });
    } else if (filterType === "debit") {
      filtered = filtered.filter(b => (b.currentBalance || 0) > 0);
    } else if (filterType === "credit") {
      filtered = filtered.filter(b => (b.currentBalance || 0) < 0);
    } else if (filterType === "top10") {
      filtered = [...filtered].sort((a, b) => Math.abs(b.currentBalance || 0) - Math.abs(a.currentBalance || 0)).slice(0, 10);
    } else if (filterType === "bottom10") {
      filtered = [...filtered].sort((a, b) => Math.abs(a.currentBalance || 0) - Math.abs(b.currentBalance || 0)).slice(0, 10);
    }
    
    return filtered;
  };
  
  const handleQuickSend = (balance: any) => {
    if (!balance.customerPhone) {
      toast.error("لا يوجد رقم هاتف لهذا العميل");
      return;
    }

    const finalBalance = (balance.currentBalance || 0) / 100;
    const balanceType = finalBalance > 0 ? "مدين" : finalBalance < 0 ? "دائن" : "صفر";
    const previousBalance = (balance.previousBalance || 0) / 100;
    const debit = (balance.debit || 0) / 100;
    const credit = (balance.credit || 0) / 100;

    const message = `مرحباً ${balance.customerName}،

📊 *ميزان المراجعة*

🔹 الرصيد السابق: ${Math.abs(previousBalance).toFixed(2)} ر.س
🔹 حركة مدين: ${debit.toFixed(2)} ر.س
🔹 حركة دائن: ${credit.toFixed(2)} ر.س

💰 *الرصيد الحالي:* ${Math.abs(finalBalance).toFixed(2)} ر.س (${balanceType})

شكراً لتعاملكم معنا 🙏`;

    const phone = balance.customerPhone.replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    toast.success("تم فتح واتساب");
  };

  const sendToWhatsApp = () => {
    const filtered = getFilteredBalances();
    if (filtered.length === 0) {
      toast.error("لا توجد بيانات لإرسالها");
      return;
    }
    
    let message = "📊 *أرصدة العملاء*\n\n";
    
    if (filterType === "zero") message += "العملاء برصيد صفر:\n\n";
    else if (filterType === "debit") message += "العملاء المدينون:\n\n";
    else if (filterType === "credit") message += "العملاء الدائنون:\n\n";
    else if (filterType === "top10") message += "أكبر 10 عملاء:\n\n";
    else if (filterType === "bottom10") message += "أصغر 10 عملاء:\n\n";
    else if (filterType === "range") message += `العملاء من ${minBalance || 0} إلى ${maxBalance || "∞"}:\n\n`;
    
    filtered.forEach((b, i) => {
      const balance = (b.currentBalance || 0) / 100;
      const type = balance > 0 ? "مدين" : balance < 0 ? "دائن" : "صفر";
      message += `${i + 1}. ${b.customerName}\n`;
      message += `   الرصيد: ${Math.abs(balance).toFixed(2)} ر.س (${type})\n\n`;
    });
    
    message += `\n📈 الإجمالي: ${filtered.length} عميل`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(message).then(() => {
      toast.success("تم نسخ الرسالة! افتح واتساب والصقها");
      // Open WhatsApp Web
      window.open(`https://web.whatsapp.com/`, '_blank');
    }).catch(() => {
      toast.error("فشل النسخ");
    });
  };

  const balancesArray = Array.isArray(customerBalances) ? customerBalances : [];
  const displayBalances = getFilteredBalances();

  const totalDebit = balancesArray.reduce((sum, b) => sum + (b.debit || 0), 0) / 100;
  const totalCredit = balancesArray.reduce((sum, b) => sum + (b.credit || 0), 0) / 100;
  const totalBalance = balancesArray.reduce((sum, b) => sum + (b.currentBalance || 0), 0) / 100;

  const formatAmount = (amount: number) => {
    const val = (amount || 0) / 100;
    return val.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getBalanceClass = (balance: number) => {
    if (balance > 0) return "text-red-500 font-semibold";
    if (balance < 0) return "text-green-500 font-semibold";
    return "text-gray-400";
  };

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold neon-green mb-2">أرصدة العملاء</h1>
            <p className="text-muted-foreground">عرض وإدارة أرصدة العملاء مع الحركات</p>
          </div>
          <Link href="/">
            <Button variant="outline">العودة للرئيسية</Button>
          </Link>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleFileSelect}
        />



        <div className="mb-6 space-y-4">
          {/* أزرار الإجراءات */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isImporting ? (
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="ml-2 h-4 w-4" />
              )}
              {isImporting ? "جاري الرفع..." : "رفع ملف Excel"}
            </Button>

            <Button
              onClick={async () => {
                toast.info("جاري تحديث البيانات...");
                await refetch();
                toast.success("تم تحديث البيانات بنجاح");
              }}
              disabled={isLoading}
              variant="outline"
              className="border-green-500/30 hover:bg-green-500/10"
            >
              <RefreshCw className={`ml-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              تحديث البيانات
            </Button>

            <Button
              onClick={handleExportFilteredExcel}
              variant="outline"
              className="border-[#00ff88]/30"
              disabled={displayBalances.length === 0}
            >
              <Download className="ml-2 h-4 w-4" />
              تصدير Excel ({displayBalances.length})
            </Button>
          </div>

          {/* إحصائيات سريعة للكشف */}
          {customerBalances && customerBalances.length > 0 && (() => {
            const openingMatchesDebitCount = customerBalances.filter(c => {
              const previousBalance = c.previousBalance || 0;
              const debit = c.debit || 0;
              return Math.abs(previousBalance - debit) <= 1 && debit !== 0;
            }).length;
            
            const openingWithMovementToZeroCount = customerBalances.filter(c => {
              const previousBalance = c.previousBalance || 0;
              const hasMovement = (c.debit || 0) !== 0 || (c.credit || 0) !== 0;
              const currentBalance = c.currentBalance || 0;
              return previousBalance !== 0 && hasMovement && Math.abs(currentBalance) <= 1;
            }).length;
            
            const balanceMismatchCount = customerBalances.filter(c => {
              const expectedBalance = (c.previousBalance || 0) + (c.debit || 0) - (c.credit || 0);
              const actualBalance = c.currentBalance || 0;
              return Math.abs(actualBalance - expectedBalance) > 1;
            }).length;
            
            const negativeBalanceCount = customerBalances.filter(c => (c.currentBalance || 0) < 0).length;
            
            if (openingMatchesDebitCount > 0 || openingWithMovementToZeroCount > 0 || balanceMismatchCount > 0 || negativeBalanceCount > 0) {
              return (
                <Card className="glass-strong border-red-500/30 bg-red-500/5 mb-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
                      <h3 className="font-bold text-red-400">تنبيه: تم اكتشاف مشاكل في البيانات</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                      {openingMatchesDebitCount > 0 && (
                        <div className="bg-red-500/10 p-3 rounded border border-red-500/20 cursor-pointer hover:bg-red-500/20" onClick={() => setSmartFilter("openingMatchesDebit")}>
                          <div className="text-red-400 font-semibold">{openingMatchesDebitCount} عميل</div>
                          <div className="text-red-300 text-xs">رصيد سابق = مدين</div>
                        </div>
                      )}
                      {openingWithMovementToZeroCount > 0 && (
                        <div className="bg-red-500/10 p-3 rounded border border-red-500/20 cursor-pointer hover:bg-red-500/20" onClick={() => setSmartFilter("openingWithMovementToZero")}>
                          <div className="text-red-400 font-semibold">{openingWithMovementToZeroCount} عميل</div>
                          <div className="text-red-300 text-xs">رصيد + حركة = صفر</div>
                        </div>
                      )}
                      {balanceMismatchCount > 0 && (
                        <div className="bg-orange-500/10 p-3 rounded border border-orange-500/20">
                          <div className="text-orange-400 font-semibold">{balanceMismatchCount} عميل</div>
                          <div className="text-orange-300 text-xs">خطأ في الحسابات</div>
                        </div>
                      )}
                      {negativeBalanceCount > 0 && (
                        <div className="bg-yellow-500/10 p-3 rounded border border-yellow-500/20">
                          <div className="text-yellow-400 font-semibold">{negativeBalanceCount} عميل</div>
                          <div className="text-yellow-300 text-xs">رصيد سالب (دائن)</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            }
            return null;
          })()}

          {/* الفلاتر الذكية */}
          <Card className="glass-strong border-orange-500/30">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search" className="mb-2 block flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    بحث
                  </Label>
                  <Input
                    id="search"
                    placeholder="ابحث عن عميل..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="smart-filter" className="mb-2 block flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    فلاتر ذكية لكشف التلاعب
                  </Label>
                  <Select value={smartFilter} onValueChange={setSmartFilter}>
                    <SelectTrigger id="smart-filter">
                      <SelectValue placeholder="اختر الفلتر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">الكل</SelectItem>
                      
                      {/* فلاتر الكشف عن التلاعب */}
                      <SelectItem value="openingMatchesDebit">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                          <span className="font-bold">رصيد أول المدة = المدين</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="openingWithMovementToZero">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
                          <span className="font-bold">رصيد + حركة = صفر</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="suspicious">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          حالات مشبوهة
                        </div>
                      </SelectItem>
                      <SelectItem value="balanceMismatch">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          خطأ في الحسابات (عدم تطابق)
                        </div>
                      </SelectItem>
                      <SelectItem value="negativeBalance">
                        <div className="flex items-center gap-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          رصيد سالب (دائن)
                        </div>
                      </SelectItem>
                      <SelectItem value="largeMovement">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-blue-500" />
                          حركة كبيرة (+5,000 ر.س)
                        </div>
                      </SelectItem>
                      <SelectItem value="noMovement">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 text-gray-500" />
                          بدون حركة
                        </div>
                      </SelectItem>
                      <SelectItem value="hasOpening">لديه رصيد سابق</SelectItem>
                      <SelectItem value="zeroOpening">رصيد سابق صفر</SelectItem>
                      <SelectItem value="roundNumbers">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          أرقام مدورة (مشبوه)
                        </div>
                      </SelectItem>
                      <SelectItem value="exactMatch">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          رصيد سابق = حالي مع حركة
                        </div>
                      </SelectItem>
                      
                      {/* فلاتر الحركة */}
                      <SelectItem value="debitOnly">حركة مدين فقط</SelectItem>
                      <SelectItem value="creditOnly">حركة دائن فقط</SelectItem>
                      <SelectItem value="bothMovements">حركة مدين ودائن</SelectItem>
                      <SelectItem value="highDebit">مدين كبير (+10K)</SelectItem>
                      <SelectItem value="highCredit">دائن كبير (+10K)</SelectItem>
                      <SelectItem value="debitMoreThanCredit">المدين أكبر من الدائن</SelectItem>
                      <SelectItem value="creditMoreThanDebit">الدائن أكبر من المدين</SelectItem>
                      
                      {/* فلاتر التغيير */}
                      <SelectItem value="balanceIncreased">الرصيد زاد</SelectItem>
                      <SelectItem value="balanceDecreased">الرصيد نقص</SelectItem>
                      
                      {/* فلاتر عادية */}
                      <SelectItem value="zero">رصيد صفر</SelectItem>
                      <SelectItem value="debit">مدينون فقط</SelectItem>
                      <SelectItem value="credit">دائنون فقط</SelectItem>
                      <SelectItem value="range">نطاق محدد (من - إلى)</SelectItem>
                      <SelectItem value="top10">أكبر 10 عملاء</SelectItem>
                      <SelectItem value="bottom10">أصغر 10 عملاء</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* حقول النطاق المحدد */}
                {smartFilter === "range" && (
                  <>
                    <div>
                      <Label htmlFor="min-balance">من (ر.س)</Label>
                      <Input
                        id="min-balance"
                        type="number"
                        value={minBalance}
                        onChange={(e) => setMinBalance(e.target.value)}
                        placeholder="0"
                        className="glass"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max-balance">إلى (ر.س)</Label>
                      <Input
                        id="max-balance"
                        type="number"
                        value={maxBalance}
                        onChange={(e) => setMaxBalance(e.target.value)}
                        placeholder="∞"
                        className="glass"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* الأزرار */}
              <div className={`${smartFilter === "range" ? "md:col-span-2" : ""}`}>
                
                {/* أزرار الإجراءات */}
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={sendToWhatsApp}
                    disabled={displayBalances.length === 0}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <Send className="ml-2 h-4 w-4" />
                    واتساب ({displayBalances.length})
                  </Button>
                  <Button 
                    onClick={handleExportFilteredExcel}
                    disabled={displayBalances.length === 0}
                    variant="outline"
                    className="flex-1 border-blue-500/30 hover:bg-blue-500/10"
                  >
                    <Download className="ml-2 h-4 w-4" />
                    تصدير ({displayBalances.length})
                  </Button>
                </div>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    عرض {displayBalances.length} من {customerBalances?.length || 0} رصيد
                  </span>
                  {smartFilter !== "all" && (
                    <span className="text-orange-400 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      فلتر نشط
                    </span>
                  )}
                </div>
                
                {/* رسائل توضيحية للفلاتر */}
                {smartFilter === "openingMatchesDebit" && displayBalances.length > 0 && (
                  <div className="text-xs text-red-500 bg-red-500/20 p-3 rounded border border-red-500/30 font-semibold">
                    🚨 تحذير: تم العثور على {displayBalances.length} عميل الرصيد السابق لديهم مطابق تماماً للحركة المدينة!
                    <br />
                    <span className="text-red-400 font-normal">هذا يعني عدم وجود حركة دائنة وقد يشير إلى تلاعب أو خطأ في الإدخال</span>
                  </div>
                )}
                {smartFilter === "openingWithMovementToZero" && displayBalances.length > 0 && (
                  <div className="text-xs text-red-500 bg-red-500/20 p-3 rounded border border-red-500/30 font-semibold">
                    🚨 تحذير خطير: {displayBalances.length} عميل كان لديهم رصيد سابق وحدثت حركة لكن الرصيد النهائي = صفر!
                    <br />
                    <span className="text-red-400 font-normal">هذا مشبوه جداً - قد يكون تلاعب أو حذف متعمد للأرصدة</span>
                  </div>
                )}
                {smartFilter === "balanceMismatch" && displayBalances.length > 0 && (
                  <div className="text-xs text-orange-400 bg-orange-500/10 p-2 rounded">
                    ⚠️ تم العثور على {displayBalances.length} عميل بأخطاء حسابية - الرصيد الحالي لا يساوي (الرصيد السابق + المدين - الدائن)
                  </div>
                )}
                {smartFilter === "negativeBalance" && displayBalances.length > 0 && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                    🔴 {displayBalances.length} عميل لديهم رصيد سالب (دائنون) - يحتاجون متابعة فورية
                  </div>
                )}
                {smartFilter === "largeMovement" && displayBalances.length > 0 && (
                  <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
                    📊 {displayBalances.length} عميل لديهم حركة كبيرة (أكثر من 5,000 ر.س)
                  </div>
                )}
                {smartFilter === "noMovement" && displayBalances.length > 0 && (
                  <div className="text-xs text-gray-400 bg-gray-500/10 p-2 rounded">
                    💤 {displayBalances.length} عميل بدون أي حركة في الفترة
                  </div>
                )}
                {smartFilter === "suspicious" && displayBalances.length > 0 && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                    🚨 {displayBalances.length} حالة مشبوهة - رصيد سالب كبير أو حركة غير طبيعية
                  </div>
                )}
                {smartFilter === "roundNumbers" && displayBalances.length > 0 && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
                    ⚠️ {displayBalances.length} عميل بأرقام مدورة (مضاعفات 1,000 ر.س) - قد تكون تقديرات وليست أرقام فعلية
                  </div>
                )}
                {smartFilter === "exactMatch" && displayBalances.length > 0 && (
                  <div className="text-xs text-yellow-400 bg-yellow-500/10 p-2 rounded">
                    ⚠️ {displayBalances.length} عميل الرصيد السابق = الحالي رغم وجود حركة - قد يكون خطأ في الإدخال
                  </div>
                )}
                {smartFilter === "debitOnly" && displayBalances.length > 0 && (
                  <div className="text-xs text-blue-400 bg-blue-500/10 p-2 rounded">
                    📊 {displayBalances.length} عميل لديهم حركة مدين فقط (لم يدفعوا شيء)
                  </div>
                )}
                {smartFilter === "creditOnly" && displayBalances.length > 0 && (
                  <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
                    💰 {displayBalances.length} عميل لديهم حركة دائن فقط (دفعوا بدون مشتريات جديدة)
                  </div>
                )}
                {smartFilter === "balanceIncreased" && displayBalances.length > 0 && (
                  <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                    📈 {displayBalances.length} عميل رصيدهم زاد (ديونهم زادت)
                  </div>
                )}
                {smartFilter === "balanceDecreased" && displayBalances.length > 0 && (
                  <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
                    📉 {displayBalances.length} عميل رصيدهم نقص (دفعوا)
                  </div>
                )}
                {smartFilter === "openingMatchesDebit" && displayBalances.length === 0 && (
                  <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
                    ✅ ممتاز! لا يوجد عملاء برصيد سابق مطابق للمدين - البيانات تبدو سليمة
                  </div>
                )}
                {smartFilter !== "all" && smartFilter !== "openingMatchesDebit" && displayBalances.length === 0 && (
                  <div className="text-xs text-green-400 bg-green-500/10 p-2 rounded">
                    ✅ لا توجد مشاكل - جميع الأرصدة سليمة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Dialog open={isDeleteAllDialogOpen} onOpenChange={setIsDeleteAllDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف الكل
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader>
                <DialogTitle className="text-red-500">تأكيد الحذف</DialogTitle>
                <DialogDescription>
                  هل أنت متأكد من حذف جميع أرصدة العملاء؟ هذا الإجراء لا يمكن التراجع عنه.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDeleteAllDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteAllMutation.mutate()}
                  disabled={deleteAllMutation.isPending}
                >
                  {deleteAllMutation.isPending ? "جاري الحذف..." : "حذف الكل"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="glass-strong border-[#00ff88]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي العملاء</p>
                  <p className="text-2xl font-bold text-[#00ff88]">{balancesArray.length}</p>
                </div>
                <Users className="h-8 w-8 text-[#00ff88]/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي المدين</p>
                  <p className="text-2xl font-bold text-red-500">{totalDebit.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">إجمالي الدائن</p>
                  <p className="text-2xl font-bold text-green-500">{totalCredit.toLocaleString("ar-SA")} ر.س</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-strong border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">صافي الرصيد</p>
                  <p className={`text-2xl font-bold ${totalBalance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {Math.abs(totalBalance).toLocaleString("ar-SA")} ر.س
                    {totalBalance > 0 ? ' (مدين)' : totalBalance < 0 ? ' (دائن)' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-strong border-[#00ff88]/20 mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث عن عميل..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-[#0a0f1a] border-[#00ff88]/30"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-strong border-[#00ff88]/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-[#00ff88]" />
              قائمة أرصدة العملاء ({displayBalances.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#00ff88]" />
              </div>
            ) : displayBalances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                لا توجد بيانات. قم برفع ملف Excel للبدء.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-[#00ff88]/20">
                      <TableHead className="text-right">الكود</TableHead>
                      <TableHead className="text-right">اسم العميل</TableHead>
                      <TableHead className="text-right">ما قبله</TableHead>
                      <TableHead className="text-right text-red-400">مدين</TableHead>
                      <TableHead className="text-right text-green-400">دائن</TableHead>
                      <TableHead className="text-right">الرصيد</TableHead>
                      <TableHead className="text-center">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayBalances.map((balance) => {
                      const currentBalance = balance.currentBalance || 0;
                      const isNegative = currentBalance < 0;
                      
                      return (
                        <TableRow 
                          key={balance.id} 
                          className={`border-[#00ff88]/10 hover:bg-[#00ff88]/5 ${isNegative ? 'bg-red-500/5' : ''}`}
                        >
                          <TableCell className="font-mono">{balance.customerCode}</TableCell>
                          <TableCell className="font-semibold">
                            <div className="flex items-center gap-2">
                              {isNegative && (
                                <AlertTriangle className="h-4 w-4 text-red-500" title="رصيد سالب - يحتاج متابعة" />
                              )}
                              {balance.customerName}
                            </div>
                          </TableCell>
                          <TableCell className={getBalanceClass(balance.previousBalance || 0)}>
                            {formatAmount(balance.previousBalance || 0)}
                          </TableCell>
                          <TableCell className="text-red-500 font-medium">
                            {formatAmount(balance.debit || 0)}
                          </TableCell>
                          <TableCell className="text-green-500 font-medium">
                            {formatAmount(balance.credit || 0)}
                          </TableCell>
                          <TableCell className={getBalanceClass(currentBalance)}>
                            <div className="flex items-center gap-2">
                              {formatAmount(currentBalance)}
                              {currentBalance > 0 && <span className="text-xs">(مدين)</span>}
                              {isNegative && <span className="text-xs">(دائن)</span>}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleQuickSend(balance)}
                              className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                              disabled={!balance.customerPhone}
                              title={balance.customerPhone ? "إرسال رسالة واتساب" : "لا يوجد رقم هاتف"}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
