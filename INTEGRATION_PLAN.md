# خطة التكامل مع البرامج المحاسبية
## Accounting Software Integration Plan

---

## 1. البرامج المستهدفة (Priority Order)

### المرحلة الأولى (أسبوعين)
1. **Odoo** - الأكثر شيوعاً في السعودية
2. **Zoho Books** - سهل التكامل
3. **QuickBooks** - عالمي

### المرحلة الثانية (أسبوع)
4. **Daftra** - عربي
5. **Qoyod** - عربي سعودي

### المرحلة الثالثة (حسب الطلب)
6. **Xero**
7. **SAP Business One**
8. **Microsoft Dynamics**

---

## 2. معمارية التكامل (Integration Architecture)

```
┌─────────────────┐
│  RinaPro Agent  │
└────────┬────────┘
         │
    ┌────▼────┐
    │ Adapter │ ← Strategy Pattern
    │ Factory │
    └────┬────┘
         │
    ┌────▼────────────────────────┐
    │  Integration Adapters       │
    ├─────────────────────────────┤
    │ • OdooAdapter               │
    │ • ZohoAdapter               │
    │ • QuickBooksAdapter         │
    │ • DaftraAdapter             │
    │ • QoyodAdapter              │
    └─────────────────────────────┘
```

---

## 3. الكود المطلوب

### 3.1 Base Integration Interface

```typescript
// server/integrations/base/IAccountingAdapter.ts

export interface SyncConfig {
  direction: 'push' | 'pull' | 'bidirectional';
  entities: string[]; // ['invoices', 'customers', 'products']
  schedule?: string; // cron expression
  webhookUrl?: string;
}

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors?: string[];
  timestamp: Date;
}

export interface IAccountingAdapter {
  // Authentication
  authenticate(credentials: Record<string, any>): Promise<boolean>;
  refreshToken(): Promise<string>;
  
  // Customers
  syncCustomers(direction: 'push' | 'pull'): Promise<SyncResult>;
  createCustomer(customer: any): Promise<string>;
  updateCustomer(id: string, customer: any): Promise<boolean>;
  
  // Invoices
  syncInvoices(direction: 'push' | 'pull'): Promise<SyncResult>;
  createInvoice(invoice: any): Promise<string>;
  updateInvoice(id: string, invoice: any): Promise<boolean>;
  
  // Products
  syncProducts(direction: 'push' | 'pull'): Promise<SyncResult>;
  createProduct(product: any): Promise<string>;
  updateProduct(id: string, product: any): Promise<boolean>;
  
  // Payments
  syncPayments(direction: 'push' | 'pull'): Promise<SyncResult>;
  recordPayment(payment: any): Promise<string>;
  
  // Reports
  getFinancialReport(type: string, params: any): Promise<any>;
  
  // Webhooks
  setupWebhook(events: string[]): Promise<string>;
  handleWebhook(payload: any): Promise<void>;
}
```

### 3.2 Odoo Adapter Implementation

```typescript
// server/integrations/odoo/OdooAdapter.ts

import axios, { AxiosInstance } from 'axios';
import { IAccountingAdapter, SyncResult } from '../base/IAccountingAdapter';

export class OdooAdapter implements IAccountingAdapter {
  private client: AxiosInstance;
  private sessionId?: string;
  private db: string;
  private username: string;
  private password: string;
  
  constructor(config: {
    url: string;
    db: string;
    username: string;
    password: string;
  }) {
    this.db = config.db;
    this.username = config.username;
    this.password = config.password;
    
    this.client = axios.create({
      baseURL: config.url,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const response = await this.client.post('/web/session/authenticate', {
        jsonrpc: '2.0',
        params: {
          db: this.db,
          login: this.username,
          password: this.password,
        },
      });
      
      if (response.data.result) {
        this.sessionId = response.data.result.session_id;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Odoo authentication failed:', error);
      return false;
    }
  }
  
  async refreshToken(): Promise<string> {
    await this.authenticate();
    return this.sessionId || '';
  }
  
  private async callOdoo(model: string, method: string, args: any[] = []) {
    const response = await this.client.post('/web/dataset/call_kw', {
      jsonrpc: '2.0',
      params: {
        model,
        method,
        args,
        kwargs: {},
      },
    });
    
    return response.data.result;
  }
  
  async syncCustomers(direction: 'push' | 'pull'): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
      timestamp: new Date(),
    };
    
    try {
      if (direction === 'pull') {
        // Pull customers from Odoo
        const customers = await this.callOdoo('res.partner', 'search_read', [
          [['customer_rank', '>', 0]], // Only customers
          ['name', 'phone', 'email', 'street', 'city', 'vat'],
        ]);
        
        // Save to local DB
        const db = await getSQLiteDb();
        for (const customer of customers) {
          try {
            await db.run(
              `INSERT OR REPLACE INTO customers 
               (external_id, name, phone, email, address, tax_number, source)
               VALUES (?, ?, ?, ?, ?, ?, 'odoo')`,
              [
                customer.id,
                customer.name,
                customer.phone,
                customer.email,
                `${customer.street || ''} ${customer.city || ''}`.trim(),
                customer.vat,
              ]
            );
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors?.push(`Customer ${customer.name}: ${error}`);
          }
        }
      } else {
        // Push customers to Odoo
        const db = await getSQLiteDb();
        const customers = await db.all(
          `SELECT * FROM customers WHERE source IS NULL OR source = 'local'`
        );
        
        for (const customer of customers) {
          try {
            const odooId = await this.createCustomer({
              name: customer.name,
              phone: customer.phone,
              email: customer.email,
              street: customer.address,
              vat: customer.tax_number,
            });
            
            // Update local record with external_id
            await db.run(
              `UPDATE customers SET external_id = ?, source = 'odoo' WHERE id = ?`,
              [odooId, customer.id]
            );
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors?.push(`Customer ${customer.name}: ${error}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors?.push(`Sync failed: ${error}`);
    }
    
    return result;
  }
  
  async createCustomer(customer: any): Promise<string> {
    const id = await this.callOdoo('res.partner', 'create', [
      {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        street: customer.street,
        city: customer.city,
        vat: customer.vat,
        customer_rank: 1,
      },
    ]);
    return id.toString();
  }
  
  async updateCustomer(id: string, customer: any): Promise<boolean> {
    await this.callOdoo('res.partner', 'write', [
      [parseInt(id)],
      {
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        street: customer.street,
        vat: customer.vat,
      },
    ]);
    return true;
  }
  
  async syncInvoices(direction: 'push' | 'pull'): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
      timestamp: new Date(),
    };
    
    try {
      if (direction === 'pull') {
        const invoices = await this.callOdoo('account.move', 'search_read', [
          [['move_type', '=', 'out_invoice']],
          ['name', 'partner_id', 'invoice_date', 'amount_total', 'state'],
        ]);
        
        const db = await getSQLiteDb();
        for (const invoice of invoices) {
          try {
            await db.run(
              `INSERT OR REPLACE INTO sales 
               (external_id, customer_id, date, total, status, source)
               VALUES (?, ?, ?, ?, ?, 'odoo')`,
              [
                invoice.id,
                invoice.partner_id[0],
                invoice.invoice_date,
                invoice.amount_total,
                invoice.state,
              ]
            );
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors?.push(`Invoice ${invoice.name}: ${error}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors?.push(`Sync failed: ${error}`);
    }
    
    return result;
  }
  
  async createInvoice(invoice: any): Promise<string> {
    const id = await this.callOdoo('account.move', 'create', [
      {
        move_type: 'out_invoice',
        partner_id: invoice.customer_id,
        invoice_date: invoice.date,
        invoice_line_ids: invoice.items.map((item: any) => [
          0,
          0,
          {
            product_id: item.product_id,
            quantity: item.quantity,
            price_unit: item.price,
          },
        ]),
      },
    ]);
    return id.toString();
  }
  
  async updateInvoice(id: string, invoice: any): Promise<boolean> {
    await this.callOdoo('account.move', 'write', [[parseInt(id)], invoice]);
    return true;
  }
  
  async syncProducts(direction: 'push' | 'pull'): Promise<SyncResult> {
    // Similar implementation
    return { success: true, synced: 0, failed: 0, timestamp: new Date() };
  }
  
  async createProduct(product: any): Promise<string> {
    const id = await this.callOdoo('product.product', 'create', [product]);
    return id.toString();
  }
  
  async updateProduct(id: string, product: any): Promise<boolean> {
    await this.callOdoo('product.product', 'write', [[parseInt(id)], product]);
    return true;
  }
  
  async syncPayments(direction: 'push' | 'pull'): Promise<SyncResult> {
    return { success: true, synced: 0, failed: 0, timestamp: new Date() };
  }
  
  async recordPayment(payment: any): Promise<string> {
    const id = await this.callOdoo('account.payment', 'create', [payment]);
    return id.toString();
  }
  
  async getFinancialReport(type: string, params: any): Promise<any> {
    // Implement based on report type
    return {};
  }
  
  async setupWebhook(events: string[]): Promise<string> {
    // Odoo doesn't have native webhooks, use polling or custom module
    return 'polling';
  }
  
  async handleWebhook(payload: any): Promise<void> {
    // Handle webhook payload
  }
}
```

### 3.3 Zoho Books Adapter

```typescript
// server/integrations/zoho/ZohoAdapter.ts

import axios, { AxiosInstance } from 'axios';
import { IAccountingAdapter, SyncResult } from '../base/IAccountingAdapter';

export class ZohoAdapter implements IAccountingAdapter {
  private client: AxiosInstance;
  private accessToken?: string;
  private refreshTokenValue: string;
  private clientId: string;
  private clientSecret: string;
  private organizationId: string;
  
  constructor(config: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    organizationId: string;
    region?: 'com' | 'eu' | 'in';
  }) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.refreshTokenValue = config.refreshToken;
    this.organizationId = config.organizationId;
    
    const region = config.region || 'com';
    this.client = axios.create({
      baseURL: `https://books.zoho.${region}/api/v3`,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  
  async authenticate(): Promise<boolean> {
    try {
      const response = await axios.post(
        'https://accounts.zoho.com/oauth/v2/token',
        null,
        {
          params: {
            refresh_token: this.refreshTokenValue,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            grant_type: 'refresh_token',
          },
        }
      );
      
      this.accessToken = response.data.access_token;
      this.client.defaults.headers.common['Authorization'] = `Zoho-oauthtoken ${this.accessToken}`;
      return true;
    } catch (error) {
      console.error('Zoho authentication failed:', error);
      return false;
    }
  }
  
  async refreshToken(): Promise<string> {
    await this.authenticate();
    return this.accessToken || '';
  }
  
  async syncCustomers(direction: 'push' | 'pull'): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
      timestamp: new Date(),
    };
    
    try {
      if (direction === 'pull') {
        const response = await this.client.get('/contacts', {
          params: {
            organization_id: this.organizationId,
          },
        });
        
        const customers = response.data.contacts;
        const db = await getSQLiteDb();
        
        for (const customer of customers) {
          try {
            await db.run(
              `INSERT OR REPLACE INTO customers 
               (external_id, name, phone, email, address, source)
               VALUES (?, ?, ?, ?, ?, 'zoho')`,
              [
                customer.contact_id,
                customer.contact_name,
                customer.phone,
                customer.email,
                customer.billing_address?.address || '',
              ]
            );
            result.synced++;
          } catch (error) {
            result.failed++;
            result.errors?.push(`Customer ${customer.contact_name}: ${error}`);
          }
        }
      }
    } catch (error) {
      result.success = false;
      result.errors?.push(`Sync failed: ${error}`);
    }
    
    return result;
  }
  
  async createCustomer(customer: any): Promise<string> {
    const response = await this.client.post(
      '/contacts',
      {
        contact_name: customer.name,
        contact_type: 'customer',
        phone: customer.phone,
        email: customer.email,
      },
      {
        params: { organization_id: this.organizationId },
      }
    );
    return response.data.contact.contact_id;
  }
  
  async updateCustomer(id: string, customer: any): Promise<boolean> {
    await this.client.put(
      `/contacts/${id}`,
      {
        contact_name: customer.name,
        phone: customer.phone,
        email: customer.email,
      },
      {
        params: { organization_id: this.organizationId },
      }
    );
    return true;
  }
  
  // Implement other methods similarly...
  async syncInvoices(direction: 'push' | 'pull'): Promise<SyncResult> {
    return { success: true, synced: 0, failed: 0, timestamp: new Date() };
  }
  
  async createInvoice(invoice: any): Promise<string> {
    return '';
  }
  
  async updateInvoice(id: string, invoice: any): Promise<boolean> {
    return true;
  }
  
  async syncProducts(direction: 'push' | 'pull'): Promise<SyncResult> {
    return { success: true, synced: 0, failed: 0, timestamp: new Date() };
  }
  
  async createProduct(product: any): Promise<string> {
    return '';
  }
  
  async updateProduct(id: string, product: any): Promise<boolean> {
    return true;
  }
  
  async syncPayments(direction: 'push' | 'pull'): Promise<SyncResult> {
    return { success: true, synced: 0, failed: 0, timestamp: new Date() };
  }
  
  async recordPayment(payment: any): Promise<string> {
    return '';
  }
  
  async getFinancialReport(type: string, params: any): Promise<any> {
    return {};
  }
  
  async setupWebhook(events: string[]): Promise<string> {
    const response = await this.client.post(
      '/webhooks',
      {
        url: process.env.WEBHOOK_URL,
        events,
      },
      {
        params: { organization_id: this.organizationId },
      }
    );
    return response.data.webhook.webhook_id;
  }
  
  async handleWebhook(payload: any): Promise<void> {
    // Handle Zoho webhook
  }
}
```

### 3.4 Adapter Factory

```typescript
// server/integrations/AdapterFactory.ts

import { IAccountingAdapter } from './base/IAccountingAdapter';
import { OdooAdapter } from './odoo/OdooAdapter';
import { ZohoAdapter } from './zoho/ZohoAdapter';
import { QuickBooksAdapter } from './quickbooks/QuickBooksAdapter';

export type AdapterType = 'odoo' | 'zoho' | 'quickbooks' | 'daftra' | 'qoyod';

export class AdapterFactory {
  static create(type: AdapterType, config: any): IAccountingAdapter {
    switch (type) {
      case 'odoo':
        return new OdooAdapter(config);
      case 'zoho':
        return new ZohoAdapter(config);
      case 'quickbooks':
        return new QuickBooksAdapter(config);
      default:
        throw new Error(`Unsupported adapter type: ${type}`);
    }
  }
}
```

### 3.5 Integration Manager

```typescript
// server/services/integrationManager.ts

import { AdapterFactory, AdapterType } from '../integrations/AdapterFactory';
import { IAccountingAdapter } from '../integrations/base/IAccountingAdapter';
import { getSQLiteDb } from '../db/sqlite';

interface IntegrationConfig {
  id: string;
  type: AdapterType;
  enabled: boolean;
  credentials: Record<string, any>;
  syncConfig: {
    autoSync: boolean;
    schedule: string;
    entities: string[];
  };
}

export class IntegrationManager {
  private adapters: Map<string, IAccountingAdapter> = new Map();
  
  async loadIntegrations() {
    const db = await getSQLiteDb();
    const integrations = await db.all<IntegrationConfig[]>(
      `SELECT * FROM integrations WHERE enabled = 1`
    );
    
    for (const integration of integrations) {
      try {
        const adapter = AdapterFactory.create(
          integration.type,
          integration.credentials
        );
        
        const authenticated = await adapter.authenticate();
        if (authenticated) {
          this.adapters.set(integration.id, adapter);
          console.log(`✅ ${integration.type} integration loaded`);
        }
      } catch (error) {
        console.error(`❌ Failed to load ${integration.type}:`, error);
      }
    }
  }
  
  async syncAll(entity: string, direction: 'push' | 'pull') {
    const results = [];
    
    for (const [id, adapter] of this.adapters) {
      try {
        let result;
        switch (entity) {
          case 'customers':
            result = await adapter.syncCustomers(direction);
            break;
          case 'invoices':
            result = await adapter.syncInvoices(direction);
            break;
          case 'products':
            result = await adapter.syncProducts(direction);
            break;
          case 'payments':
            result = await adapter.syncPayments(direction);
            break;
        }
        
        results.push({ integration: id, ...result });
      } catch (error) {
        results.push({
          integration: id,
          success: false,
          error: error.message,
        });
      }
    }
    
    return results;
  }
  
  getAdapter(integrationId: string): IAccountingAdapter | undefined {
    return this.adapters.get(integrationId);
  }
}

export const integrationManager = new IntegrationManager();
```

---

## 4. Database Schema

```sql
-- Add to existing schema

CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  enabled INTEGER DEFAULT 1,
  credentials TEXT NOT NULL, -- JSON encrypted
  sync_config TEXT NOT NULL, -- JSON
  last_sync DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id TEXT NOT NULL,
  entity TEXT NOT NULL,
  direction TEXT NOT NULL,
  synced INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  errors TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES integrations(id)
);

-- Add external_id and source to existing tables
ALTER TABLE customers ADD COLUMN external_id TEXT;
ALTER TABLE customers ADD COLUMN source TEXT;

ALTER TABLE sales ADD COLUMN external_id TEXT;
ALTER TABLE sales ADD COLUMN source TEXT;

ALTER TABLE inventory ADD COLUMN external_id TEXT;
ALTER TABLE inventory ADD COLUMN source TEXT;
```

---

## 5. API Endpoints

```typescript
// server/routes/integrations.ts

import express from 'express';
import { integrationManager } from '../services/integrationManager';

const router = express.Router();

// List integrations
router.get('/integrations', async (req, res) => {
  const db = await getSQLiteDb();
  const integrations = await db.all('SELECT * FROM integrations');
  res.json(integrations);
});

// Add integration
router.post('/integrations', async (req, res) => {
  const { type, name, credentials, syncConfig } = req.body;
  
  const db = await getSQLiteDb();
  const id = `${type}_${Date.now()}`;
  
  await db.run(
    `INSERT INTO integrations (id, type, name, credentials, sync_config)
     VALUES (?, ?, ?, ?, ?)`,
    [id, type, name, JSON.stringify(credentials), JSON.stringify(syncConfig)]
  );
  
  res.json({ id, message: 'Integration added' });
});

// Sync entity
router.post('/integrations/:id/sync', async (req, res) => {
  const { id } = req.params;
  const { entity, direction } = req.body;
  
  const adapter = integrationManager.getAdapter(id);
  if (!adapter) {
    return res.status(404).json({ error: 'Integration not found' });
  }
  
  let result;
  switch (entity) {
    case 'customers':
      result = await adapter.syncCustomers(direction);
      break;
    case 'invoices':
      result = await adapter.syncInvoices(direction);
      break;
    default:
      return res.status(400).json({ error: 'Invalid entity' });
  }
  
  res.json(result);
});

export default router;
```

---

## 6. التكلفة والوقت

### الوقت المطلوب
- **Odoo Adapter**: 2 أيام
- **Zoho Adapter**: 1.5 يوم
- **QuickBooks Adapter**: 2 أيام
- **Integration Manager**: 1 يوم
- **Testing**: 1.5 يوم
- **المجموع**: 8 أيام (أسبوع ونصف)

### التكلفة
- **مطور Backend**: $100/ساعة × 64 ساعة = $6,400
- **Testing**: $80/ساعة × 12 ساعة = $960
- **المجموع**: $7,360

---

## 7. الأولويات

### Must Have (إلزامي)
1. Odoo integration
2. Bidirectional sync
3. Error handling

### Should Have (مهم)
1. Zoho Books integration
2. Webhook support
3. Sync scheduling

### Nice to Have (إضافي)
1. QuickBooks integration
2. Real-time sync
3. Conflict resolution

---

## 8. الخطوات التالية

1. ✅ إنشاء Base Interface
2. ✅ تطوير Odoo Adapter
3. ⏳ تطوير Zoho Adapter
4. ⏳ تطوير QuickBooks Adapter
5. ⏳ Integration Manager
6. ⏳ API Endpoints
7. ⏳ Testing
8. ⏳ Documentation
