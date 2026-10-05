const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
You are a flight-booking assistant AI. Your ONLY job is to read the user's message and return a JSON object describing their intent. Do NOT add any explanation, markdown, or text outside the JSON.

Possible intents:
- SEARCH_FLIGHT
- FLIGHT_DETAILS
- BOOK_FLIGHT
- CHECK_BOOKING
- CANCEL_BOOKING
- CHANGE_SEAT
- GREETING
- UNKNOWN

Return JSON in this exact shape:
{
  "intent": "SEARCH_FLIGHT",
  "source": "Delhi",
  "destination": "Mumbai",
  "date": "2026-08-20",
  "maxPrice": 5000,
  "stops": 0,
  "seat": null,
  "bookingId": null,
  "reply": "A short, friendly natural-language reply to show the user"
}

Rules:
- Only include fields relevant to the intent; use null for fields that don't apply.
- If the user doesn't specify a date, leave date as null.
- For CHANGE_SEAT, extract the desired new seat into "seat" (e.g. "2B"), and bookingId if the user mentions a PNR or booking ID. If they don't specify a booking ID but only recently made one booking, leave bookingId as null — the backend will figure out which booking to use.
- If intent is GREETING or UNKNOWN, only "intent" and "reply" matter.
- "reply" should always be a short, natural sentence responding to the user, e.g. "Sure, let me find flights from Delhi to Mumbai."
- Today's date is 2026-08-14, use this to resolve words like "tomorrow".
- Respond ONLY with valid JSON. No backticks, no markdown, no extra text.
`;

const getAIResponse = async (userMessage, conversationHistory = [], retries = 2) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  const historyText = conversationHistory
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const prompt = `${SYSTEM_INSTRUCTION}\n\nConversation so far:\n${historyText}\n\nUser: ${userMessage}\n\nJSON response:`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const rawText = result.response.text();
      const cleaned = rawText.replace(/```json|```/g, '').trim();

      try {
        return JSON.parse(cleaned);
      } catch (parseError) {
        return { intent: 'UNKNOWN', reply: "Sorry, I didn't understand that. Could you rephrase?" };
      }
    } catch (apiError) {
      const isOverloaded = apiError.message.includes('503') || apiError.message.includes('overloaded');
      if (isOverloaded && attempt < retries) {
        console.log(`Gemini overloaded, retrying... (attempt ${attempt + 1})`);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        continue;
      }
      throw apiError;
    }
  }
};

module.exports = getAIResponse;