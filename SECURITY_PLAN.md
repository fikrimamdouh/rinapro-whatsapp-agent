# خطة الأمان والموثوقية
## Security & Reliability Plan

---

## 🔒 الفجوات الأمنية الحالية

### 1. لا يوجد نظام صلاحيات (RBAC)
- أي شخص يمكنه الوصول لكل شيء
- لا يوجد تحكم في الصلاحيات
- لا يوجد فصل بين الأدوار

### 2. لا يوجد تشفير للبيانات الحساسة
- كلمات المرور مخزنة بدون تشفير
- بيانات العملاء غير محمية
- المعلومات المالية مكشوفة

### 3. لا يوجد سجل تدقيق (Audit Log)
- لا يمكن تتبع من فعل ماذا
- لا يوجد سجل للتغييرات
- صعوبة اكتشاف الاختراقات

### 4. لا يوجد نسخ احتياطي تلقائي
- خطر فقدان البيانات
- لا يوجد استعادة للبيانات
- لا يوجد خطة كوارث

---

## 🎯 الحل: نظام RBAC كامل

### الأدوار (Roles)

```typescript
// server/auth/roles.ts

export enum Role {
  SUPER_ADMIN = 'super_admin',    // صلاحيات كاملة
  ADMIN = 'admin',                // إدارة النظام
  ACCOUNTANT = 'accountant',      // محاسب
  SALES_MANAGER = 'sales_manager',// مدير مبيعات
  CASHIER = 'cashier',            // أمين صندوق
  VIEWER = 'viewer',              // عرض فقط
}

export const ROLE_HIERARCHY = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.ACCOUNTANT]: 60,
  [Role.SALES_MANAGER]: 50,
  [Role.CASHIER]: 30,
  [Role.VIEWER]: 10,
};

export interface Permission {
  resource: string;  // 'sales', 'cashbox', 'customers', etc.
  action: string;    // 'create', 'read', 'update', 'delete'
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.SUPER_ADMIN]: [
    { resource: '*', action: '*' }, // كل شيء
  ],
  
  [Role.ADMIN]: [
    { resource: 'sales', action: '*' },
    { resource: 'cashbox', action: '*' },
    { resource: 'customers', action: '*' },
    { resource: 'inventory', action: '*' },
    { resource: 'reports', action: 'read' },
    { resource: 'users', action: 'read' },
  ],
  
  [Role.ACCOUNTANT]: [
    { resource: 'sales', action: 'read' },
    { resource: 'cashbox', action: '*' },
    { resource: 'customers', action: 'read' },
    { resource: 'reports', action: 'read' },
    { resource: 'invoices', action: '*' },
  ],
  
  [Role.SALES_MANAGER]: [
    { resource: 'sales', action: '*' },
    { resource: 'customers', action: '*' },
    { resource: 'inventory', action: 'read' },
    { resource: 'reports', action: 'read' },
  ],
  
  [Role.CASHIER]: [
    { resource: 'sales', action: 'create' },
    { resource: 'cashbox', action: 'read' },
    { resource: 'customers', action: 'read' },
  ],
  
  [Role.VIEWER]: [
    { resource: 'sales', action: 'read' },
    { resource: 'reports', action: 'read' },
  ],
};
```

### Middleware للتحقق من الصلاحيات

```typescript
// server/middleware/auth.ts

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role, ROLE_PERMISSIONS } from '../auth/roles';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    role: Role;
  };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'غير مصرح' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'رمز غير صالح' });
  }
}

export function authorize(resource: string, action: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'غير مصرح' });
    }
    
    const permissions = ROLE_PERMISSIONS[req.user.role];
    
    // Check for wildcard permissions
    const hasWildcard = permissions.some(
      p => (p.resource === '*' && p.action === '*') ||
           (p.resource === resource && p.action === '*') ||
           (p.resource === '*' && p.action === action)
    );
    
    if (hasWildcard) {
      return next();
    }
    
    // Check for specific permission
    const hasPermission = permissions.some(
      p => p.resource === resource && p.action === action
    );
    
    if (hasPermission) {
      return next();
    }
    
    return res.status(403).json({ error: 'ليس لديك صلاحية' });
  };
}
```

### استخدام Middleware

```typescript
// server/routes/sales.ts

import { authenticate, authorize } from '../middleware/auth';

router.get('/sales', authenticate, authorize('sales', 'read'), async (req, res) => {
  // Get sales
});

router.post('/sales', authenticate, authorize('sales', 'create'), async (req, res) => {
  // Create sale
});

router.put('/sales/:id', authenticate, authorize('sales', 'update'), async (req, res) => {
  // Update sale
});

router.delete('/sales/:id', authenticate, authorize('sales', 'delete'), async (req, res) => {
  // Delete sale
});
```

---

## 🔐 تشفير البيانات الحساسة

```typescript
// server/utils/encryption.ts

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const IV_LENGTH = 16;

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  // Return: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Hash passwords
export function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, process.env.PASSWORD_SALT!, 10000, 64, 'sha512')
    .toString('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  const hashToVerify = hashPassword(password);
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(hashToVerify, 'hex')
  );
}
```

### استخدام التشفير

```typescript
// Encrypt sensitive data before saving
const customer = {
  name: 'أحمد محمد',
  phone: encrypt('0501234567'),
  email: encrypt('ahmad@example.com'),
  taxNumber: encrypt('123456789'),
};

await db.run(
  'INSERT INTO customers (name, phone, email, tax_number) VALUES (?, ?, ?, ?)',
  [customer.name, customer.phone, customer.email, customer.taxNumber]
);

// Decrypt when reading
const row = await db.get('SELECT * FROM customers WHERE id = ?', [id]);
const decryptedCustomer = {
  ...row,
  phone: decrypt(row.phone),
  email: decrypt(row.email),
  taxNumber: decrypt(row.tax_number),
};
```

---

## 📝 سجل التدقيق (Audit Log)

```typescript
// server/services/auditLog.ts

export interface AuditEntry {
  userId: number;
  username: string;
  action: string;
  resource: string;
  resourceId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export async function logAudit(entry: AuditEntry) {
  const db = await getSQLiteDb();
  
  await db.run(
    `INSERT INTO audit_log 
     (user_id, username, action, resource, resource_id, old_value, new_value, ip_address, user_agent, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      entry.userId,
      entry.username,
      entry.action,
      entry.resource,
      entry.resourceId,
      JSON.stringify(entry.oldValue),
      JSON.stringify(entry.newValue),
      entry.ipAddress,
      entry.userAgent,
      entry.timestamp.toISOString(),
    ]
  );
}

// Middleware to log all actions
export function auditMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const originalSend = res.send;
  
  res.send = function (data: any) {
    if (req.user && res.statusCode < 400) {
      logAudit({
        userId: req.user.id,
        username: req.user.username,
        action: req.method,
        resource: req.path,
        resourceId: req.params.id,
        newValue: req.body,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        timestamp: new Date(),
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
}
```

### Database Schema

```sql
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_resource ON audit_log(resource, resource_id);
CREATE INDEX idx_audit_timestamp ON audit_log(timestamp);
```

---

## 💾 النسخ الاحتياطي التلقائي

```typescript
// server/services/backup.ts

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import cron from 'node-cron';

const execAsync = promisify(exec);

export class BackupService {
  private backupDir = path.join(__dirname, '../../backups');
  
  constructor() {
    // Create backup directory
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
    
    // Schedule daily backup at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.createBackup();
    });
  }
  
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `backup_${timestamp}.db`);
    
    try {
      // Copy SQLite database
      await execAsync(`cp data/rinapro.db ${backupFile}`);
      
      // Compress
      await execAsync(`gzip ${backupFile}`);
      
      console.log(`✅ Backup created: ${backupFile}.gz`);
      
      // Clean old backups (keep last 30 days)
      await this.cleanOldBackups(30);
      
      return `${backupFile}.gz`;
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }
  
  async restoreBackup(backupFile: string): Promise<void> {
    try {
      // Decompress
      await execAsync(`gunzip -c ${backupFile} > data/rinapro_restored.db`);
      
      // Replace current database
      await execAsync('mv data/rinapro.db data/rinapro_old.db');
      await execAsync('mv data/rinapro_restored.db data/rinapro.db');
      
      console.log('✅ Backup restored successfully');
    } catch (error) {
      console.error('❌ Restore failed:', error);
      throw error;
    }
  }
  
  async cleanOldBackups(daysToKeep: number): Promise<void> {
    const files = fs.readdirSync(this.backupDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;
    
    for (const file of files) {
      const filePath = path.join(this.backupDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;
      
      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Deleted old backup: ${file}`);
      }
    }
  }
  
  async uploadToCloud(backupFile: string): Promise<void> {
    // TODO: Upload to S3, Google Drive, or Dropbox
    // Example with AWS S3:
    /*
    const s3 = new AWS.S3();
    const fileStream = fs.createReadStream(backupFile);
    
    await s3.upload({
      Bucket: 'rinapro-backups',
      Key: path.basename(backupFile),
      Body: fileStream,
    }).promise();
    */
  }
}

export const backupService = new BackupService();
```

---

## 🔒 أمان WhatsApp

```typescript
// server/whatsapp/security.ts

import crypto from 'crypto';

export function verifyWebhook(req: Request): boolean {
  const signature = req.headers['x-hub-signature-256'] as string;
  
  if (!signature) {
    return false;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.WHATSAPP_WEBHOOK_SECRET!)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expectedSignature}`)
  );
}

export function rateLimitUser(userId: string): boolean {
  // Implement rate limiting per user
  // Max 10 requests per minute
  const key = `ratelimit:${userId}`;
  const count = cache.get(key) || 0;
  
  if (count >= 10) {
    return false;
  }
  
  cache.set(key, count + 1, 60); // 60 seconds TTL
  return true;
}
```

---

## 📊 الوقت والتكلفة

### الوقت المطلوب
- **RBAC System**: 3 أيام
- **Encryption**: 1 يوم
- **Audit Log**: 1 يوم
- **Backup System**: 1 يوم
- **Testing**: 1 يوم
- **المجموع**: 7 أيام (أسبوع)

### التكلفة
- **مطور Backend**: $100/ساعة × 56 ساعة = $5,600
- **Security Audit**: $150/ساعة × 8 ساعات = $1,200
- **المجموع**: $6,800

---

## ✅ الأولويات

### Must Have (إلزامي)
1. ✅ RBAC System
2. ✅ Password Hashing
3. ✅ Audit Log
4. ✅ Daily Backups

### Should Have (مهم)
1. Data Encryption
2. Rate Limiting
3. Cloud Backup

### Nice to Have (إضافي)
1. 2FA Authentication
2. IP Whitelisting
3. Intrusion Detection
