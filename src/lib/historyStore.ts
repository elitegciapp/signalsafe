export type Incident = {
  id: string;
  date: string;
  message: string;
  verdict: string;
  score: number;
};

const KEY = "signalsafe_history";

export function saveIncident(incident: Incident) {
  const existing = getHistory();
  existing.unshift(incident);
  localStorage.setItem(KEY, JSON.stringify(existing.slice(0, 50)));
}

export function getHistory(): Incident[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearHistory() {
  localStorage.removeItem(KEY);
}
