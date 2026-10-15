import { initializeApp, getApps } from "firebase/app";
import {
  collection,
  connectFirestoreEmulator,
  doc,
  FieldPath,
  FirestoreError,
  getCountFromServer,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  type Firestore,
} from "firebase/firestore";
import { cleanName, FIREBASE_CONFIG, PARTIES, POSTS, SURVEY } from "./config";

export type Selection = { party: string; candidate_name: string | null };

export type SubmitResult = { ok: true } | { ok: false; code?: "device_used"; message: string };

/** Survey data in the leads.json format. */
export type LeadsJson = {
  survey: string;
  responses: { response_id: string; submitted_at: string; selections: Record<string, Selection> }[];
};

export type PostCounts = {
  label: string;
  total: number;
  parties: Record<string, number>;
  candidates: { name: string; count: number }[];
};

export type ResultsData = { total_responses: number; posts: PostCounts[] };

const RESPONSES = "responses";

export const backendConfigured = () => Boolean(FIREBASE_CONFIG.projectId && FIREBASE_CONFIG.apiKey);

let db: Firestore | null = null;
function firestore(): Firestore {
  if (!db) {
    const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
    db = getFirestore(app);
    // local testing only: NEXT_PUBLIC_FIRESTORE_EMULATOR=localhost:8080
    const emulator = process.env.NEXT_PUBLIC_FIRESTORE_EMULATOR;
    if (emulator) {
      const [host, port] = emulator.split(":");
      connectFirestoreEmulator(db, host, Number(port));
    }
  }
  return db;
}

const DEVICE_KEY = "kum_device";
const SUBMITTED_KEY = "kum_submitted";

const toHex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const randomHex = (n = 16) => toHex(crypto.getRandomValues(new Uint8Array(n)));

/*
 * One response per device: the browser keeps a random ID, and the response is
 * saved under a SHA-256 hash of it. firestore.rules only allow creating a
 * document that doesn't exist yet, so a second answer from the same device is
 * refused. Clearing browser data or using another browser or phone gets around
 * it; it limits casual repeats but cannot guarantee one response per person.
 */
function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id || !/^[a-f0-9]{32}$/.test(id)) {
      id = randomHex();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return randomHex();
  }
}

async function deviceDocId(): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(deviceId()));
  return toHex(new Uint8Array(digest));
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

export async function deviceHasSubmitted(): Promise<boolean> {
  return (await getDoc(doc(firestore(), RESPONSES, await deviceDocId()))).exists();
}

const ymd = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }).replace(/-/g, "");

/** Saves one response. `selections` is keyed by post label, as in leads.json. */
export async function submitSurvey(selections: Record<string, Selection>, alreadyTried: boolean): Promise<SubmitResult> {
  const ref = doc(firestore(), RESPONSES, await deviceDocId());
  try {
    await setDoc(ref, { response_id: `${ymd()}-${randomHex(8)}`, submitted_at: serverTimestamp(), selections });
    return { ok: true };
  } catch (err) {
    if (err instanceof FirestoreError && err.code === "permission-denied") {
      // The rules refuse a second write for the same device. If this browser's
      // own earlier attempt in this visit got through (e.g. the reply was lost),
      // count it as a success; otherwise the device had already answered.
      if ((await getDoc(ref)).exists()) {
        return alreadyTried ? { ok: true } : { ok: false, code: "device_used", message: "" };
      }
      return { ok: false, message: "प्रतिक्रिया स्वीकार नहीं हुई। कृपया पेज रीफ़्रेश करके दोबारा प्रयास करें।" };
    }
    throw err;
  }
}

/**
 * Totals per post using count queries (cheap: about one read per 1,000
 * responses). Only the निर्दलीय responses are downloaded, to group candidate names.
 */
export async function fetchResults(): Promise<ResultsData> {
  const col = collection(firestore(), RESPONSES);
  const independent = PARTIES.find((p) => p.independent);
  const partyPath = (label: string) => new FieldPath("selections", label, "party");

  const total = getCountFromServer(col).then((s) => s.data().count);
  const posts = Promise.all(
    POSTS.map(async (post) => {
      const counts = await Promise.all(
        PARTIES.map((p) => getCountFromServer(query(col, where(partyPath(post.label), "==", p.label))).then((s) => s.data().count)),
      );
      const parties = Object.fromEntries(PARTIES.map((p, i) => [p.label, counts[i]]));
      const candidates = new Map<string, { name: string; count: number }>();
      if (independent && parties[independent.label] > 0) {
        const snap = await getDocs(query(col, where(partyPath(post.label), "==", independent.label)));
        snap.forEach((d) => {
          const raw = d.get(new FieldPath("selections", post.label, "candidate_name"));
          if (typeof raw !== "string" || !raw.trim()) return;
          const name = cleanName(raw);
          const key = name.toLowerCase();
          const c = candidates.get(key) ?? { name, count: 0 };
          c.count++;
          candidates.set(key, c);
        });
      }
      return {
        label: post.label,
        total: counts.reduce((a, b) => a + b, 0),
        parties,
        candidates: [...candidates.values()],
      };
    }),
  );
  return { total_responses: await total, posts: await posts };
}

const istIso = (d: Date) => {
  const local = new Date(d.getTime() + 5.5 * 3600 * 1000).toISOString().slice(0, 19);
  return `${local}+05:30`;
};

/** Every response in the leads.json format, oldest first (for the download button). */
export async function fetchLeads(): Promise<LeadsJson> {
  const snap = await getDocs(collection(firestore(), RESPONSES));
  const responses = snap.docs
    .map((d) => {
      const data = d.data();
      const at = data.submitted_at instanceof Timestamp ? data.submitted_at.toDate() : new Date(0);
      return { at, row: { response_id: String(data.response_id), submitted_at: istIso(at), selections: data.selections as Record<string, Selection> } };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((r) => r.row);
  return { survey: SURVEY.title, responses };
}
