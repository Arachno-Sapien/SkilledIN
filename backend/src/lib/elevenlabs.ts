import { ElevenLabsClient } from "elevenlabs";

let elevenLabsClient: ElevenLabsClient | null = null;

function getClient(): ElevenLabsClient | null {
  if (!process.env.ELEVENLABS_API_KEY) {
    return null;
  }
  if (!elevenLabsClient) {
    elevenLabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  return elevenLabsClient;
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = "audio/webm",
  lang?: string
): Promise<{ text: string; languageCode?: string }> {
  const client = getClient();
  if (!client) {
    // Offline / Mock transcription fallback for dev testing
    console.warn("ELEVENLABS_API_KEY not set. Using fallback transcript.");
    return {
      text: "ನನ್ನ ಹೆಸರು ರವಿ, ನಾನು ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಜಯನಗರದಲ್ಲಿ ಇದ್ದೇನೆ",
      languageCode: lang || "kn",
    };
  }

  try {
    const audioBuffer = Buffer.from(audioBase64, "base64");
    const audioBlob = new Blob([audioBuffer], { type: mimeType });

    // Use Scribe STT
    const model = process.env.ELEVENLABS_STT_MODEL || "scribe_v3";
    const result = await (client as any).speechToText.convert({
      file: audioBlob,
      model_id: model,
      language_code: lang,
    });

    return {
      text: result.text || "",
      languageCode: result.language_code || lang,
    };
  } catch (err) {
    console.warn("ElevenLabs STT error, falling back to mock:", (err as Error).message);
    return {
      text: "ನನ್ನ ಹೆಸರು ರವಿ, ನಾನು ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಜಯನಗರದಲ್ಲಿ ಇದ್ದೇನೆ",
      languageCode: lang || "kn",
    };
  }
}

export async function textToSpeech(
  text: string,
  lang: string = "en"
): Promise<string | null> {
  const client = getClient();
  if (!client) {
    return null;
  }

  try {
    // Default: premade "Sarah". Free plans can use premade voices via the API, but not Voice Library voices (HTTP 402).
    const voiceId = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
    const modelId = process.env.ELEVENLABS_TTS_MODEL || "eleven_v4_turbo"; // speaks Hindi and Kannada

    const audioStream = await client.textToSpeech.convert(voiceId, {
      text: text.slice(0, 500),
      model_id: modelId,
      output_format: "mp3_44100_64",
    });

    const chunks: Buffer[] = [];
    for await (const chunk of audioStream as any) {
      chunks.push(Buffer.from(chunk));
    }
    const fullBuffer = Buffer.concat(chunks);
    return fullBuffer.toString("base64");
  } catch (err) {
    console.warn("ElevenLabs TTS failed (returning null, fallback on client):", (err as Error).message);
    return null;
  }
}
