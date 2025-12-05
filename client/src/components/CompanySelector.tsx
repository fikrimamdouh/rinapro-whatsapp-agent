import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";

export function CompanySelector() {
  const [activeCompanyId, setActiveCompanyId] = useState<string>("1");
  const { data: companies } = trpc.companies.list.useQuery();

  useEffect(() => {
    const stored = localStorage.getItem("activeCompanyId");
    if (stored) {
      setActiveCompanyId(stored);
    }
  }, []);

  const handleCompanyChange = (value: string) => {
    setActiveCompanyId(value);
    localStorage.setItem("activeCompanyId", value);
    window.location.reload(); // Reload to apply company filter
  };

  if (!companies || companies.length <= 1) {
    return null; // Don't show selector if only one company
  }

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={activeCompanyId} onValueChange={handleCompanyChange}>
        <SelectTrigger className="w-[200px] glass">
          <SelectValue placeholder="اختر الشركة" />
        </SelectTrigger>
        <SelectContent>
          {companies.map((company: any) => (
            <SelectItem key={company.id} value={company.id.toString()}>
              {company.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
