import { HttpError } from '../db/admin/util';
import type { IngredientSummaryRequest } from '@suppsense/shared-types';

// The key only ever lives on the server. Never put it in the desktop or mobile .env -
// VITE_ and EXPO_PUBLIC_ variables are baked into the bundle and readable by anyone.
const API_URL = 'https://api.openai.com/v1/chat/completions';
// override with OPENAI_MODEL in the backend environment if your account uses a different model
const DEFAULT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 30_000;

const SYSTEM_PROMPT = `You write ingredient summaries for SuppSense, a New Zealand app that explains what is in supplements.
Write in New Zealand English, in plain language for a general adult reader.

Write 2 to 4 sentences (about 60 to 110 words) covering:
- what the ingredient is and why it is used in supplements
- how strong the evidence is, stated honestly (say when evidence is limited or mixed)
- the most relevant safety note or who should be careful

Rules:
- Plain text only. No headings, lists, markdown or quotation marks around the answer.
- Do not state dosage numbers; the app shows recommended and maximum doses separately.
- Do not make treatment or cure claims, and do not invent studies, statistics or brand names.
- If the name is not a real ingredient, or you are unsure what it is, reply with exactly: UNKNOWN
- Use only the website WebMD or the National Institutes of Health`;

/**
 * Asks OpenAI (ChatGPT) for a short ingredient summary. The summary is returned, not saved -
 * the admin reviews it, saves it, and only then marks the ingredient as verified.
 * @throws HttpError 503 if no API key is configured, 502 if the API call fails, 422 if the model doesn't recognise the ingredient
 */
export async function generateIngredientSummary(ingredient: IngredientSummaryRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new HttpError(503, 'AI summaries are not set up. Add OPENAI_API_KEY to the backend environment and restart it.');
    }

    const context = [
        `Ingredient: ${ingredient.name}`,
        ingredient.recommended_dosage ? `Recommended dose shown in the app: ${ingredient.recommended_dosage}` : null,
        ingredient.maximum_dosage ? `Maximum dose shown in the app: ${ingredient.maximum_dosage}` : null,
        ingredient.paper_url ? `Source the reviewer will check against: ${ingredient.paper_url}` : null,
    ].filter(Boolean).join('\n');

    let res: Response;
    try {
        res = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: context },
                ],
            }),
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (err) {
        console.error('Ingredient summary request failed:', err);
        throw new HttpError(502, 'Could not reach the AI service. Try again in a moment.');
    }

    if (!res.ok) {
        const detail = await res.text().catch(() => '');
        console.error(`Ingredient summary API error ${res.status}:`, detail);
        if (res.status === 401) { throw new HttpError(502, 'OpenAI rejected the API key. Check OPENAI_API_KEY.'); }
        if (res.status === 404) { throw new HttpError(502, 'OpenAI does not recognise the model. Set OPENAI_MODEL to a model your account can use.'); }
        if (res.status === 429) { throw new HttpError(502, 'OpenAI is rate limiting requests, or the account has run out of credit. Check your OpenAI billing and try again.'); }
        throw new HttpError(502, 'The AI service returned an error. Try again in a moment.');
    }

    const data = await res.json() as { choices?: { message?: { content?: string | null } }[] };
    const summary = (data.choices?.[0]?.message?.content ?? '').trim();

    if (!summary) {
        throw new HttpError(502, 'The AI service returned an empty summary. Try again.');
    }
    if (summary === 'UNKNOWN') {
        throw new HttpError(422, `The AI didn't recognise "${ingredient.name}". Check the name or write the summary by hand.`);
    }
    return summary;
}