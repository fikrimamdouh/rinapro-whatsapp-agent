/**
 * OpenAI Service
 * Handles voice transcription, question understanding, and text generation
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test-key',
});

/**
 * تحويل الصوت إلى نص باستخدام Whisper
 */
export async function transcribeAudio(audioBuffer: Buffer, filename: string = 'audio.ogg'): Promise<string> {
  try {
    const file = new File([audioBuffer], filename, { type: 'audio/ogg' });
    
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      language: 'ar', // Arabic
      response_format: 'text',
    });

    return transcription as unknown as string;
  } catch (error: any) {
    console.error('❌ Whisper transcription error:', error.message);
    throw new Error('فشل تحويل الصوت إلى نص');
  }
}

/**
 * فهم السؤال المحاسبي واستخراج المعلومات
 */
export async function understandAccountingQuestion(question: string): Promise<{
  intent: string;
  entity?: string;
  parameters?: Record<string, any>;
  query?: string;
}> {
  try {
    const systemPrompt = `أنت مساعد محاسبي ذكي. مهمتك فهم الأسئلة المحاسبية واستخراج المعلومات التالية:
1. intent: نوع السؤال (customer_balance, top_debtors, supplier_balance, total_sales, account_info, general_query)
2. entity: اسم العميل/المورد/الحساب إن وجد
3. parameters: معلومات إضافية (limit, date, range, etc)
4. query: استعلام SQL مقترح إن أمكن

أمثلة:
- "كم رصيد العميل أحمد؟" → {intent: "customer_balance", entity: "أحمد"}
- "أكبر 10 عملاء مدينين" → {intent: "top_debtors", parameters: {limit: 10}}
- "إجمالي المبيعات اليوم" → {intent: "total_sales", parameters: {date: "today"}}
- "رصيد المورد 201011" → {intent: "supplier_balance", entity: "201011"}

أجب بصيغة JSON فقط.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result;
  } catch (error: any) {
    console.error('❌ GPT-4 understanding error:', error.message);
    return {
      intent: 'general_query',
      entity: question,
    };
  }
}

/**
 * توليد رد نصي احترافي
 */
export async function generateResponse(question: string, data: any): Promise<string> {
  try {
    const systemPrompt = `أنت مساعد محاسبي محترف. قدم إجابات واضحة ومختصرة بالعربية.
- استخدم الأرقام بوضوح
- اذكر العملة (ريال سعودي)
- كن مهذباً ومحترفاً
- إذا لم تجد بيانات، اذكر ذلك بوضوح`;

    const userPrompt = `السؤال: ${question}\n\nالبيانات:\n${JSON.stringify(data, null, 2)}\n\nقدم إجابة واضحة ومختصرة:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0].message.content || 'عذراً، لم أتمكن من الإجابة.';
  } catch (error: any) {
    console.error('❌ GPT-4 generation error:', error.message);
    return 'عذراً، حدث خطأ في معالجة السؤال.';
  }
}

/**
 * تحويل النص إلى صوت (نستخدم Google TTS كبديل مجاني)
 */
export async function textToSpeech(text: string): Promise<Buffer> {
  // TODO: إضافة ElevenLabs أو Google TTS
  // حالياً نرجع placeholder
  return Buffer.from('audio-placeholder');
}

/**
 * معالجة سؤال محاسبي كامل
 */
export async function processAccountingQuery(
  question: string,
  getDataFunction: (intent: string, params: any) => Promise<any>
): Promise<{ answer: string; data: any }> {
  try {
    // 1. فهم السؤال
    const understanding = await understandAccountingQuestion(question);
    console.log('🧠 Understanding:', understanding);

    // 2. جلب البيانات
    const data = await getDataFunction(understanding.intent, {
      entity: understanding.entity,
      ...understanding.parameters,
    });
    console.log('📊 Data:', data);

    // 3. توليد الرد
    const answer = await generateResponse(question, data);
    console.log('💬 Answer:', answer);

    return { answer, data };
  } catch (error: any) {
    console.error('❌ Query processing error:', error.message);
    return {
      answer: 'عذراً، حدث خطأ في معالجة السؤال.',
      data: null,
    };
  }
}
