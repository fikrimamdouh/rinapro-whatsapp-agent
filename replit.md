# RinaPro WhatsApp ERP System

## Overview
A comprehensive business management application with WhatsApp integration for real-time notifications. Built with TypeScript, React, TRPC v11, and @whiskeysockets/baileys for WhatsApp integration.

## Recent Changes (December 2, 2025)
- Added Chart of Accounts page with full CRUD and Excel import/export
- Implemented system reset functionality in Settings page
- Added deleteAll mutations for all entities (customers, suppliers, invoices, installments, accounts)
- Created comprehensive Excel utilities (client/src/lib/excel.ts)
- Added accounts router with full CRUD operations
- Fixed frontend data handling with defensive array checks
- Fixed duplicate database function definitions
- All pages now handle undefined/loading states correctly

## Project Architecture

### Backend (Server - TRPC)
- **server/_core/**: Core TRPC setup, OAuth, Vite SSR
- **server/routers/**: All TRPC routers
  - auth, system, customers, suppliers, invoices, installments, settings, whatsapp, balances, agent, accounts
- **server/db/**: Database layer with MySQL + SQLite fallback
- **server/whatsapp/**: WhatsApp integration
  - `whatsappService.ts` - Baileys connection management
  - `commandEngine.ts` - Arabic command processing
  - `rateLimiter.ts` - Message rate limiting
- **server/services/**: Business services
  - `pdfGenerator.ts` - PDF statement generation
- **server/events/**: Event bus system for notifications

### Frontend (React)
- **client/src/pages/**: Main application pages
  - Dashboard, WhatsApp, Customers, Suppliers, Invoices, Installments, Settings, Agent, ChartOfAccounts, Accounts
- **client/src/components/**: Reusable UI components
  - ui/ - Shadcn components
  - whatsapp/ - WhatsApp-specific components
- **client/src/lib/**: Utility libraries
  - trpc.ts - TRPC client configuration
  - excel.ts - Excel import/export utilities

### Database Schema (drizzle/schema.ts)
- users, customers, suppliers
- invoices, installments, receipts
- inventory, inventoryTransactions
- dailyTransactions, settings
- messageLogs, connectionStatus
- bonds, eventLogs, customerBalances
- accountBalances, whatsappStats

## Key Features

### WhatsApp Integration
- QR code authentication with Baileys
- Auto-reply system with Arabic commands
- Command routing: كشف حساب, مديونية, فواتير, أقساط
- Rate limiting to prevent spam
- Manager notification system

### Business Features
- Customer management with search, import/export
- Supplier management with CRUD and Excel
- Invoice tracking and CRUD operations
- Installment management with overdue tracking
- Chart of Accounts management
- PDF statement generation
- Event-driven notifications
- System reset functionality

### Excel Import/Export
- Template download for each entity
- Excel import with validation
- Export all data to Excel
- Supported entities: Customers, Suppliers, Invoices, Installments, Accounts

## User Preferences
- Arabic RTL interface
- Dark mode theme
- All UI text in Arabic

## Environment Variables
See `.env.example` for required configuration:
- DATABASE_URL (optional - uses SQLite fallback)
- OAUTH_SERVER_URL (optional)
- MANAGER_PHONE
- GEMINI_API_KEY

## Running the Application
```bash
npm run dev
```

This starts:
- Server on port 3000
- Vite frontend on port 5000

## Known Limitations
1. WhatsApp connection may fail in cloud environments (Error 405) due to IP blocking by WhatsApp servers - works correctly when running locally
2. MySQL database requires external configuration - SQLite fallback is automatic
3. OAuth server URL optional for development

## Tech Stack
- TypeScript
- React + Vite
- TRPC v11
- Drizzle ORM (MySQL + SQLite)
- @whiskeysockets/baileys
- Shadcn UI
- Tailwind CSS
- PDFKit
- xlsx (for Excel operations)

## API Endpoints (TRPC)
- `system.health` - Health check
- `system.dashboardStats` - Dashboard statistics
- `system.resetSystem` - Reset all data
- `customers.*` - Customer CRUD + deleteAll + importFromExcel
- `suppliers.*` - Supplier CRUD + deleteAll + importFromExcel
- `invoices.*` - Invoice CRUD + deleteAll + importFromExcel
- `installments.*` - Installment CRUD + deleteAll + importFromExcel
- `accounts.*` - Account CRUD + deleteAll + importFromExcel
- `settings.*` - Settings management
- `whatsapp.*` - WhatsApp connection management
