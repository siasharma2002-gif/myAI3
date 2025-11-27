// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const PINECONE_INDEX_NAME = process.env.PINECONE_INDEX_NAME!;
const PINECONE_NAMESPACE = process.env.PINECONE_NAMESPACE || "default";

// Koa's personality + guardrails
const KOA_SYSTEM_PROMPT = `
You are Koa 🐨, a gentle, friendly micro-mindfulness buddy.
Users are usually students or early-career professionals who are stressed, tired, or overwhelmed.

Core rules:
- Tone: warm, cozy, calm, non-judgmental, simple language.
- Give **1–2 minute micro-practices** only (breathing, grounding, short body scan, tiny reflections).
- Never diagnose, label, or claim to treat mental-health conditions.
- Do NOT talk like a therapist; you are a supportive buddy.
- Always be encouraging and normalize what the user is feeling.
- If the user sounds very distressed, hopeless, or mentions self-harm:
  - Gently say you’re an AI buddy and not a crisis service.
  - Encourage them to reach out to a trusted person or local professional/helpline.

Use the knowledge snippets you receive as your main source for practices.
When you reply:
1. Start with 1–2 warm validating sentences.
2. Offer **one** concrete micro-practice that fits their mood/energy/context.
3. Describe steps clearly and briefly (3–6 bullet points max).
4. End with a tiny follow-up question like:
   “Want another option?” or “Want something even shorter?”
`;

// Type of the messages coming from the frontend
type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const messages = (body.messages || []) as ChatMessage[];

    const latestUserMessage =
      [...messages].reverse().find((m) => m.role === "user")?.content || "";

    if (!latestUserMessage) {
      return NextResponse.json(
        { error: "No user message provided." },
        { status: 400 }
      );
    }

    // 1) Retrieve relevant snippets from Pinecone (integrated index)
    const index = pc.index(PINECONE_INDEX_NAME);
    const namespace = index.namespace(PINECONE_NAMESPACE);

    const search = await namespace.searchRecords({
      query: {
        topK: 5,
        // This text will be embedded by Pinecone's integrated model
        inputs: { text: latestUserMessage },
      },
    });

    // Collect text fields from returned records
    const records = (search.records || []) as any[];

    const contextText = records
      .map((rec) => {
        const values = rec.values || {};
        // Join all string fields from the record (e.g., text, pre_context, post_context)
        return Object.values(values)
          .filter((v) => typeof v === "string")
          .join("\n");
      })
      .filter(Boolean)
      .join("\n\n---\n\n");

    const contextForModel =
      contextText || "No specific snippet found; fall back to general micro-mindfulness advice.";

    // 2) Ask OpenAI to craft a reply + a structured mini-practice
    const completion = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: [
        { role: "system", content: KOA_SYSTEM_PROMPT },
        {
          role: "system",
          content:
            "Here are knowledge base snippets you can draw practices from:\n\n" +
            contextForModel,
        },
        // include the prior conversation so Koa keeps context
        ...messages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        {
          role: "system",
          content: `
Respond ONLY as a JSON object with this exact shape:

{
  "reply": "short warm message Koa says to the user (max ~120 words)",
  "miniPractice": {
    "title": "name of the practice",
    "moodTags": ["stressed", "anxious", "tired", "overwhelmed", "sad", "numb"],
    "energyLevel": "low | medium | high",
    "environment": "at_desk | commute | bedtime | flexible",
    "duration": "1–2 mins",
    "steps": [
      "step 1 in simple language",
      "step 2 ...",
      "step 3 ..."
    ],
    "note": "optional 1–2 line gentle reminder or reframe"
  }
}

Do not include any extra text outside this JSON.
`,
        },
      ],
    });

    const content = completion.choices[0].message?.content || "{}";

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Fallback if something weird happens with JSON formatting
      parsed = {
        reply:
          "Hmm, something went wrong while talking to my brain in the cloud. Could you try again in a moment? 🫧",
        miniPractice: null,
      };
    }

    // This shape matches what your frontend expects: { reply, miniPractice }
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Koa backend error:", err);
    return NextResponse.json(
      {
        reply:
          "Hmm, something went wrong while talking to my brain in the cloud. Can you try again in a moment? 🫧",
        miniPractice: null,
      },
      { status: 500 }
    );
  }
}
