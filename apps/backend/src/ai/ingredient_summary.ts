import { HttpError } from '../db/admin/util';
import type { IngredientSummaryRequest, IngredientSummaryResponse } from '@suppsense/shared-types';

// The key only ever lives on the server. Never put it in the desktop or mobile .env -
// VITE_ and EXPO_PUBLIC_ variables are baked into the bundle and readable by anyone.
const API_URL = 'https://api.openai.com/v1/chat/completions';
// override with OPENAI_MODEL in the backend environment if your account uses a different model
const DEFAULT_MODEL = 'gpt-4o-mini';
const TIMEOUT_MS = 30_000;
const SOURCE_CHECK_TIMEOUT_MS = 8_000;

/**
 * Sources the AI is allowed to suggest. Language models often invent plausible-looking links,
 * so a suggestion is only used if it is on one of these sites, actually loads, and mentions the ingredient.
 * Fact-sheet sites are used rather than journal databases, where a made-up ID can still load a real but unrelated paper.
 */
const TRUSTED_SOURCE_HOSTS = [
    'ods.od.nih.gov',        // NIH Office of Dietary Supplements fact sheets
    'nccih.nih.gov',         // NIH complementary and integrative health
    'www.nccih.nih.gov',
    'medlineplus.gov',
    'www.medlineplus.gov',
    'healthify.nz',          // Healthify He Puna Waiora (NZ)
    'www.healthify.nz',
    'www.foodstandards.gov.au', // FSANZ (food additives)
    'foodstandards.gov.au',
];

const EXERCISE_FACT_SHEET = 'https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/';

/**
 * Pages we know exist (the same ones the seed data uses). NIH sites often block automated requests from
 * servers with HTTP 403, so these are trusted without being fetched.
 */
const KNOWN_GOOD_SOURCES = new Set([
    EXERCISE_FACT_SHEET,
    ...['VitaminC', 'VitaminD', 'VitaminB6', 'VitaminB12', 'Folate', 'VitaminE', 'VitaminK', 'Zinc', 'Magnesium',
        'Iron', 'Calcium', 'Selenium', 'Iodine', 'Potassium', 'Omega3FattyAcids', 'Probiotics', 'Ashwagandha']
        .map((name) => `https://ods.od.nih.gov/factsheets/${name}-HealthProfessional/`),
    'https://www.nccih.nih.gov/health/green-tea',
    'https://www.nccih.nih.gov/health/turmeric',
    'https://www.nccih.nih.gov/health/melatonin-what-you-need-to-know',
]);

/** treat https://site/x and https://site/x/ as the same page */
const normaliseUrl = (url: string) => url.trim().replace(/\/+$/, '') + '/';
const KNOWN_GOOD_NORMALISED = new Set([...KNOWN_GOOD_SOURCES].map(normaliseUrl));

const SYSTEM_PROMPT = `You write ingredient summaries for SuppSense, a New Zealand app that explains what is in supplements.
Write in New Zealand English, in plain language for a general adult reader.

Reply with a JSON object with exactly three keys: "summary", "source_urls" and "used_for_exercise".

"summary": 2 to 4 sentences (about 60 to 110 words) covering
- what the ingredient is and why it is used in supplements
- how strong the evidence is, stated honestly (say when evidence is limited or mixed)
- the most relevant safety note or who should be careful
Plain text only, no markdown. Do not state dosage numbers (the app shows doses separately).
Do not make treatment or cure claims, and do not invent studies, statistics or brand names.

"source_urls": an array of up to 3 URLs of reputable fact sheets about this ingredient, best first, from these sites only:
${TRUSTED_SOURCE_HOSTS.filter((h) => !h.startsWith('www.')).join(', ')}.
Prefer the main fact sheet page for the ingredient (for example an ods.od.nih.gov "-HealthProfessional" fact sheet,
a medlineplus.gov druginfo/natural page, or a healthify.nz page). If the ingredient is mainly used for exercise,
https://ods.od.nih.gov/factsheets/ExerciseAndAthleticPerformance-HealthProfessional/ is a good fallback.
Only give URLs you are confident exist. Use an empty array if you are not sure. Never guess or construct a URL.

"used_for_exercise": true if the ingredient is mainly taken for exercise, sport or muscle (for example protein powders,
creatine, caffeine, beta-alanine, amino acids, electrolytes), otherwise false.

If the name is not a real ingredient, or you are unsure what it is, reply with {"summary": "UNKNOWN", "source_urls": [], "used_for_exercise": false}.`;

// words that appear in lots of ingredient names but don't identify the ingredient
const GENERIC_WORDS = new Set(['extract', 'root', 'powder', 'isolate', 'concentrate', 'anhydrous', 'blend', 'sulfate', 'acid', 'the', 'and', 'with']);

/**
 * Checks a suggested source: https, on a trusted site, loads successfully, and the page mentions the ingredient.
 * @returns the final URL (after redirects), or a reason it was rejected
 */
async function verifySource(url: unknown, ingredientName: string): Promise<{ url: string } | { rejected: string }> {
    if (typeof url !== 'string' || !url.trim()) { return { rejected: 'not a URL' }; }

    let parsed: URL;
    try { parsed = new URL(url.trim()); } catch { return { rejected: 'not a valid URL' }; }
    if (parsed.protocol !== 'https:') { return { rejected: 'not https' }; }
    if (!TRUSTED_SOURCE_HOSTS.includes(parsed.hostname)) { return { rejected: `${parsed.hostname} is not a trusted site` }; }
    if (KNOWN_GOOD_NORMALISED.has(normaliseUrl(parsed.toString()))) { return { url: parsed.toString() }; }

    try {
        // some government sites refuse requests that don't look like a browser
        const res = await fetch(parsed.toString(), {
            redirect: 'follow',
            signal: AbortSignal.timeout(SOURCE_CHECK_TIMEOUT_MS),
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
                'accept': 'text/html,application/xhtml+xml',
                'accept-language': 'en-NZ,en;q=0.9',
            },
        });
        if (res.status === 403 || res.status === 429) {
            // the site blocked the automated check, so we can't tell whether the page is real - don't risk it
            return { rejected: `site blocked the automated check (HTTP ${res.status}), and it is not a known page` };
        }
        if (!res.ok) { return { rejected: `returned HTTP ${res.status}` }; }

        const page = (await res.text()).toLowerCase();
        const keywords = ingredientName.toLowerCase()
            .replace(/\(.*?\)/g, ' ')
            .split(/[^a-z0-9]+/)
            .filter((w) => w.length > 2 && !GENERIC_WORDS.has(w));
        const mentioned = keywords.length === 0 || keywords.some((w) => page.includes(w));
        if (!mentioned) { return { rejected: `page does not mention ${keywords.join('/')}` }; }
        return { url: res.url || parsed.toString() };
    } catch (err) {
        return { rejected: `could not load (${(err as Error).name})` };
    }
}

/**
 * Tries each suggested URL in order and returns the first that checks out.
 */
async function firstVerifiedSource(candidates: unknown, ingredientName: string, usedForExercise: boolean): Promise<string | null> {
    const list = (Array.isArray(candidates) ? candidates : [candidates]).slice(0, 3);
    for (const candidate of list) {
        const result = await verifySource(candidate, ingredientName);
        if ('url' in result) {
            console.log(`Source for ${ingredientName}: ${result.url}`);
            return result.url;
        }
        console.warn(`Rejected source for ${ingredientName} (${String(candidate)}): ${result.rejected}`);
    }
    if (list.length === 0) { console.warn(`No source suggested for ${ingredientName}`); }
    if (usedForExercise) {
        console.log(`Source for ${ingredientName}: using the NIH exercise and athletic performance fact sheet`);
        return EXERCISE_FACT_SHEET;
    }
    return null;
}

/**
 * Asks OpenAI (ChatGPT) for a short ingredient summary and, if the ingredient has no source yet,
 * a fact-sheet link. Nothing is saved - the admin reviews both, saves, then marks the ingredient verified.
 * @throws HttpError 503 if no API key is configured, 502 if the API call fails, 422 if the model doesn't recognise the ingredient
 */
export async function generateIngredientSummary(ingredient: IngredientSummaryRequest): Promise<IngredientSummaryResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new HttpError(503, 'AI summaries are not set up. Add OPENAI_API_KEY to the backend environment and restart it.');
    }

    const hasSource = !!ingredient.paper_url?.trim();
    const context = [
        `Ingredient: ${ingredient.name}`,
        ingredient.recommended_dosage ? `Recommended dose shown in the app: ${ingredient.recommended_dosage}` : null,
        ingredient.maximum_dosage ? `Maximum dose shown in the app: ${ingredient.maximum_dosage}` : null,
        hasSource ? `This ingredient already has a source (${ingredient.paper_url}), so set "source_urls" to [].` : null,
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
                response_format: { type: 'json_object' },
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
    const raw = data.choices?.[0]?.message?.content ?? '';

    let parsed: { summary?: unknown; source_urls?: unknown; source_url?: unknown; used_for_exercise?: unknown };
    try {
        parsed = JSON.parse(raw);
    } catch {
        console.error('Ingredient summary was not valid JSON:', raw);
        throw new HttpError(502, 'The AI service returned an unexpected reply. Try again.');
    }

    const summary = typeof parsed.summary === 'string' ? parsed.summary.trim() : '';
    if (!summary) {
        throw new HttpError(502, 'The AI service returned an empty summary. Try again.');
    }
    if (summary === 'UNKNOWN') {
        throw new HttpError(422, `The AI didn't recognise "${ingredient.name}". Check the name or write the summary by hand.`);
    }

    // accept either key in case the model uses the singular form
    const source_url = hasSource ? null : await firstVerifiedSource(parsed.source_urls ?? parsed.source_url, ingredient.name, parsed.used_for_exercise === true);

    return { summary, source_url };
}