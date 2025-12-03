# 🎤 Voice Implementation Plan for RinaPro WhatsApp Agent

## Implementation Roadmap

### Phase 1: Speech-to-Text (Transcription) - PRIORITY HIGH
**Estimated Time**: 2-4 hours

#### Option A: Whisper.cpp (Recommended - Offline)
- **Pros**: Free, offline, high accuracy, supports Arabic
- **Cons**: Requires C++ compilation, ~1GB model download
- **Implementation**:
  ```bash
  # Install whisper.cpp
  git clone https://github.com/ggerganov/whisper.cpp
  cd whisper.cpp
  make
  bash ./models/download-ggml-model.sh base
  ```
  
  ```typescript
  // server/services/whisperTranscription.ts
  import { exec } from 'child_process';
  import { promisify } from 'util';
  
  const execAsync = promisify(exec);
  
  export async function transcribeWithWhisper(audioPath: string): Promise<string> {
    const { stdout } = await execAsync(
      `./whisper.cpp/main -m ./whisper.cpp/models/ggml-base.bin -f ${audioPath} -l ar`
    );
    return stdout.trim();
  }
  ```

#### Option B: OpenAI Whisper API (Cloud)
- **Pros**: Easy integration, no local setup
- **Cons**: Costs $0.006/minute, requires API key, internet dependency
- **Implementation**:
  ```typescript
  import OpenAI from 'openai';
  
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  export async function transcribeWithOpenAI(audioPath: string): Promise<string> {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: 'whisper-1',
      language: 'ar',
    });
    return transcription.text;
  }
  ```

#### Option C: Google Speech-to-Text
- **Pros**: Good Arabic support, reliable
- **Cons**: Requires Google Cloud account, costs money
- **Implementation**: Similar to OpenAI but with Google Cloud SDK

**Recommendation**: Start with Whisper.cpp for offline capability, add OpenAI as fallback.

---

### Phase 2: Text-to-Speech (TTS) - PRIORITY MEDIUM
**Estimated Time**: 2-3 hours

#### Option A: gTTS (Google Text-to-Speech) - Free
- **Pros**: Free, easy to use, supports Arabic
- **Cons**: Requires internet, basic voice quality
- **Implementation**:
  ```bash
  npm install gtts
  ```
  
  ```typescript
  import gtts from 'gtts';
  
  export async function generateVoiceWithGTTS(text: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const speech = new gtts(text, 'ar');
      const chunks: Buffer[] = [];
      
      speech.stream()
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => resolve(Buffer.concat(chunks)))
        .on('error', reject);
    });
  }
  ```

#### Option B: ElevenLabs (Premium Quality)
- **Pros**: Excellent voice quality, natural Arabic
- **Cons**: Costs money (~$0.30/1K characters), requires API key
- **Implementation**:
  ```typescript
  import axios from 'axios';
  
  export async function generateVoiceWithElevenLabs(text: string): Promise<Buffer> {
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      { text, model_id: 'eleven_multilingual_v2' },
      {
        headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
        responseType: 'arraybuffer',
      }
    );
    return Buffer.from(response.data);
  }
  ```

#### Option C: Azure TTS
- **Pros**: Good quality, reliable, supports Arabic dialects
- **Cons**: Requires Azure account, costs money
- **Implementation**: Use Azure Cognitive Services SDK

**Recommendation**: Start with gTTS for basic functionality, add ElevenLabs for premium users.

---

### Phase 3: Voice Command Processing - PRIORITY HIGH
**Estimated Time**: 1-2 hours

```typescript
// server/services/voiceCommandProcessor.ts
export async function processVoiceCommand(audioPath: string): Promise<string> {
  // 1. Transcribe voice to text
  const text = await transcribeVoice(audioPath);
  
  // 2. Process command
  const result = await commandEngine.processMessage(sender, text);
  
  // 3. Optionally generate voice response
  if (process.env.VOICE_OUTBOUND_ENABLED === 'true') {
    const voiceBuffer = await generateVoiceResponse(result.response);
    return voiceBuffer;
  }
  
  return result.response;
}
```

---

### Phase 4: Voice Report Generation - PRIORITY LOW
**Estimated Time**: 2-3 hours

```typescript
// server/services/voiceReportGenerator.ts
export async function generateVoiceReport(reportType: string): Promise<Buffer> {
  // 1. Generate report text
  const kpis = calculateDashboardKPIs();
  const reportText = `
    تقرير ${reportType}
    إجمالي المبيعات: ${kpis.totalSales}
    رصيد الصندوق: ${kpis.cashBalance} ريال
    قيمة المخزون: ${kpis.inventoryValue} ريال
  `;
  
  // 2. Convert to voice
  const voiceBuffer = await generateVoiceResponse(reportText, 'ar');
  
  // 3. Save and return
  return voiceBuffer;
}
```

---

## Environment Variables

Add to `.env`:
```bash
# Voice Features
VOICE_INBOUND_ENABLED=true
VOICE_OUTBOUND_ENABLED=false
TRANSCRIPTION_PROVIDER=whisper  # whisper | openai | google
TTS_PROVIDER=gtts  # gtts | elevenlabs | azure

# API Keys (if using cloud services)
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
AZURE_TTS_KEY=...
AZURE_TTS_REGION=...

# Whisper.cpp path (if using local)
WHISPER_CPP_PATH=./whisper.cpp
WHISPER_MODEL_PATH=./whisper.cpp/models/ggml-base.bin
```

---

## Testing Checklist

### Manual Tests:
1. ✅ Send voice note to WhatsApp bot
2. ✅ Check console logs for voice detection
3. ✅ Verify audio file is saved
4. ⏳ Test transcription (after implementation)
5. ⏳ Test voice response (after implementation)

### Automated Tests:
```typescript
// tests/voice.test.ts
describe('Voice Handler', () => {
  it('should detect voice messages', () => {
    const msg = createMockVoiceMessage();
    const info = detectVoiceMessage(msg);
    expect(info.isVoice).toBe(true);
  });
  
  it('should download voice messages', async () => {
    const buffer = await downloadVoiceMessage(mockMsg);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
```

---

## Cost Estimation

### Free Tier (Recommended for MVP):
- Voice Detection: ✅ Free (Baileys)
- Voice Download: ✅ Free (Baileys)
- Transcription: ✅ Free (Whisper.cpp)
- TTS: ✅ Free (gTTS)
- **Total**: $0/month

### Premium Tier (Production):
- Transcription: OpenAI Whisper API (~$0.006/min)
- TTS: ElevenLabs (~$0.30/1K chars)
- **Estimated**: $50-200/month for 1000 voice messages

---

## Implementation Priority

1. **HIGH**: Voice detection and download (✅ DONE)
2. **HIGH**: Whisper.cpp integration for transcription
3. **MEDIUM**: gTTS integration for basic TTS
4. **LOW**: Premium TTS (ElevenLabs)
5. **LOW**: Voice report generation

---

## Next Steps

1. Install Whisper.cpp locally
2. Test transcription with sample audio
3. Integrate with WhatsApp handler
4. Add gTTS for responses
5. Test end-to-end voice flow
6. Add feature flags and configuration
7. Document usage in README
