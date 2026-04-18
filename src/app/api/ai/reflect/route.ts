// import { NextResponse } from "next/server"

// export async function POST(request: Request) {
//   const { verseKey, verseText, lens, reflection } = (await request.json()) as {
//     verseKey?: string
//     verseText?: string
//     lens?: string
//     reflection?: string
//   }

//   if (!process.env.GROQ_API_KEY) {
//     return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 })
//   }

//   const prompt = `You are a knowledgeable Quran study companion.
// The student is studying verse ${verseKey ?? ""}: ${verseText ?? ""}
// They chose the ${lens ?? ""} lens and wrote: ${reflection ?? ""}

// Give them 2 short specific follow-up questions that push their thinking deeper.
// Match their level. Be warm but intellectually rigorous. Under 80 words total.
// Return only the questions, no preamble.`

//   const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//       Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
//     },
//     body: JSON.stringify({
//       model: "llama-3.3-70b-versatile",
//       messages: [{ role: "user", content: prompt }],
//       temperature: 0.6,
//     }),
//   })

//   if (!response.ok) {
//     const errorText = await response.text()
//     return NextResponse.json({ error: "Groq request failed", details: errorText }, { status: 500 })
//   }

//   const data = (await response.json()) as {
//     choices?: { message?: { content?: string } }[]
//   }

//   const content = data.choices?.[0]?.message?.content?.trim() ?? ""
//   return NextResponse.json({ questions: content })
// }
