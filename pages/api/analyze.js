export const config = {
  api: {
    bodyParser: {
      sizeLimit: "8mb",
    },
  },
};

const SYSTEM_PROMPT = `You are an art technique analyst helping a self-taught digital artist learn by studying images.

When given an image, analyze it like an art teacher and describe, in clear plain language:
1. Linework / brush style (e.g. clean vector lines, sketchy, textured, line weight variation)
2. Color palette (roughly how many colors, whether it's flat, muted, vibrant, gradients)
3. Shading & lighting technique (cel-shading, soft airbrush, hard shadows, rim light, etc.)
4. Composition (framing, focal point, use of space)

Then give a short "How to recreate this yourself" section with concrete, actionable steps someone could follow in a normal digital drawing app (layers, brush choices, shading order, etc.).

Be honest that this is your visual analysis/best inference, not literal recorded tool data from the original file — you cannot know the exact brush settings or layer history used, only what's visible in the image. Keep the whole response focused, practical, and skimmable — use short headers and bullet points, not long paragraphs.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests are allowed" });
  }

  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: "No image was provided" });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: "Server is missing GEMINI_API_KEY. Set it in Vercel project settings.",
    });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: SYSTEM_PROMPT }],
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  inline_data: {
                    mime_type: mediaType || "image/jpeg",
                    data: image,
                  },
                },
                {
                  text: "Analyze this image's technique and tell me how to recreate it myself.",
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Something went wrong calling Gemini");
    }

    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n");

    return res.status(200).json({ result: text || "No response text returned." });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Something went wrong" });
  }
}
