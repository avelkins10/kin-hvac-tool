import { NextResponse } from "next/server"

export const runtime = "nodejs"

type IncomingFile = {
  data: string // base64 string
  mediaType?: string // "image/jpeg", "image/png", "image/heic", etc
  filename?: string
}

function normalizeMediaType(mediaType: string | undefined): string {
  if (!mediaType || typeof mediaType !== "string") {
    return "image/jpeg"
  }

  const type = mediaType.toLowerCase()

  // OpenAI supports: image/jpeg, image/png, image/gif, image/webp
  // HEIC/HEIF from iPhones need to be treated as jpeg (browsers often convert them)
  if (type.includes("heic") || type.includes("heif")) {
    return "image/jpeg" // OpenAI doesn't support HEIC directly, but browsers often convert
  }

  // Pass through supported types
  if (
    type === "image/jpeg" ||
    type === "image/jpg" ||
    type === "image/png" ||
    type === "image/gif" ||
    type === "image/webp"
  ) {
    return type === "image/jpg" ? "image/jpeg" : type
  }

  // Default fallback for unknown image types
  if (type.startsWith("image/")) {
    return "image/jpeg"
  }

  return "image/jpeg"
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "Missing OPENAI_API_KEY on server" }, { status: 500 })
    }

    const body = (await req.json()) as { file?: IncomingFile }
    const file = body.file

    if (!file || !file.data) {
      return NextResponse.json({ error: "Missing file or file.data in request body" }, { status: 400 })
    }

    if (file.data.length > 4_000_000) {
      return NextResponse.json(
        {
          error:
            "Image is too large. Please retake the photo closer to the nameplate so the text fills most of the frame.",
        },
        { status: 400 },
      )
    }

    const mediaType = normalizeMediaType(file.mediaType)

    const imageUrl = `data:${mediaType};base64,${file.data}`

    const payload = {
      model: "gpt-4o",
      messages: [
        {
          // Global rules for every reply
          role: "system",
          content:
            "You are an HVAC expert who analyzes existing systems and suggests replacements " +
            "for residential homes. You have the dry wit of Bill Murray, the absurd confidence of Will Ferrell, " +
            "and the snarky charm of Dana Carvey. You must follow these rules: " +
            "1) Only recommend Daikin or Goodman equipment. " +
            "2) Never mention any other brand names as replacements. " +
            "3) Only recommend systems that are SEER 16 or higher. " +
            "4) If the existing system is below 16 SEER, clearly explain the efficiency upgrade. " +
            "5) Keep the tone sarcastic and funny but still helpful and professional. " +
            "6) Always respond with valid JSON only - no markdown, no code blocks.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Analyze this HVAC nameplate image and return this exact JSON structure:\n" +
                "{\n" +
                '  "brand": "string or null",\n' +
                '  "modelNumber": "string or null",\n' +
                '  "serialNumber": "string or null",\n' +
                '  "coolingCapacityBTU": number or null,\n' +
                '  "heatingCapacityBTU": number or null,\n' +
                '  "seerRating": number or null,\n' +
                '  "voltage": "string or null",\n' +
                '  "refrigerantType": "string or null (R-22, R-410A, etc.)",\n' +
                '  "estimatedAge": "string or null",\n' +
                '  "unitType": "string or null (AC, Heat Pump, Furnace, Package Unit, etc.)",\n' +
                '  "tonnage": number or null,\n' +
                '  "additionalNotes": "string or null",\n' +
                '  "salesRoast": "A SHORT, PUNCHY, HILARIOUS roast of this HVAC unit (3-4 sentences MAX). Be savage but lovable about what\'s wrong with this ancient relic.",\n' +
                '  "replacementSuggestion": "Recommend exactly two Daikin or Goodman replacement options at 16 SEER or higher. Focus on efficiency, staging/inverter tech, and comfort benefits. No pricing."\n' +
                "}\n\n" +
                "Extract all visible information from the nameplate. Use null for values you cannot determine.",
            },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    })

    const openaiJson = await openaiRes.json()

    if (!openaiRes.ok) {
      console.error("OpenAI error response:", openaiJson)
      return NextResponse.json(
        {
          error: "Analysis failed",
          detail: openaiJson.error?.message || "OpenAI request failed",
        },
        { status: openaiRes.status },
      )
    }

    const text = openaiJson.choices?.[0]?.message?.content ?? ""

    // Try to parse the JSON response
    try {
      let cleanedMessage = text.trim()
      if (cleanedMessage.startsWith("```json")) {
        cleanedMessage = cleanedMessage.slice(7)
      } else if (cleanedMessage.startsWith("```")) {
        cleanedMessage = cleanedMessage.slice(3)
      }
      if (cleanedMessage.endsWith("```")) {
        cleanedMessage = cleanedMessage.slice(0, -3)
      }
      cleanedMessage = cleanedMessage.trim()

      const data = JSON.parse(cleanedMessage)
      return NextResponse.json({ success: true, data })
    } catch {
      return NextResponse.json({
        success: true,
        data: {
          parseError: true,
          rawText: text,
          salesRoast: "Couldn't parse this nameplate, but I bet it's older than my jokes.",
          replacementSuggestion: "Whatever it is, a modern 16+ SEER heat pump would be better.",
        },
      })
    }
  } catch (err: unknown) {
    console.error("Error in analyze-nameplate route:", err)
    const message = err instanceof Error ? err.message : "Unknown server error"
    return NextResponse.json({ error: "Analysis failed", detail: message }, { status: 500 })
  }
}
