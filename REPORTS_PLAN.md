# خطة التقارير المحاسبية الاحترافية
## Professional Financial Reports Plan

---

## 1. التقارير المطلوبة

### التقارير الأساسية (Core Reports)
1. **قائمة الدخل** (Income Statement / P&L)
2. **الميزانية العمومية** (Balance Sheet)
3. **قائمة التدفقات النقدية** (Cash Flow Statement)
4. **تقرير الأرباح والخسائر** (Profit & Loss)
5. **تقرير الضرائب** (Tax Report - ZATCA)

### تقارير إضافية
6. **تقرير المبيعات التفصيلي**
7. **تقرير المشتريات**
8. **تقرير المخزون**
9. **تقرير العملاء**
10. **تقرير الموردين**

---

## 2. قائمة الدخل (Income Statement)

```typescript
// server/services/financialReports.ts

interface IncomeStatementData {
  period: { from: string; to: string };
  revenue: {
    sales: number;
    services: number;
    other: number;
    total: number;
  };
  costOfGoodsSold: {
    purchases: number;
    directCosts: number;
    total: number;
  };
  grossProfit: number;
  operatingExpenses: {
    salaries: number;
    rent: number;
    utilities: number;
    marketing: number;
    other: number;
    total: number;
  };
  operatingIncome: number;
  otherIncome: number;
  otherExpenses: number;
  netIncome: number;
}

export async function generateIncomeStatement(
  from: string,
  to: string
): Promise<IncomeStatementData> {
  const db = await getSQLiteDb();
  
  // Revenue
  const sales = await db.get(
    `SELECT SUM(total) as total FROM sales 
     WHERE date BETWEEN ? AND ?`,
    [from, to]
  );
  
  // COGS
  const purchases = await db.get(
    `SELECT SUM(amount) as total FROM expenses 
     WHERE category = 'purchases' AND date BETWEEN ? AND ?`,
    [from, to]
  );
  
  // Operating Expenses
  const expenses = await db.all(
    `SELECT category, SUM(amount) as total FROM expenses 
     WHERE category != 'purchases' AND date BETWEEN ? AND ?
     GROUP BY category`,
    [from, to]
  );
  
  const revenue = {
    sales: sales?.total || 0,
    services: 0,
    other: 0,
    total: sales?.total || 0,
  };
  
  const costOfGoodsSold = {
    purchases: purchases?.total || 0,
    directCosts: 0,
    total: purchases?.total || 0,
  };
  
  const grossProfit = revenue.total - costOfGoodsSold.total;
  
  const operatingExpenses = {
    salaries: 0,
    rent: 0,
    utilities: 0,
    marketing: 0,
    other: 0,
    total: 0,
  };
  
  expenses.forEach((exp) => {
    const amount = exp.total || 0;
    operatingExpenses[exp.category] = amount;
    operatingExpenses.total += amount;
  });
  
  const operatingIncome = grossProfit - operatingExpenses.total;
  
  return {
    period: { from, to },
    revenue,
    costOfGoodsSold,
    grossProfit,
    operatingExpenses,
    operatingIncome,
    otherIncome: 0,
    otherExpenses: 0,
    netIncome: operatingIncome,
  };
}
```

---

## 3. الميزانية العمومية (Balance Sheet)

```typescript
interface BalanceSheetData {
  asOfDate: string;
  assets: {
    current: {
      cash: number;
      accountsReceivable: number;
      inventory: number;
      total: number;
    };
    fixed: {
      equipment: number;
      vehicles: number;
      total: number;
    };
    total: number;
  };
  liabilities: {
    current: {
      accountsPayable: number;
      shortTermLoans: number;
      total: number;
    };
    longTerm: {
      loans: number;
      total: number;
    };
    total: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    total: number;
  };
  totalLiabilitiesAndEquity: number;
}

export async function generateBalanceSheet(
  asOfDate: string
): Promise<BalanceSheetData> {
  const db = await getSQLiteDb();
  
  // Cash
  const cashbox = await db.get(
    `SELECT balance FROM cashbox ORDER BY date DESC LIMIT 1`
  );
  
  // Accounts Receivable
  const receivables = await db.get(
    `SELECT SUM(remaining_amount) as total FROM sales 
     WHERE status = 'unpaid' AND date <= ?`,
    [asOfDate]
  );
  
  // Inventory
  const inventory = await db.get(
    `SELECT SUM(quantity * cost) as total FROM inventory`
  );
  
  // Accounts Payable
  const payables = await db.get(
    `SELECT SUM(amount) as total FROM expenses 
     WHERE status = 'unpaid' AND date <= ?`,
    [asOfDate]
  );
  
  const assets = {
    current: {
      cash: cashbox?.balance || 0,
      accountsReceivable: receivables?.total || 0,
      inventory: inventory?.total || 0,
      total: 0,
    },
    fixed: {
      equipment: 0,
      vehicles: 0,
      total: 0,
    },
    total: 0,
  };
  
  assets.current.total = 
    assets.current.cash + 
    assets.current.accountsReceivable + 
    assets.current.inventory;
  
  assets.fixed.total = 
    assets.fixed.equipment + 
    assets.fixed.vehicles;
  
  assets.total = assets.current.total + assets.fixed.total;
  
  const liabilities = {
    current: {
      accountsPayable: payables?.total || 0,
      shortTermLoans: 0,
      total: 0,
    },
    longTerm: {
      loans: 0,
      total: 0,
    },
    total: 0,
  };
  
  liabilities.current.total = 
    liabilities.current.accountsPayable + 
    liabilities.current.shortTermLoans;
  
  liabilities.longTerm.total = liabilities.longTerm.loans;
  liabilities.total = liabilities.current.total + liabilities.longTerm.total;
  
  const equity = {
    capital: 100000, // From settings
    retainedEarnings: assets.total - liabilities.total - 100000,
    total: 0,
  };
  
  equity.total = equity.capital + equity.retainedEarnings;
  
  return {
    asOfDate,
    assets,
    liabilities,
    equity,
    totalLiabilitiesAndEquity: liabilities.total + equity.total,
  };
}
```

---

## 4. قائمة التدفقات النقدية (Cash Flow)

```typescript
interface CashFlowData {
  period: { from: string; to: string };
  operatingActivities: {
    netIncome: number;
    adjustments: {
      accountsReceivable: number;
      inventory: number;
      accountsPayable: number;
    };
    total: number;
  };
  investingActivities: {
    equipmentPurchases: number;
    total: number;
  };
  financingActivities: {
    loans: number;
    capitalContributions: number;
    total: number;
  };
  netCashFlow: number;
  beginningCash: number;
  endingCash: number;
}

export async function generateCashFlowStatement(
  from: string,
  to: string
): Promise<CashFlowData> {
  const db = await getSQLiteDb();
  
  const incomeStatement = await generateIncomeStatement(from, to);
  
  const cashInflows = await db.get(
    `SELECT SUM(amount) as total FROM cashbox 
     WHERE type = 'in' AND date BETWEEN ? AND ?`,
    [from, to]
  );
  
  const cashOutflows = await db.get(
    `SELECT SUM(amount) as total FROM cashbox 
     WHERE type = 'out' AND date BETWEEN ? AND ?`,
    [from, to]
  );
  
  return {
    period: { from, to },
    operatingActivities: {
      netIncome: incomeStatement.netIncome,
      adjustments: {
        accountsReceivable: 0,
        inventory: 0,
        accountsPayable: 0,
      },
      total: cashInflows?.total || 0,
    },
    investingActivities: {
      equipmentPurchases: 0,
      total: 0,
    },
    financingActivities: {
      loans: 0,
      capitalContributions: 0,
      total: 0,
    },
    netCashFlow: (cashInflows?.total || 0) - (cashOutflows?.total || 0),
    beginningCash: 0,
    endingCash: 0,
  };
}
```

---

## 5. API Endpoints

```typescript
// server/routes/reports.ts

router.get('/reports/income-statement', async (req, res) => {
  const { from, to } = req.query;
  const report = await generateIncomeStatement(from, to);
  res.json(report);
});

router.get('/reports/balance-sheet', async (req, res) => {
  const { date } = req.query;
  const report = await generateBalanceSheet(date);
  res.json(report);
});

router.get('/reports/cash-flow', async (req, res) => {
  const { from, to } = req.query;
  const report = await generateCashFlowStatement(from, to);
  res.json(report);
});
```

---

## 6. الوقت والتكلفة

- **Income Statement**: 1 يوم
- **Balance Sheet**: 1 يوم
- **Cash Flow**: 1 يوم
- **المجموع**: 3 أيام
- **التكلفة**: $2,400
