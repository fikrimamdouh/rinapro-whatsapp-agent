/**
 * Uploads Router
 * tRPC endpoints for file upload and analysis
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { parseExcelFile, generateTemplate } from "../services/excelParser";
import { parsePDFFile, savePDFFile } from "../services/pdfParser";
import { getWhatsAppService } from "../whatsapp/whatsappService";
import { getSQLiteDb } from "../db/sqlite";
import { promises as fs } from "fs";
import path from "path";

// Validation schemas
const uploadExcelSchema = z.object({
  module: z.enum(["sales", "inventory", "cashbox", "reports", "purchases", "maintenance", "logistics"]),
  fileBase64: z.string(),
  filename: z.string(),
});

const uploadPDFSchema = z.object({
  module: z.enum(["sales", "inventory", "cashbox", "reports", "purchases", "maintenance", "logistics"]),
  fileBase64: z.string(),
  filename: z.string(),
});

export const uploadsRouter = router({
  /**
   * Upload and parse Excel file
   */
  uploadExcel: publicProcedure
    .input(uploadExcelSchema)
    .mutation(async ({ input }) => {
      try {
        // Decode base64
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        
        // Parse Excel
        const parseResult = parseExcelFile(fileBuffer, input.module);
        
        if (!parseResult.success) {
          return {
            success: false,
            message: "فشل تحليل ملف Excel",
            errors: parseResult.errors,
            data: null,
          };
        }
        
        // Save file
        const uploadDir = `./server/uploads/${input.module}`;
        await fs.mkdir(uploadDir, { recursive: true });
        
        const timestamp = Date.now();
        const storedFilename = `${timestamp}-${input.filename}`;
        const filePath = path.join(uploadDir, storedFilename);
        await fs.writeFile(filePath, fileBuffer);
        
        // Save to database
        const db = getSQLiteDb();
        if (db) {
          // Insert file upload record
          const uploadStmt = db.prepare(`
            INSERT INTO fileUploads (module, fileType, originalFilename, storedFilename, filePath, fileSize, status, totalRows, successRows, failedRows)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);
          const uploadResult = uploadStmt.run(
            input.module,
            "excel",
            input.filename,
            storedFilename,
            filePath,
            fileBuffer.length,
            "completed",
            parseResult.totalRows,
            parseResult.data.length,
            parseResult.errors.length
          );
          
          const uploadId = uploadResult.lastInsertRowid as number;
          
          // Save parsed data to module-specific table
          if (input.module === "sales") {
            const salesStmt = db.prepare(`
              INSERT INTO salesUploads (uploadId, itemName, quantity, unitPrice, totalPrice, saleDate, customerName, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const row of parseResult.data) {
              salesStmt.run(uploadId, row.itemName, row.quantity, row.unitPrice, row.totalPrice, row.saleDate, row.customerName, row.notes);
            }
          } else if (input.module === "inventory") {
            const invStmt = db.prepare(`
              INSERT INTO inventoryUploads (uploadId, sku, itemName, category, stockQuantity, unitPrice, totalValue, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `);
            for (const row of parseResult.data) {
              invStmt.run(uploadId, row.sku, row.itemName, row.category, row.stockQuantity, row.unitPrice, row.totalValue, row.notes);
            }
          } else if (input.module === "cashbox") {
            const cashStmt = db.prepare(`
              INSERT INTO cashboxUploads (uploadId, transactionType, amount, transactionDate, description, category, notes)
              VALUES (?, ?, ?, ?, ?, ?, ?)
            `);
            for (const row of parseResult.data) {
              cashStmt.run(uploadId, row.transactionType, row.amount, row.transactionDate, row.description, row.category, row.notes);
            }
          }
        }
        
        // Send WhatsApp notification
        try {
          const whatsapp = getWhatsAppService();
          if (whatsapp.isConnected()) {
            const summary = `📊 *تقرير تحليل البيانات*\n\n` +
              `📁 الوحدة: ${getModuleNameArabic(input.module)}\n` +
              `📄 الملف: ${input.filename}\n` +
              `✅ تم معالجة: ${parseResult.data.length} سجل\n` +
              `❌ أخطاء: ${parseResult.errors.length}\n\n` +
              `تم تحديث لوحة التحكم بنجاح.`;
            
            await whatsapp.sendToManager(summary);
          }
        } catch (error) {
          console.error("[Upload] Failed to send WhatsApp notification:", error);
        }
        
        return {
          success: true,
          message: `تم رفع وتحليل الملف بنجاح - ${parseResult.data.length} سجل`,
          data: parseResult.data,
          headers: parseResult.headers,
          totalRows: parseResult.totalRows,
          errors: parseResult.errors,
        };
      } catch (error: any) {
        console.error("[Upload] Excel upload error:", error);
        return {
          success: false,
          message: `خطأ في رفع الملف: ${error.message}`,
          errors: [error.message],
          data: null,
        };
      }
    }),

  /**
   * Upload and process PDF file
   */
  uploadPDF: publicProcedure
    .input(uploadPDFSchema)
    .mutation(async ({ input }) => {
      try {
        // Decode base64
        const fileBuffer = Buffer.from(input.fileBase64, "base64");
        
        // Save PDF file
        const timestamp = Date.now();
        const storedFilename = `${timestamp}-${input.filename}`;
        const filePath = await savePDFFile(fileBuffer, input.module, storedFilename);
        
        // Parse PDF (basic extraction)
        const parseResult = await parsePDFFile(fileBuffer, input.module);
        
        // Send WhatsApp notification
        try {
          const whatsapp = getWhatsAppService();
          if (whatsapp.isConnected()) {
            const summary = `📄 *تقرير رفع ملف PDF*\n\n` +
              `📁 الوحدة: ${getModuleNameArabic(input.module)}\n` +
              `📄 الملف: ${input.filename}\n` +
              `✅ تم حفظ الملف بنجاح\n\n` +
              `${parseResult.text}`;
            
            await whatsapp.sendToManager(summary);
          }
        } catch (error) {
          console.error("[Upload] Failed to send WhatsApp notification:", error);
        }
        
        return {
          success: true,
          message: "تم رفع ملف PDF بنجاح",
          filePath,
          extractedData: parseResult.extractedData,
          errors: parseResult.errors,
        };
      } catch (error: any) {
        console.error("[Upload] PDF upload error:", error);
        return {
          success: false,
          message: `خطأ في رفع الملف: ${error.message}`,
          errors: [error.message],
        };
      }
    }),

  /**
   * Download Excel template for module
   */
  downloadTemplate: publicProcedure
    .input(z.object({
      module: z.enum(["sales", "inventory", "cashbox", "reports", "purchases", "maintenance", "logistics"]),
    }))
    .mutation(async ({ input }) => {
      try {
        const templateBuffer = generateTemplate(input.module);
        const fileBase64 = templateBuffer.toString("base64");
        const filename = `template-${input.module}-${Date.now()}.xlsx`;
        
        return {
          success: true,
          fileBase64,
          filename,
        };
      } catch (error: any) {
        console.error("[Upload] Template generation error:", error);
        return {
          success: false,
          message: `خطأ في إنشاء القالب: ${error.message}`,
        };
      }
    }),

  /**
   * Get upload history for module
   */
  getUploadHistory: publicProcedure
    .input(z.object({
      module: z.enum(["sales", "inventory", "cashbox", "reports", "purchases", "maintenance", "logistics"]),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      try {
        const db = getSQLiteDb();
        if (!db) {
          return { success: true, uploads: [] };
        }
        
        const uploads = db.prepare(`
          SELECT * FROM fileUploads 
          WHERE module = ? 
          ORDER BY createdAt DESC 
          LIMIT ?
        `).all(input.module, input.limit);
        
        return {
          success: true,
          uploads,
        };
      } catch (error: any) {
        console.error("[Upload] Get history error:", error);
        return {
          success: false,
          uploads: [],
          message: error.message,
        };
      }
    }),

  /**
   * Get uploaded data for module
   */
  getUploadedData: publicProcedure
    .input(z.object({
      module: z.enum(["sales", "inventory", "cashbox", "reports", "purchases", "maintenance", "logistics"]),
      uploadId: z.number().optional(),
      limit: z.number().optional().default(100),
    }))
    .query(async ({ input }) => {
      try {
        const db = getSQLiteDb();
        if (!db) {
          return { success: true, data: [] };
        }
        
        let data: any[] = [];
        
        if (input.module === "sales") {
          const query = input.uploadId
            ? `SELECT * FROM salesUploads WHERE uploadId = ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM salesUploads ORDER BY createdAt DESC LIMIT ?`;
          data = input.uploadId
            ? db.prepare(query).all(input.uploadId, input.limit)
            : db.prepare(query).all(input.limit);
        } else if (input.module === "inventory") {
          const query = input.uploadId
            ? `SELECT * FROM inventoryUploads WHERE uploadId = ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM inventoryUploads ORDER BY createdAt DESC LIMIT ?`;
          data = input.uploadId
            ? db.prepare(query).all(input.uploadId, input.limit)
            : db.prepare(query).all(input.limit);
        } else if (input.module === "cashbox") {
          const query = input.uploadId
            ? `SELECT * FROM cashboxUploads WHERE uploadId = ? ORDER BY createdAt DESC LIMIT ?`
            : `SELECT * FROM cashboxUploads ORDER BY createdAt DESC LIMIT ?`;
          data = input.uploadId
            ? db.prepare(query).all(input.uploadId, input.limit)
            : db.prepare(query).all(input.limit);
        }
        
        return {
          success: true,
          data,
        };
      } catch (error: any) {
        console.error("[Upload] Get data error:", error);
        return {
          success: false,
          data: [],
          message: error.message,
        };
      }
    }),

  /**
   * Get analysis status
   */
  getAnalysisStatus: publicProcedure
    .input(z.object({
      uploadId: z.number(),
    }))
    .query(async ({ input }) => {
      try {
        // TODO: Query from database
        return {
          success: true,
          status: "completed",
          progress: 100,
        };
      } catch (error: any) {
        return {
          success: false,
          status: "failed",
          message: error.message,
        };
      }
    }),
});

/**
 * Helper: Get module name in Arabic
 */
function getModuleNameArabic(module: string): string {
  const names: Record<string, string> = {
    sales: "المبيعات",
    inventory: "المخزون",
    cashbox: "الصندوق",
    reports: "التقارير",
    purchases: "المشتريات",
    maintenance: "الصيانة",
    logistics: "اللوجستيات",
  };
  return names[module] || module;
}
