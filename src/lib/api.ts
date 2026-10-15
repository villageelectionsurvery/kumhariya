import { SURVEY } from "./config";

export type Answer = { party: string; candidate?: string };

export type SubmitResult =
  | { ok: true }
  | { ok: false; code?: "device_used"; message: string; errors?: Record<string, string> };

/** Survey data in the leads.json format. */
export type LeadsJson = {
  survey: string;
  responses: {
    response_id: string;
    submitted_at: string;
    selections: Record<string, { party: string; candidate_name: string | null }>;
  }[];
};

export const apiConfigured = () => SURVEY.apiUrl.trim() !== "";

const DEVICE_KEY = "kum_device";
const SUBMITTED_KEY = "kum_submitted";

const randomHex = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => b.toString(16).padStart(2, "0")).join("");

/*
 * One response per device: a random ID kept in this browser's storage. Clearing
 * browser data or using another browser or phone gets around it, so it limits
 * casual repeats but cannot guarantee one response per person.
 */
export function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[a-f0-9]{32}$/.test(id)) {
      id = randomHex();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return randomHex(); // storage blocked: the server-side check still applies per request
  }
}

export function markSubmitted() {
  try {
    localStorage.setItem(SUBMITTED_KEY, new Date().toISOString());
  } catch {
    /* storage blocked */
  }
}

export function locallySubmitted(): boolean {
  try {
    return Boolean(localStorage.getItem(SUBMITTED_KEY));
  } catch {
    return false;
  }
}

export const newSubmissionId = randomHex;

export async function checkDeviceStatus(id: string): Promise<boolean> {
  const res = await fetch(`${SURVEY.apiUrl}?action=status&device=${id}`);
  const data = await res.json();
  return Boolean(data.ok && data.submitted);
}

export async function submitSurvey(payload: {
  submission_id: string;
  device_id: string;
  selections: Record<string, Answer>;
}): Promise<SubmitResult> {
  // text/plain keeps this a "simple" request, which Apps Script accepts cross-origin.
  const res = await fetch(SURVEY.apiUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "submit", ...payload }),
  });
  return res.json();
}

export async function fetchLeads(): Promise<LeadsJson> {
  const res = await fetch(`${SURVEY.apiUrl}?action=leads`, { cache: "no-store" });
  const data = await res.json();
  if (!Array.isArray(data.responses)) throw new Error(data.message || "leads_failed");
  return data;
}
