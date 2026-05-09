import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { verseKey, lens, arabicText, translationText, question } =
      await request.json();

    if (!verseKey || !lens) {
      return NextResponse.json(
        { error: "Missing verseKey or lens" },
        { status: 400 },
      );
    }

    const lensInstructions: Record<string, string> = {
      vocabulary: `The user is studying this verse through the VOCABULARY lens. 
        Focus on: word meanings, Arabic roots, why specific words were chosen.
        Use: fetch_word_morphology and fetch_word_concordance for the key words.
        Then use fetch_tafsir to see what scholars said about the word choices.`,

      structure: `The user is studying this verse through the STRUCTURE lens.
        Focus on: sentence order, literary devices, repetition, emphasis.
        Use: fetch_tafsir with ar-tahrir-wa-tanwir (Ibn Ashur) — he is the best for linguistic analysis.`,

      context: `The user is studying this verse through the CONTEXT lens.
        Focus on: when it was revealed, what situation it responded to, historical background.
        Use: fetch_tafsir with en-ibn-kathir — he includes the best asbab al-nuzul (reasons for revelation).`,

      audience: `The user is studying this verse through the AUDIENCE lens.
        Focus on: who Allah is addressing, what message is being sent to them.
        Use: fetch_tafsir with ar-saadi — he is clear on who verses address and why.`,

      relevance: `The user is studying this verse through the RELEVANCE lens.
        Focus on: practical application, timeless lessons, how scholars connected it to daily life.
        Use: fetch_tafsir with en-ibn-kathir and ar-saadi for accessible commentary.`,
    };

    const userQuestion =
      question?.trim() ||
      `Help me understand this verse through the ${lens} lens. What do the scholars say?`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "interleaved-thinking-2025-05-14",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a Quran study librarian. Your job is to help Muslims access 
verified knowledge about the Quran — not to reflect for them or give spiritual advice.

You have access to the Quran MCP server (mcp.quran.ai) which provides verified, 
canonical content from quran.com — Arabic text, tafsir commentary from classical 
scholars, word morphology, and translations.

The verse being studied:
- Reference: ${verseKey}
- Arabic: ${arabicText}
- Translation: ${translationText}

${lensInstructions[lens] || lensInstructions.relevance}

RULES — follow these strictly:
1. Always call fetch_grounding_rules FIRST before any other tool
2. Always fetch content from the MCP tools — never rely on your training data for Quranic content
3. Present what the scholars said — clearly and accessibly in English
4. Never add your own interpretation or spiritual opinion
5. Never say "this means you should..." or give personal advice
6. Keep the main response under 200 words
7. Always end with: "Sources: [list the exact tool calls you made]"
8. If the user asks something beyond scholarly knowledge, say so honestly
9. Be warm and accessible — you are helping someone learn, not lecturing them`,

        messages: [
          {
            role: "user",
            content: `Verse: ${verseKey}\nLens: ${lens}\nQuestion: ${userQuestion}`,
          },
        ],

        mcp_servers: [
          {
            type: "url",
            url: "https://mcp.quran.ai/",
            name: "quran",
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return NextResponse.json(
        { error: "AI service unavailable. Please try again." },
        { status: 503 },
      );
    }

    const data = await response.json();

    // Extract text content from response
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const textContent = data.content
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.filter((block: any) => block.type === "text")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.map((block: any) => block.text)
      ?.join("\n")
      ?.trim();

    if (!textContent) {
      return NextResponse.json(
        { error: "No response generated. Please try again." },
        { status: 500 },
      );
    }

    // Extract sources line if present
    const sourcesMatch = textContent.match(/Sources?:(.+)$/);
    const sources = sourcesMatch
      ? sourcesMatch[0].trim()
      : "Grounded in quran.ai";

    const mainResponse = sourcesMatch
      ? textContent.replace(sourcesMatch[0], "").trim()
      : textContent;

    return NextResponse.json({
      response: mainResponse,
      sources,
    });
  } catch (error) {
    console.error("Study API error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
