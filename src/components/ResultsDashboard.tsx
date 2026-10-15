"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArcElement, BarController, BarElement, CategoryScale, Chart, DoughnutController, Legend, LinearScale, Tooltip } from "chart.js";
import { cleanName, hindiNumber, PARTIES, POSTS, SURVEY, type Post } from "@/lib/config";
import { apiConfigured, fetchLeads, type LeadsJson } from "@/lib/api";

Chart.register(DoughnutController, ArcElement, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);
Chart.defaults.font.family = "'Noto Sans Devanagari', 'Noto Sans', sans-serif";
Chart.defaults.color = "#45464d";

const INDEPENDENT_SHADES = ["#2E7D32", "#43A047", "#66BB6A", "#1B5E20", "#81C784", "#388E3C"];
// for name-only posts (ward panch): one colour per candidate
const CANDIDATE_COLORS = ["#1E5AA8", "#D97706", "#2E7D32", "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#B45309"];
const OTHERS_COLOR = "#94A3B8";

/** (responses for an option ÷ valid responses for that post) × 100, 2 decimals; 0 when nobody answered. */
const percent = (count: number, total: number) => (total > 0 ? Math.round((count * 10000) / total) / 100 : 0);
const fmt = (p: number) => `${p.toFixed(2)}%`;

type PostStats = {
  id: string;
  label: string;
  title: string;
  type: Post["type"];
  total: number;
  parties: { label: string; color: string; independent: boolean; count: number; percent: number }[];
  candidates: { name: string; count: number; percent: number }[];
};

/** Counts every post from the leads.json responses. Independent candidates are
    grouped by name (case and extra spaces ignored). */
function buildStats(leads: LeadsJson | null): PostStats[] {
  const responses = leads?.responses ?? [];
  return POSTS.map((post) => {
    const partyCounts = new Map(PARTIES.map((p) => [p.label, 0]));
    const independent = PARTIES.find((p) => p.independent);
    const candidates = new Map<string, { name: string; count: number }>();
    let total = 0;
    const addCandidate = (raw: string) => {
      const name = cleanName(raw);
      const key = name.toLowerCase();
      const c = candidates.get(key) ?? { name, count: 0 };
      c.count++;
      candidates.set(key, c);
    };
    for (const r of responses) {
      const sel = r.selections?.[post.label];
      if (post.type === "name") {
        // ward panch: only the written name counts
        if (sel?.candidate_name) {
          total++;
          addCandidate(sel.candidate_name);
        }
        continue;
      }
      if (!sel || !sel.party || !partyCounts.has(sel.party)) continue;
      total++;
      partyCounts.set(sel.party, partyCounts.get(sel.party)! + 1);
      if (sel.party === independent?.label && sel.candidate_name) addCandidate(sel.candidate_name);
    }
    return {
      ...post,
      total,
      parties: post.type === "name" ? [] : PARTIES.map((p) => {
        const count = partyCounts.get(p.label)!;
        return { label: p.label, color: p.color, independent: Boolean(p.independent), count, percent: percent(count, total) };
      }),
      candidates: [...candidates.values()]
        .map((c) => ({ ...c, percent: percent(c.count, total) }))
        .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    };
  });
}

function downloadLeads(leads: LeadsJson) {
  const blob = new Blob([JSON.stringify(leads, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leads.json";
  a.click();
  URL.revokeObjectURL(url);
}

function PostCharts({ post }: { post: PostStats }) {
  const doughnutRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const empty = post.total === 0;
    const tip = (count: number) => `${count} (${fmt(percent(count, post.total))})`;
    // Party posts: one slice per party. Name-only posts: top 7 names, the rest as "अन्य".
    let slices: { label: string; count: number; color: string }[];
    if (post.type === "name") {
      const top = post.candidates.slice(0, 7).map((c, i) => ({ label: c.name, count: c.count, color: CANDIDATE_COLORS[i] }));
      const rest = post.candidates.slice(7).reduce((n, c) => n + c.count, 0);
      slices = rest ? [...top, { label: "अन्य", count: rest, color: OTHERS_COLOR }] : top;
      if (!slices.length) slices = [{ label: "कोई नाम नहीं", count: 0, color: "#E2E8F0" }];
    } else {
      slices = post.parties.map((p) => ({ label: p.label, count: p.count, color: p.color }));
    }
    const doughnut = new Chart(doughnutRef.current!, {
      type: "doughnut",
      data: {
        labels: slices.map((p) => p.label),
        datasets: [{
          // an empty post still draws a grey ring
          data: empty ? slices.map(() => 1) : slices.map((p) => p.count),
          backgroundColor: empty ? slices.map(() => "#E2E8F0") : slices.map((p) => p.color),
          borderColor: "#fff",
          borderWidth: 2,
        }],
      },
      options: {
        maintainAspectRatio: false,
        cutout: "62%",
        plugins: {
          legend: { position: "bottom" },
          tooltip: { enabled: !empty, callbacks: { label: (ctx) => `${ctx.label}: ${tip(ctx.raw as number)}` } },
        },
      },
    });

    const rows =
      post.type === "name"
        ? post.candidates.map((c, i) => ({ label: c.name, count: c.count, color: i < 7 ? CANDIDATE_COLORS[i] : OTHERS_COLOR }))
        : [
            ...post.parties.filter((p) => !p.independent).map((p) => ({ label: p.label, count: p.count, color: p.color })),
            ...post.candidates.map((c, i) => ({ label: `${c.name} (निर्दलीय)`, count: c.count, color: INDEPENDENT_SHADES[i % INDEPENDENT_SHADES.length] })),
          ];
    const bar = new Chart(barRef.current!, {
      type: "bar",
      data: {
        labels: rows.map((r) => r.label),
        datasets: [{ data: rows.map((r) => r.count), backgroundColor: rows.map((r) => r.color), borderRadius: 4, maxBarThickness: 28 }],
      },
      options: {
        indexAxis: "y",
        maintainAspectRatio: false,
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: "#E2E8F0" }, title: { display: true, text: "प्रतिक्रियाएँ" } },
          y: { grid: { display: false } },
        },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => tip(ctx.raw as number) } } },
      },
    });
    return () => {
      doughnut.destroy();
      bar.destroy();
    };
  }, [post]);

  return (
    <div className="row g-4 align-items-start">
      <div className="col-lg-4">
        <h3 className="chart-title">{post.type === "name" ? "उम्मीदवार अनुसार पसंद" : "पार्टी अनुसार पसंद"}</h3>
        <div className="chart-box chart-doughnut">
          <canvas ref={doughnutRef} role="img" aria-label={`${post.label} — पार्टी अनुसार पसंद`} />
        </div>
      </div>
      <div className="col-lg-8">
        <h3 className="chart-title">{post.type === "name" ? "उम्मीदवार तुलना" : "उम्मीदवार/पार्टी तुलना"}</h3>
        <div className="chart-box" style={{ height: Math.max(220, 56 * ((post.type === "name" ? 0 : 2) + post.candidates.length)) }}>
          <canvas ref={barRef} role="img" aria-label={`${post.label} — उम्मीदवार तुलना`} />
        </div>
      </div>
    </div>
  );
}

export default function ResultsDashboard() {
  const [data, setData] = useState<LeadsJson | null>(null);
  const [loadedAt, setLoadedAt] = useState<Date | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error" | "unconfigured">("loading");

  useEffect(() => {
    if (!apiConfigured()) {
      setState("unconfigured");
      return;
    }
    fetchLeads()
      .then((d) => {
        setData(d);
        setLoadedAt(new Date());
        setState("ready");
      })
      .catch(() => setState("error"));
  }, []);

  const stats = useMemo(() => buildStats(data), [data]);
  const total = data?.responses.length ?? 0;
  const updated = loadedAt ? loadedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "short", timeStyle: "short" }) : null;

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-2 mb-3">
        <div>
          <h1 className="page-title mb-1">सर्वे परिणाम एवं विश्लेषण</h1>
          <p className="text-muted mb-0">{SURVEY.title}</p>
        </div>
        {updated && data && (
          <div className="d-flex flex-column flex-md-row align-items-md-center gap-2">
            <span className="pill pill-neutral">
              <span className="material-symbols-outlined">schedule</span> अद्यतन: {updated}
            </span>
            <button type="button" className="btn btn-outline-civic btn-sm download-btn" onClick={() => downloadLeads(data)}>
              <span className="material-symbols-outlined">download</span> leads.json डाउनलोड करें
            </button>
          </div>
        )}
      </div>

      <div className="alert disclaimer d-flex gap-2 align-items-start mb-4" role="note">
        <span className="material-symbols-outlined">info</span>
        <div>
          ये आँकड़े केवल सर्वेक्षण में प्राप्त प्रतिक्रियाओं पर आधारित हैं और आधिकारिक चुनाव परिणाम नहीं हैं। एक व्यक्ति द्वारा एक से अधिक बार भाग
          लेने को पूरी तरह रोका नहीं जा सकता।
        </div>
      </div>

      {state === "loading" && (
        <div className="text-center text-muted py-5" role="status">
          <span className="spinner-border spinner-inline me-2" /> परिणाम लोड हो रहे हैं...
        </div>
      )}
      {state === "error" && <div className="alert alert-danger">परिणाम लोड नहीं हो सके। कृपया इंटरनेट जाँचकर पेज रीफ़्रेश करें।</div>}
      {state === "unconfigured" && (
        <div className="civic-card text-center text-muted p-4">सर्वेक्षण अभी शुरू नहीं हुआ है, इसलिए परिणाम उपलब्ध नहीं हैं।</div>
      )}

      {state === "ready" && (
        <>
          <section className="row g-3 mb-4">
            <div className="col-6 col-lg-3">
              <div className="civic-card stat-card p-3 h-100">
                <div className="stat-label">कुल सर्वे प्रतिक्रियाएँ</div>
                <div className="stat-value">{total.toLocaleString("en-IN")}</div>
              </div>
            </div>
            {stats.map((post) => {
              const leadParty = post.parties.reduce<PostStats["parties"][number] | null>(
                (best, p) => (p.count > 0 && (!best || p.count > best.count) ? p : best),
                null,
              );
              const top = post.candidates[0];
              const lead =
                post.type === "name"
                  ? top && { label: top.name, color: CANDIDATE_COLORS[0], percent: top.percent }
                  : leadParty;
              return (
                <div className="col-6 col-lg-3" key={post.id}>
                  <a className="civic-card stat-card p-3 h-100 d-block text-decoration-none" href={`#post-${post.id}`}>
                    <div className="stat-label">{post.label} पद की पसंद</div>
                    {lead ? (
                      <>
                        <div className="stat-value" style={{ color: lead.color }}>{lead.label}</div>
                        <div className="small text-muted">{fmt(lead.percent)} • {post.total} प्रतिक्रियाएँ</div>
                      </>
                    ) : (
                      <>
                        <div className="stat-value text-muted">—</div>
                        <div className="small text-muted">अभी कोई प्रतिक्रिया नहीं</div>
                      </>
                    )}
                  </a>
                </div>
              );
            })}
          </section>

          {stats.map((post, i) => (
            <section className="civic-card p-3 p-md-4 mb-4 result-section" id={`post-${post.id}`} key={post.id}>
              <div className="d-flex align-items-center justify-content-between gap-2 mb-3">
                <div className="d-flex align-items-center gap-3">
                  <span className="num-badge">{hindiNumber(i + 1)}</span>
                  <h2 className="post-title mb-0">{post.title}</h2>
                </div>
                <span className="pill pill-neutral">कुल: {post.total}</span>
              </div>

              {post.type === "party" && (
                <div className="row g-3 mb-3">
                  {post.parties.map((p) => (
                    <div className="col-md-4" key={p.label}>
                      <div className="party-tile p-3 h-100" style={{ "--party": p.color } as React.CSSProperties}>
                        <div className="d-flex justify-content-between align-items-baseline">
                          <span className="fw-semibold">{p.label}</span>
                          <span className="party-pct">{fmt(p.percent)}</span>
                        </div>
                        <div className="progress-line my-2"><span style={{ width: `${p.percent}%` }} /></div>
                        <div className="small text-muted">{p.count} प्रतिक्रियाएँ</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <PostCharts post={post} />

              <h3 className="chart-title mt-4">{post.type === "name" ? "उम्मीदवार" : "निर्दलीय उम्मीदवार"}</h3>
              {post.candidates.length ? (
                <div className="table-responsive">
                  <table className="table table-sm align-middle mb-0">
                    <thead>
                      <tr><th>उम्मीदवार का नाम</th><th className="text-end">प्रतिक्रियाएँ</th><th className="text-end">प्रतिशत</th></tr>
                    </thead>
                    <tbody>
                      {post.candidates.map((c) => (
                        <tr key={c.name}><td>{c.name}</td><td className="text-end">{c.count}</td><td className="text-end">{fmt(c.percent)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="small text-muted mb-0">
                  इस पद के लिए अभी किसी {post.type === "name" ? "" : "निर्दलीय "}उम्मीदवार का नाम नहीं आया है।
                </p>
              )}
            </section>
          ))}

          <p className="small text-muted">प्रतिशत = (उस विकल्प की प्रतिक्रियाएँ ÷ उस पद की कुल मान्य प्रतिक्रियाएँ) × 100, दो दशमलव तक।</p>
        </>
      )}
    </>
  );
}
