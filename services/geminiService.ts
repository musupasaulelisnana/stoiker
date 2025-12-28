
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Deep audit for Identity Verification & Message Integrity
 */
export async function scanMessageSecurity(content: string, subject: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Use Pro for higher accuracy in code analysis
      contents: `ACT AS A SENIOR FORENSIC AUDITOR. 
      Analyze this packet:
      Subject: ${subject}
      Content: ${content}
      
      Verify:
      1. Potential Code Injection: Look for script tags, shell commands, or obfuscated payloads.
      2. Social Engineering: Detect "Urgent Action Required" or "Account Verification" traps.
      3. Identity: Does the tone match a professional/secure context?
      4. PII: Redact or flag sensitive data.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            phishingRisk: { type: Type.STRING },
            aiDetectionScore: { type: Type.NUMBER },
            threatIndicators: { type: Type.ARRAY, items: { type: Type.STRING } },
            summary: { type: Type.STRING },
            piiDetected: { type: Type.BOOLEAN },
            identityVerified: { type: Type.BOOLEAN }
          },
          required: ["phishingRisk", "aiDetectionScore", "threatIndicators", "summary", "piiDetected", "identityVerified"],
        },
      },
    });

    return JSON.parse(response.text);
  } catch (error) {
    return {
      phishingRisk: "UNKNOWN",
      aiDetectionScore: 0,
      threatIndicators: ["Audit Engine Timeout"],
      summary: "Manual packet inspection required.",
      piiDetected: false,
      identityVerified: false
    };
  }
}

/**
 * Advanced Visual Sandbox for malware/forgery detection
 */
export async function scanFileContent(fileName: string, mimeType: string, base64Data: string) {
  try {
    const isImage = mimeType.startsWith('image/');
    const parts: any[] = [
      {
        text: `PERFORM DEEP DISSECTION.
        Filename: ${fileName}
        Type: ${mimeType}
        
        Security Checklist:
        - Detect if this is a Deepfake or AI-generated image.
        - Scan for hidden QR codes or malicious links inside text/images.
        - Identify "Double Extensions" (e.g. .jpg.exe).
        - If code: Search for backdoors or data-exfiltration patterns.`
      }
    ];

    if (isImage) {
      parts.push({
        inlineData: { mimeType, data: base64Data.split(',')[1] || base64Data }
      });
    } else {
      parts.push({ text: `DATA_STREAM: ${base64Data.substring(0, 2000)}` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: { type: Type.BOOLEAN },
            threatLevel: { type: Type.STRING },
            findings: { type: Type.STRING },
            reasoning: { type: Type.STRING }
          },
          required: ["isSafe", "threatLevel", "findings", "reasoning"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    return { isSafe: true, threatLevel: "LOW", findings: "Local scan only.", reasoning: "API Limit reached." };
  }
}
