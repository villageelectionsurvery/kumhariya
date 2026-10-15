/*
 * Survey configuration. Edit this file to change posts, wards or parties.
 *
 * Keep `posts` and `parties` in step with CONFIG in apps-script/Code.gs, which
 * validates every answer the Google Sheet receives. A post's `label` is what is
 * saved in the sheet, so keep it unchanged once responses exist for it.
 */

/*
 * type "party": choose कांग्रेस / बीजेपी / निर्दलीय (निर्दलीय asks for a name).
 * type "name":  only the candidate's name is written; no party choice.
 */
export type Post = { id: string; label: string; title: string; tag: string; type: "party" | "name" };
export type Party = { id: string; label: string; hint: string; icon: string; color: string; independent?: boolean };

export const SURVEY = {
  title: "ग्राम कुम्हारिया चुनाव सर्वेक्षण",
  village: "ग्राम पंचायत कुम्हारिया",

  // Web app URL from the Google Apps Script deployment (see README, step 3).
  // Set it with the NEXT_PUBLIC_SURVEY_API_URL environment variable, or paste the URL in place of "".
  apiUrl:
    process.env.NEXT_PUBLIC_SURVEY_API_URL ||
    "https://script.google.com/macros/s/AKfycbz78u8GVMwRPFhfJfsIveVBJnQ7V4oytj6v9DTVUd8VJZkiukdmheegt7f27LXQSkrC/exec",

  // Help number shown in the header ("नागरिक सहायता"). Leave empty to hide it.
  helpline: "",
};

export const POSTS: Post[] = [
  { id: "panchayat_samiti", label: "पंचायत समिति सदस्य", title: "पंचायत समिति सदस्य (Panchayat Samiti Member)", tag: "पंचायत समिति", type: "party" },
  { id: "sarpanch", label: "सरपंच", title: "सरपंच (Sarpanch)", tag: "मुख्य पद", type: "party" },
  { id: "ward_1", label: "वार्ड पंच - वार्ड 1", title: "वार्ड पंच — वार्ड संख्या 1", tag: "वार्ड पंच", type: "name" },
  { id: "ward_2", label: "वार्ड पंच - वार्ड 2", title: "वार्ड पंच — वार्ड संख्या 2", tag: "वार्ड पंच", type: "name" },
  { id: "ward_3", label: "वार्ड पंच - वार्ड 3", title: "वार्ड पंच — वार्ड संख्या 3", tag: "वार्ड पंच", type: "name" },
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
