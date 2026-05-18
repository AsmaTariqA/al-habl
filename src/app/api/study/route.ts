import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { verseKey, lens, arabicText, translationText, question } =
      await request.json();

    if (!verseKey || !lens) {
      return NextResponse.json(
        { error: "Missing verseKey or lens" },
        { status: 400 }
      );
    }

    const lensInstructions: Record<string, string> = {
      vocabulary: `The user is studying through the LANGUAGE LENS.
        Focus on: word purposes, meanings, Arabic roots, why specific words were chosen, word order, grammar.
        Use fetch_word_morphology for key words in the verse.
        Use fetch_word_concordance to show how the word appears elsewhere.
        Use fetch_tafsir with en-ibn-kathir for what scholars said about word choices and linguistic features.`,

      structure: `The user is studying through the QURANIC WORLD lens.
        Focus on: historical context, revelation circumstances, social context of Prophet (SAW), civilizations mentioned, creation and natural laws.
        Use fetch_tafsir with en-ibn-kathir — best for historical and contextual background.`,

      context: `The user is studying through the PERSONAL EXPERIENCE lens.
        Focus on: personal meaning, spiritual reflection, how the verse relates to the reader's life, spiritual transformation.
        Use fetch_tafsir with ar-saadi — emphasizes practical application and personal connection.`,

      audience: `The user is studying through the CONNECTIONS lens.
        Focus on: recurring themes within the Surah, connections to preceding and following verses, connections to other parts of Quran and Hadith.
        Use fetch_tafsir and search_tafsir to find related verses and scholarly connections.`,

      relevance: `The user is studying through the GENERAL LESSONS lens.
        Focus on: fundamental principles and lessons, analogous situations, practical wisdom, transformational messages.
        Use fetch_tafsir with en-ibn-kathir and ar-saadi for comprehensive tafsir highlighting general principles.`,
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
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: `You are a Quran study librarian. Your job is to help Muslims access 
verified knowledge about the Quran — not to reflect for them or give spiritual advice.

You have access to the Quran MCP server (mcp.quran.ai) which provides verified, 
canonical content from quran.com — Arabic text, tafsir from classical scholars, 
word morphology, and translations.

The verse being studied:
- Reference: ${verseKey}
- Arabic: ${arabicText}
- Translation: ${translationText}

${lensInstructions[lens] || lensInstructions.relevance}

RULES — follow strictly:
1. Call fetch_grounding_rules FIRST before any other tool
2. Always fetch from MCP tools — never use training data for Quranic content
3. Present what scholars said — clearly and accessibly in English
4. Never add your own interpretation or spiritual opinion
5. Never say "this means you should..."
6. Keep response under 200 words
7. End with: "Sources: [exact tool calls you made]"
8. Be warm and accessible — you are helping someone learn`,

        messages: [
          {
            role: "user",
            content: `Verse: ${verseKey}\nLens: ${lens}\nQuestion: ${userQuestion}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("Anthropic API error:", error);
      return NextResponse.json(
        { error: "AI service unavailable. Please try again." },
        { status: 503 }
      );
    }

    const data = await response.json();

    const textContent = data.content
      ?.filter((block: any) => block.type === "text")
      ?.map((block: any) => block.text)
      ?.join("\n")
      ?.trim();

    if (!textContent) {
      return NextResponse.json(
        { error: "No response generated. Please try again." },
        { status: 500 }
      );
    }

    const sourcesMatch = textContent.match(/Sources?:[\s\S]*$/);
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
      { status: 500 }
    );
  }
}