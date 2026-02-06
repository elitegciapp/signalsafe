import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function aiAnalyze(text: string) {
  // if no key → skip AI (app still works)
  if (!process.env.OPENAI_API_KEY) return null;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `
You are a fraud detection engine.

Return ONLY JSON:
{
  "verdict": "SAFE | VERIFY | HIGH_RISK",
  "riskScore": number,
  "summary": string,
  "redFlags": string[],
  "recommendedActions": string[]
}
          `,
        },
        { role: "user", content: text },
      ],
    });

    const content = res.choices[0].message.content ?? "";

    console.log("AI RAW RESPONSE:", content);

    return JSON.parse(content);
  } catch (err) {
    console.log("AI unavailable, using fallback");
    return null;
  }
}
