import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { BackToHome } from "@/components/BackToHome";
import {
  FolderTree,
  Search,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

export default function ChartOfAccounts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '2', '3', '4', '5']));

  const { data: accountBalances, isLoading, refetch } = trpc.accountBalances.getAll.useQuery();

  const handleRefresh = async () => {
    toast.info("جاري تحديث البيانات...");
    await refetch();
    toast.success("تم تحديث البيانات بنجاح");
  };

  const toggleNode = (code: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(code)) {
      newExpanded.delete(code);
    } else {
      newExpanded.add(code);
    }
    setExpandedNodes(newExpanded);
  };

  const accountTree = {
    '1': { name: 'الأصول', children: [] as any[] },
    '2': { name: 'الخصوم', children: [] as any[] },
    '3': { name: 'حقوق الملكية', children: [] as any[] },
    '4': { name: 'الإيرادات', children: [] as any[] },
    '5': { name: 'المصروفات', children: [] as any[] },
  };

  accountBalances?.forEach(account => {
    const firstDigit = account.accountCode[0];
    if (accountTree[firstDigit as keyof typeof accountTree]) {
      accountTree[firstDigit as keyof typeof accountTree].children.push(account);
    }
  });

  const filteredTree = searchQuery.length > 0 
    ? Object.entries(accountTree).reduce((acc, [key, value]) => {
        const filtered = value.children.filter((a: any) =>
          a.accountName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.accountCode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
        if (filtered.length > 0) {
          acc[key] = { ...value, children: filtered };
        }
        return acc;
      }, {} as typeof accountTree)
    : accountTree;

  return (
    <div className="min-h-screen bg-background p-6" dir="rtl">
      <div className="container mx-auto max-w-7xl">
        <BackToHome />
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold neon-green mb-2">شجرة الحسابات</h1>
          <p className="text-muted-foreground">عرض هيكلي لجميع الحسابات</p>
        </div>

        <div className="mb-6 flex gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isLoading}
            className="border-blue-500/30 hover:bg-blue-500/10"
          >
            <RefreshCw className={\`ml-2 h-4 w-4 \${isLoading ? 'animate-spin' : ''}\`} />
            تحديث
          </Button>

          <div className="flex-1">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 glass"
              />
            </div>
          </div>
        </div>

        <Card className="glass-strong">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              شجرة الحسابات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(filteredTree).map(([key, value]) => (
                  <div key={key}>
                    <button
                      onClick={() => toggleNode(key)}
                      className="w-full flex items-center gap-2 p-3 rounded hover:bg-white/5 transition-colors"
                    >
                      {expandedNodes.has(key) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      <span className="font-bold">{key} - {value.name}</span>
                      <span className="text-sm text-muted-foreground">({value.children.length})</span>
                    </button>
                    {expandedNodes.has(key) && (
                      <div className="mr-6 space-y-1">
                        {value.children.map((account: any) => (
                          <div key={account.id} className="p-2 rounded hover:bg-white/5 flex justify-between">
                            <span className="font-mono text-sm">{account.accountCode}</span>
                            <span>{account.accountName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
