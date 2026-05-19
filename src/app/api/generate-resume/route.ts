import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, city, objective_hint, edu10, edu12, eduGrad, skills, experience, languages } = body;

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json({ error: "API Key missing in server config" }, { status: 500 });
    }

    const educationText = [
      edu10?.year ? `10th: ${edu10.board}, ${edu10.school}, ${edu10.year}, ${edu10.percent}` : "",
      edu12?.year ? `12th (${edu12.stream || "Intermediate"}): ${edu12.board}, ${edu12.school}, ${edu12.year}, ${edu12.percent}` : "",
      eduGrad?.degree ? `${eduGrad.degree}: ${eduGrad.university}, ${eduGrad.college}, ${eduGrad.year}, ${eduGrad.percent}` : "",
    ].filter(Boolean).join(" | ");

    const prompt = `You are a professional Indian resume writer. Generate resume content for a government job applicant. Return ONLY a valid JSON object with NO explanation, NO markdown, NO code blocks.

Applicant:
- Name: ${name}
- City: ${city}
- Education: ${educationText || "Not provided"}
- Skills: ${skills}
- Experience: ${experience || "Fresher"}
- Languages: ${languages || "Hindi, English"}
- Target Job: ${objective_hint || "Indian Government Job"}

Return this exact JSON structure (no other text):
{"objective":"professional 2-3 sentence career objective for Indian government job","summary":"professional 3-4 sentence summary of strengths","skills_formatted":["skill1","skill2","skill3","skill4","skill5","skill6"],"achievements":["achievement related to education or skills","another relevant achievement","participation or activity"],"hobbies":["hobby1","hobby2","hobby3"]}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "You are a professional resume writer. Always respond with ONLY valid JSON, no markdown, no explanation." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1024,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API error:", response.status, errText);
      return NextResponse.json({ error: "AI service error. Please try again in a moment." }, { status: 500 });
    }

    const data = await response.json();
    const raw = data?.choices?.[0]?.message?.content || "";

    if (!raw) {
      console.error("Empty response from AI:", JSON.stringify(data));
      return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
    }

    // Strip markdown code blocks if somehow present
    const cleaned = raw
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("JSON parse failed:", cleaned);
        return NextResponse.json({ error: "Could not parse AI response. Please try again." }, { status: 500 });
      }
      parsed = JSON.parse(jsonMatch[0]);
    }

    return NextResponse.json({ success: true, data: parsed });

  } catch (err: any) {
    console.error("Resume generate error:", err);
    return NextResponse.json({ error: err.message || "Failed to generate resume" }, { status: 500 });
  }
}
