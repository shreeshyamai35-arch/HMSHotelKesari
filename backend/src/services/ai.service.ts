import { env } from '../config/env';

export interface InsightInput {
  occupancy: number;
  totalRevenue: number;
  avgAdr: number;
  avgRevpar: number;
  openComplaints: number;
  openMaintenance: number;
  avgRating: number;
  reportsToday: number;
}

export interface Insight {
  summary: string;
  highlights: string[];
  recommendations: string[];
  provider: string;
}

function mockInsights(input: InsightInput): Insight {
  const highlights: string[] = [];
  const recommendations: string[] = [];

  highlights.push(`Occupancy is at ${input.occupancy.toFixed(1)}% with RevPAR of ₹${input.avgRevpar.toFixed(0)}.`);
  highlights.push(`ADR averages ₹${input.avgAdr.toFixed(0)} across the selected period.`);
  highlights.push(`Guest sentiment sits at ${input.avgRating.toFixed(1)}/5 from tracked reviews.`);

  if (input.occupancy < 60) {
    recommendations.push('Occupancy is below target — consider promotional rates or OTA visibility boosts.');
  } else if (input.occupancy > 85) {
    recommendations.push('High occupancy — review ADR to capture additional revenue without losing demand.');
  }
  if (input.openComplaints > 0) {
    recommendations.push(`Resolve ${input.openComplaints} open complaint(s) to protect review scores.`);
  }
  if (input.openMaintenance > 0) {
    recommendations.push(`Close out ${input.openMaintenance} maintenance issue(s) to avoid guest impact.`);
  }
  if (input.avgRating < 4) {
    recommendations.push('Average rating is under 4.0 — audit recent feedback for recurring themes.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Operations are healthy. Maintain current standards and monitor daily checks.');
  }

  return {
    summary: `Today the property recorded ${input.reportsToday} operations report(s). Revenue totals ₹${input.totalRevenue.toFixed(
      0
    )} with ${input.occupancy.toFixed(1)}% occupancy and an average guest rating of ${input.avgRating.toFixed(1)}/5.`,
    highlights,
    recommendations,
    provider: 'mock',
  };
}

async function openAiInsights(input: InsightInput): Promise<Insight> {
  // Pluggable real provider. Falls back to mock if anything fails.
  try {
    const prompt = `You are a hotel operations analyst. Given these metrics, return a JSON object with keys summary (string), highlights (string[]), recommendations (string[]). Metrics: ${JSON.stringify(
      input
    )}`;
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.ai.apiKey}`,
      },
      body: JSON.stringify({
        model: env.ai.model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });
    if (!resp.ok) throw new Error(`AI provider error: ${resp.status}`);
    const data = (await resp.json()) as { choices: { message: { content: string } }[] };
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      summary: parsed.summary ?? '',
      highlights: parsed.highlights ?? [],
      recommendations: parsed.recommendations ?? [],
      provider: 'openai',
    };
  } catch (err) {
    console.error('[ai:fallback]', err);
    return mockInsights(input);
  }
}

export async function generateInsights(input: InsightInput): Promise<Insight> {
  if (env.ai.provider === 'openai' && env.ai.apiKey) {
    return openAiInsights(input);
  }
  return mockInsights(input);
}
