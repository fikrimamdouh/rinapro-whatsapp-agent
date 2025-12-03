import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import WhatsApp from "./pages/WhatsApp";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import AgentPage from "./pages/AgentPage";
import Suppliers from "./pages/Suppliers";
import Invoices from "./pages/Invoices";
import Installments from "./pages/Installments";
import Accounts from "./pages/Accounts";
import ChartOfAccounts from "./pages/ChartOfAccounts";
import CustomerBalances from "./pages/CustomerBalances";
import AccountBalances from "./pages/AccountBalances";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/whatsapp"} component={WhatsApp} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/customer-balances"} component={CustomerBalances} />
      <Route path={"/suppliers"} component={Suppliers} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/installments"} component={Installments} />
      <Route path={"/accounts"} component={Accounts} />
      <Route path={"/account-balances"} component={AccountBalances} />
      <Route path={"/chart-of-accounts"} component={ChartOfAccounts} />
      <Route path={"/inventory"} component={() => <div className="min-h-screen bg-background p-6 text-center"><h1 className="text-4xl font-bold neon-green mt-20">المخزون - قريباً</h1></div>} />
      <Route path={"/reports"} component={() => <div className="min-h-screen bg-background p-6 text-center"><h1 className="text-4xl font-bold neon-green mt-20">التقارير - قريباً</h1></div>} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/agent"} component={AgentPage} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
