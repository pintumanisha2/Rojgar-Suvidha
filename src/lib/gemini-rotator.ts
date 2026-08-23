/**
 * ═══════════════════════════════════════════════════════════════════════
 * CENTRALIZED GEMINI MULTI-KEY ROTATOR & FALLBACK ENGINE
 * ═══════════════════════════════════════════════════════════════════════
 * Solves "Model Exhausted / 429 Rate Limit" by automatically rotating
 * across ALL configured Gemini API keys (comma-separated in GEMINI_API_KEYS or GEMINI_API_KEY).
 */

export function getGeminiApiKeys(): string[] {
  const rawKeys = process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || "";
  const keys = rawKeys
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  if (keys.length === 0) {
    throw new Error("No Gemini API keys found. Please set GEMINI_API_KEYS or GEMINI_API_KEY in environment variables.");
  }
  return keys;
}

// Active verified Google Gemini models in 2026 REST API order of preference
export const VALID_GEMINI_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-flash-latest",
  "gemini-3.7-flash",
];

export interface GeminiCallOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
}

export async function callGeminiWithRotation(options: GeminiCallOptions): Promise<string> {
  const {
    prompt,
    systemInstruction,
    temperature = 0.7,
    maxOutputTokens = 8192,
    jsonMode = false,
    timeoutMs = 90000,
  } = options;

  const apiKeys = getGeminiApiKeys();
  let lastError = "";

  const payload: any = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: systemInstruction ? `${systemInstruction}\n\n${prompt}` : prompt,
          },
        ],
      },
    ],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(jsonMode && { responseMimeType: "application/json" }),
    },
  };

  // Outer loop: Rotate across ALL available API keys
  for (let keyIndex = 0; keyIndex < apiKeys.length; keyIndex++) {
    const apiKey = apiKeys[keyIndex];

    // Inner loop: Try active valid Gemini models for current key
    for (const model of VALID_GEMINI_MODELS) {
      let attempt = 0;
      const maxAttempts = 2;

      while (attempt < maxAttempts) {
        attempt++;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), timeoutMs);

          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
              signal: controller.signal,
            }
          );
          clearTimeout(timer);

          const data = await res.json();

          if (data.error) {
            const errMsg = data.error.message || JSON.stringify(data.error);
            lastError = `[Key ${keyIndex + 1}/${apiKeys.length} | Model ${model}]: ${errMsg}`;

            // Check if error is Quota Exceeded / 429 / RESOURCE_EXHAUSTED
            const isQuotaError = /quota|rate.?limit|429|resource.?exhausted|you exceeded|too many/i.test(errMsg);
            if (isQuotaError) {
              console.warn(
                `⚠️ Gemini Key ${keyIndex + 1}/${apiKeys.length} (...${apiKey.slice(-4)}) exhausted quota on ${model}. Switching to next key...`
              );
              // Break model loop to IMMEDIATELY rotate to the NEXT API key!
              break; 
            }

            // Check if model not found or deprecated
            const isNotFound = /not found|deprecated|not available|does not exist/i.test(errMsg);
            if (isNotFound) {
              console.warn(`   ⏭️ Model ${model} unavailable on key ${keyIndex + 1}, trying next model...`);
              break; // Try next model on same key
            }

            // Overloaded / 503 error -> retry with backoff
            if (/overloaded|503|unavailable/i.test(errMsg) || res.status === 503) {
              console.warn(`   ⏳ ${model} overloaded (attempt ${attempt}/${maxAttempts}), retrying in 3s...`);
              await new Promise((r) => setTimeout(r, 3000));
              continue;
            }

            break; // Try next model
          }

          const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (textResponse) {
            console.log(`✅ [Gemini AI] Success using Key ${keyIndex + 1}/${apiKeys.length} & Model ${model}`);
            return textResponse;
          }
        } catch (err: any) {
          lastError = err.message || String(err);
          console.warn(`   ⚠️ Fetch error on model ${model} (attempt ${attempt}): ${lastError}`);
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    }
  }

  throw new Error(`All ${apiKeys.length} Gemini API keys exhausted across models. Last error: ${lastError}`);
}
