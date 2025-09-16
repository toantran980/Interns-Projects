export function getApiBase(): string {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  // Prefer an explicit VITE_API_BASE during local dev; in production use the relative /api path.
  if (metaEnv?.VITE_API_BASE) return metaEnv.VITE_API_BASE.replace(/\/$/, '');
  if (process.env.NODE_ENV === 'production') return '';
  return 'http://localhost:4000';
}

export type DiagramPayload = { text: string; diagramType: string; instruction?: string };

export async function postDiagram(payload: DiagramPayload) {
  const base = getApiBase();
  const res = await fetch(`${base.replace(/\/$/, '')}/api/diagram`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
}
