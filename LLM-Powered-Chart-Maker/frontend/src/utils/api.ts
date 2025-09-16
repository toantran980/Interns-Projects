export function getApiBase(): string {
  const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env;
  return metaEnv?.VITE_API_BASE || 'http://localhost:4000';
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
