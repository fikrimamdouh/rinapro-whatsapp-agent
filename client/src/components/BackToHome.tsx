import { Home } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function BackToHome() {
  return (
    <div className="mb-6">
      <Link href="/">
        <Button
          variant="outline"
          className="gap-2 bg-gradient-to-r from-emerald-500/10 to-green-500/10 border-emerald-500/30 hover:bg-emerald-500/20"
        >
          <Home className="h-4 w-4" />
          العودة للرئيسية
        </Button>
      </Link>
    </div>
  );
}
