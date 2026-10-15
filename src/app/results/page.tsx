import type { Metadata } from "next";
import ResultsDashboard from "@/components/ResultsDashboard";
import { SURVEY } from "@/lib/config";

export const metadata: Metadata = { title: `सर्वे परिणाम — ${SURVEY.village}` };

export default function ResultsPage() {
  return <ResultsDashboard />;
}
