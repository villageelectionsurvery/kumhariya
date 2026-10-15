/*
 * Survey configuration. Edit this file to change posts, wards or parties.
 *
 * Keep `posts` and `parties` in step with firestore.rules, which validates
 * every answer Firebase receives. A post's `label` is what is saved with each
 * response, so keep it unchanged once responses exist for it.
 */

export type Post = { id: string; label: string; title: string; tag: string };
export type Party = { id: string; label: string; hint: string; icon: string; color: string; independent?: boolean };

export const SURVEY = {
  title: "ग्राम कुम्हारिया चुनाव सर्वेक्षण",
  village: "ग्राम पंचायत कुम्हारिया",

  // Help number shown in the header ("नागरिक सहायता"). Leave empty to hide it.
  helpline: "",
};

/*
 * Firebase web app config (Firebase console → Project settings → Your apps).
 * These values identify the project; they are not secret. Security comes from
 * firestore.rules. NEXT_PUBLIC_FIREBASE_CONFIG (JSON) overrides them.
 */
export const FIREBASE_CONFIG: Record<string, string> = process.env.NEXT_PUBLIC_FIREBASE_CONFIG
  ? JSON.parse(process.env.NEXT_PUBLIC_FIREBASE_CONFIG)
  : {
      apiKey: "",
      authDomain: "",
      projectId: "",
      storageBucket: "",
      messagingSenderId: "",
      appId: "",
    };

export const POSTS: Post[] = [
  { id: "sarpanch", label: "सरपंच", title: "सरपंच (Sarpanch)", tag: "मुख्य पद" },
  { id: "ward_1", label: "वार्ड पंच - वार्ड 1", title: "वार्ड पंच — वार्ड संख्या 1", tag: "वार्ड पंच" },
  { id: "ward_2", label: "वार्ड पंच - वार्ड 2", title: "वार्ड पंच — वार्ड संख्या 2", tag: "वार्ड पंच" },
  { id: "ward_3", label: "वार्ड पंच - वार्ड 3", title: "वार्ड पंच — वार्ड संख्या 3", tag: "वार्ड पंच" },
];

export const PARTIES: Party[] = [
  { id: "congress", label: "कांग्रेस", hint: "Congress", icon: "pan_tool", color: "#1E5AA8" },
  { id: "bjp", label: "बीजेपी", hint: "BJP", icon: "spa", color: "#D97706" },
  { id: "independent", label: "निर्दलीय", hint: "Independent", icon: "person_pin", color: "#2E7D32", independent: true },
];

export const NAME_PATTERN = /^[\p{L}\p{M}\s.'-]{2,60}$/u;

export const cleanName = (s: string) => s.trim().replace(/\s+/g, " ").normalize("NFC");

const HINDI_DIGITS = "०१२३४५६७८९";
export const hindiNumber = (n: number) => String(n).replace(/\d/g, (d) => HINDI_DIGITS[Number(d)]);
