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
import Inventory from "./pages/Inventory";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import Purchases from "./pages/Purchases";
import Maintenance from "./pages/Maintenance";
import Logistics from "./pages/Logistics";
import Cashbox from "./pages/Cashbox";
import TrialBalance from "./pages/TrialBalance";
import Fleet from "./pages/Fleet";
import Finance from "./pages/Finance";
import Analytics from "./pages/Analytics";
import AIAssistant from "./pages/AIAssistant";
import Companies from "./pages/Companies";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Dashboard} />
      <Route path={"/ai"} component={AIAssistant} />
      <Route path={"/whatsapp"} component={WhatsApp} />
      <Route path={"/companies"} component={Companies} />
      <Route path={"/customers"} component={Customers} />
      <Route path={"/customer-balances"} component={CustomerBalances} />
      <Route path={"/suppliers"} component={Suppliers} />
      <Route path={"/invoices"} component={Invoices} />
      <Route path={"/installments"} component={Installments} />
      <Route path={"/accounts"} component={Accounts} />
      <Route path={"/account-balances"} component={AccountBalances} />
      <Route path={"/chart-of-accounts"} component={ChartOfAccounts} />
      <Route path={"/trial-balance"} component={TrialBalance} />
      <Route path={"/inventory"} component={Inventory} />
      <Route path={"/reports"} component={Reports} />
      <Route path={"/sales"} component={Sales} />
      <Route path={"/purchases"} component={Purchases} />
      <Route path={"/maintenance"} component={Maintenance} />
      <Route path={"/logistics"} component={Logistics} />
      <Route path={"/cashbox"} component={Cashbox} />
      <Route path={"/fleet"} component={Fleet} />
      <Route path={"/finance"} component={Finance} />
      <Route path={"/analytics"} component={Analytics} />
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
