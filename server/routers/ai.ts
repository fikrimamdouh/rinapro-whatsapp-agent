/**
 * AI Router
 * Handles AI-powered queries and voice messages
 */

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import * as openaiService from "../services/openai";
import * as db from "../db";

export const aiRouter = router({
  /**
   * معالجة سؤال نصي
   */
  askQuestion: publicProcedure
    .input(z.object({ question: z.string() }))
    .mutation(async ({ input }) => {
      console.log('❓ Question:', input.question);

      // دالة لجلب البيانات حسب نوع السؤال
      const getDataFunction = async (intent: string, params: any) => {
        switch (intent) {
          case 'customer_balance':
            if (params.entity) {
              const customers = await db.searchCustomerBalances(params.entity);
              return customers.slice(0, 5);
            }
            return [];

          case 'top_debtors':
            const limit = params.limit || 10;
            const allCustomers = await db.getCustomerBalances();
            return allCustomers
              .filter(c => (c.currentBalance || 0) > 0)
              .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
              .slice(0, limit);

          case 'supplier_balance':
            if (params.entity) {
              const suppliers = await db.searchAccountBalances(params.entity);
              return suppliers.filter(s => s.accountCode.startsWith('201')).slice(0, 5);
            }
            return [];

          case 'total_sales':
            // TODO: إضافة جدول المبيعات
            return { message: 'جدول المبيعات غير متوفر حالياً' };

          case 'account_info':
            if (params.entity) {
              const accounts = await db.searchAccountBalances(params.entity);
              return accounts.slice(0, 5);
            }
            return [];

          default:
            return { message: 'نوع السؤال غير مدعوم حالياً' };
        }
      };

      const result = await openaiService.processAccountingQuery(
        input.question,
        getDataFunction
      );

      return {
        success: true,
        answer: result.answer,
        data: result.data,
      };
    }),

  /**
   * تحويل صوت إلى نص
   */
  transcribeVoice: publicProcedure
    .input(z.object({
      audioBase64: z.string(),
      filename: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const audioBuffer = Buffer.from(input.audioBase64, 'base64');
        const text = await openaiService.transcribeAudio(
          audioBuffer,
          input.filename || 'voice.ogg'
        );

        return {
          success: true,
          text,
        };
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * معالجة رسالة صوتية كاملة (تحويل + فهم + رد)
   */
  processVoiceMessage: publicProcedure
    .input(z.object({
      audioBase64: z.string(),
      filename: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // 1. تحويل الصوت لنص
        const audioBuffer = Buffer.from(input.audioBase64, 'base64');
        const question = await openaiService.transcribeAudio(
          audioBuffer,
          input.filename || 'voice.ogg'
        );

        console.log('🎤 Transcribed:', question);

        // 2. معالجة السؤال
        const getDataFunction = async (intent: string, params: any) => {
          switch (intent) {
            case 'customer_balance':
              if (params.entity) {
                const customers = await db.searchCustomerBalances(params.entity);
                return customers.slice(0, 5);
              }
              return [];

            case 'top_debtors':
              const limit = params.limit || 10;
              const allCustomers = await db.getCustomerBalances();
              return allCustomers
                .filter(c => (c.currentBalance || 0) > 0)
                .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
                .slice(0, limit);

            default:
              return { message: 'نوع السؤال غير مدعوم' };
          }
        };

        const result = await openaiService.processAccountingQuery(
          question,
          getDataFunction
        );

        // 3. تحويل الرد لصوت (اختياري)
        // const audioResponse = await openaiService.textToSpeech(result.answer);

        return {
          success: true,
          question,
          answer: result.answer,
          data: result.data,
          // audioBase64: audioResponse.toString('base64'),
        };
      } catch (error: any) {
        console.error('❌ Voice processing error:', error);
        return {
          success: false,
          error: error.message,
        };
      }
    }),

  /**
   * الحصول على اقتراحات أسئلة
   */
  getSuggestions: publicProcedure.query(async () => {
    return {
      suggestions: [
        'كم رصيد العميل أحمد؟',
        'أكبر 10 عملاء مدينين',
        'إجمالي المبيعات اليوم',
        'رصيد المورد 201011',
        'عدد العملاء برصيد صفر',
        'أرصدة البنوك',
        'العملاء المتأخرين في السداد',
        'ملخص الأرصدة',
      ],
    };
  }),
});
