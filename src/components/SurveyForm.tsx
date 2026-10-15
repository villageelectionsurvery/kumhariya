"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cleanName, hindiNumber, NAME_PATTERN, PARTIES, POSTS, SURVEY, type Post } from "@/lib/config";
import {
  apiConfigured,
  checkDeviceStatus,
  deviceId,
  locallySubmitted,
  markSubmitted,
  newSubmissionId,
  submitSurvey,
  type Answer,
} from "@/lib/api";

const LETTERS = ["क", "ख", "ग", "घ", "ङ", "च"];
const partyById = Object.fromEntries(PARTIES.map((p) => [p.id, p]));

type Stage = "loading" | "form" | "done" | "locked" | "not_started";

const validName = (s?: string) => NAME_PATTERN.test(cleanName(s ?? ""));

function postError(post: Post, answer?: Answer): string {
  if (post.type === "name") {
    return validName(answer?.candidate) ? "" : `${post.label} पद के उम्मीदवार का सही नाम लिखें (2–60 अक्षर)।`;
  }
  if (!answer?.party) return `${post.label} पद के लिए अपनी पसंद चुनें।`;
  if (partyById[answer.party]?.independent && !validName(answer.candidate)) {
    return `${post.label} पद के निर्दलीय उम्मीदवार का सही नाम लिखें (2–60 अक्षर)।`;
  }
  return "";
}

function answerText(post: Post, answer?: Answer): string | null {
  if (post.type === "name") return cleanName(answer?.candidate ?? "") || null;
  if (!answer?.party) return null;
  const party = partyById[answer.party];
  if (party.independent) return `${party.label} — ${cleanName(answer.candidate ?? "") || "नाम लिखें"}`;
  return party.label;
}

export default function SurveyForm() {
  const [stage, setStage] = useState<Stage>("loading");
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  // One ID per filled-in form, so a retried request is saved only once.
  const submissionId = useRef("");
  const cardRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const nameRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const doneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    submissionId.current = newSubmissionId();
    if (locallySubmitted()) {
      setStage("locked");
      return;
    }
    if (!apiConfigured()) {
      setStage("not_started"); // no place to save answers yet, so don't offer the form
      return;
    }
    setStage("form");
    checkDeviceStatus(deviceId())
      .then((submitted) => {
        if (submitted) {
          markSubmitted();
          setStage("locked");
        }
      })
      .catch(() => {
        /* offline or server busy: the check is repeated when they submit */
      });
  }, []);

  const completed = useMemo(() => POSTS.filter((p) => !postError(p, answers[p.id])).length, [answers]);

  function setAnswer(postId: string, next: Answer) {
    setAnswers((a) => ({ ...a, [postId]: next }));
    if (errors[postId]) {
      const post = POSTS.find((p) => p.id === postId)!;
      setErrors((e) => ({ ...e, [postId]: postError(post, next) }));
    }
  }

  function choose(postId: string, partyId: string) {
    setAnswer(postId, { party: partyId, candidate: answers[postId]?.candidate });
    if (partyById[partyId].independent) setTimeout(() => nameRefs.current[postId]?.focus());
  }

  function review(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    const found: Record<string, string> = {};
    for (const p of POSTS) {
      const msg = postError(p, answers[p.id]);
      if (msg) found[p.id] = msg;
    }
    setErrors(found);
    const first = POSTS.find((p) => found[p.id]);
    if (first) {
      cardRefs.current[first.id]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setConfirming(true);
  }

  async function submit() {
    setSending(true);
    try {
      const selections = Object.fromEntries(
        POSTS.map((p) => {
          const a = answers[p.id];
          if (p.type === "name") return [p.id, { party: "", candidate: cleanName(a.candidate ?? "") }];
          return [p.id, partyById[a.party].independent ? { party: a.party, candidate: cleanName(a.candidate ?? "") } : { party: a.party }];
        }),
      );
      const result = await submitSurvey({ submission_id: submissionId.current, device_id: deviceId(), selections });
      setConfirming(false);
      if (result.ok) {
        markSubmitted();
        setStage("done");
        setTimeout(() => doneRef.current?.focus());
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result.code === "device_used") {
        markSubmitted();
        setStage("locked");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (result.errors) setErrors(result.errors);
      setFormError(result.message);
    } catch {
      setConfirming(false);
      setFormError("कुछ गड़बड़ हुई। कृपया इंटरनेट जाँचकर दोबारा प्रयास करें।");
    } finally {
      setSending(false);
    }
  }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const resultsHref = `${basePath}/survey-result/`;

  return (
    <>
      <section className="hero mb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${basePath}/hero.jpg`} alt="ग्राम पंचायत कुम्हारिया का ग्रामीण दृश्य" className="hero-img" />
        <div className="hero-content">
          <h1>{SURVEY.title}</h1>
          <p>गाँव के चुनाव को लेकर आपकी पसंद क्या है? अपना मत सर्वेक्षण में दर्ज करें।</p>
        </div>
      </section>

      {stage === "loading" && (
        <div className="text-center text-muted py-5" role="status">
          <span className="spinner-border spinner-inline me-2" /> लोड हो रहा है...
        </div>
      )}

      {stage === "not_started" && (
        <div className="civic-card locked-panel text-center p-4 p-md-5 mb-4" role="status">
          <span className="material-symbols-outlined locked-icon">schedule</span>
          <h2 className="h4 mt-2">सर्वेक्षण जल्द ही शुरू होगा।</h2>
          <p className="text-muted mb-0">कृपया थोड़ी देर बाद फिर से देखें। धन्यवाद!</p>
        </div>
      )}

      {stage === "done" && (
        <div ref={doneRef} tabIndex={-1} className="civic-card success-panel text-center p-4 p-md-5 mb-4" role="status">
          <span className="material-symbols-outlined success-icon">check_circle</span>
          <h2 className="h4 mt-2">आपकी सर्वे प्रतिक्रिया सफलतापूर्वक दर्ज हो गई है। धन्यवाद!</h2>
          <p className="text-muted mb-3">एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है; अब इसे बदला नहीं जा सकता।</p>
          <a href={resultsHref} className="btn btn-outline-civic">सर्वे परिणाम देखें</a>
        </div>
      )}

      {stage === "locked" && (
        <div className="civic-card locked-panel text-center p-4 p-md-5 mb-4" role="status">
          <span className="material-symbols-outlined locked-icon">verified</span>
          <h2 className="h4 mt-2">इस डिवाइस से आपकी सर्वे प्रतिक्रिया पहले ही दर्ज हो चुकी है।</h2>
          <p className="text-muted mb-3">
            एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है, और जमा करने के बाद उसे बदला नहीं जा सकता। धन्यवाद!
          </p>
          <a href={resultsHref} className="btn btn-outline-civic">सर्वे परिणाम देखें</a>
        </div>
      )}

      {stage === "form" && (
        <>
          <div className="civic-card notice-card d-flex align-items-start gap-3 p-3 mb-4">
            <span className="material-symbols-outlined text-secondary-civic">how_to_vote</span>
            <div className="flex-grow-1">
              <div className="fw-semibold">अपनी जनमत राय दर्ज करें</div>
              <div className="small text-muted">यह केवल एक जनमत सर्वेक्षण है, आधिकारिक मतदान नहीं।</div>
            </div>
            <span className="pill pill-neutral d-none d-md-inline-flex">
              <span className="material-symbols-outlined">lock</span> स्वतंत्र एवं निष्पक्ष सर्वेक्षण
            </span>
          </div>

          {formError && <div className="alert alert-danger" role="alert">{formError}</div>}

          <form onSubmit={review} noValidate>
            <div className="row g-4">
              <div className="col-lg-8">
                {POSTS.map((post, i) => {
                  const answer = answers[post.id];
                  const complete = !postError(post, answer);
                  const showName = answer && partyById[answer.party]?.independent;
                  return (
                    <fieldset
                      key={post.id}
                      ref={(el) => {
                        cardRefs.current[post.id] = el;
                      }}
                      className={`civic-card post-card p-3 p-md-4 mb-4 ${errors[post.id] ? "has-error" : ""} ${complete ? "is-complete" : ""}`}
                    >
                      <legend className="d-flex align-items-center justify-content-between gap-2 w-100 mb-3">
                        <span className="d-flex align-items-center gap-3">
                          <span className="num-badge">{hindiNumber(i + 1)}</span>
                          <span>
                            <span className="post-tag">{post.tag}</span>
                            <span className="post-title d-block">{post.title}</span>
                          </span>
                        </span>
                        <span className={`pill status-pill ${complete ? "pill-done" : "pill-pending"}`}>
                          <span className="material-symbols-outlined">{complete ? "check_circle" : "radio_button_unchecked"}</span>
                          {complete ? "पूर्ण" : "अपूर्ण"}
                        </span>
                      </legend>
                      <p className="question mb-3">
                        प्रश्न {i + 1}: {post.label} पद के लिए आपकी पसंद कौन है?
                        {post.type === "name" && " उम्मीदवार का नाम लिखें।"}
                      </p>
                      {post.type === "name" ? (
                        <div className="candidate-box">
                          <label className="form-label fw-semibold" htmlFor={`candidate_${post.id}`}>
                            उम्मीदवार का नाम लिखें
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            id={`candidate_${post.id}`}
                            maxLength={60}
                            autoComplete="off"
                            placeholder="उदा. रामलाल"
                            value={answer?.candidate ?? ""}
                            onChange={(e) => setAnswer(post.id, { party: "", candidate: e.target.value })}
                          />
                        </div>
                      ) : (
                        <div className="row g-3">
                          {PARTIES.map((party, j) => {
                            const inputId = `${post.id}_${party.id}`;
                            return (
                              <div className="col-md-4" key={party.id}>
                                <label className="choice-card" htmlFor={inputId}>
                                  <span className="d-flex justify-content-between align-items-start">
                                    <span className="letter-badge">{LETTERS[j]}</span>
                                    <input
                                      className="form-check-input choice-input"
                                      type="radio"
                                      id={inputId}
                                      name={`choice-${post.id}`}
                                      value={party.id}
                                      checked={answer?.party === party.id}
                                      onChange={() => choose(post.id, party.id)}
                                    />
                                  </span>
                                  <span className="choice-name">
                                    <span className="material-symbols-outlined">{party.icon}</span>
                                    {party.label}
                                  </span>
                                  <span className="choice-hint">{party.hint}</span>
                                </label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {post.type === "party" && showName && (
                        <div className="candidate-box mt-3">
                          <label className="form-label fw-semibold" htmlFor={`candidate_${post.id}`}>
                            निर्दलीय उम्मीदवार का नाम लिखें
                          </label>
                          <input
                            ref={(el) => {
                              nameRefs.current[post.id] = el;
                            }}
                            type="text"
                            className="form-control form-control-lg"
                            id={`candidate_${post.id}`}
                            maxLength={60}
                            autoComplete="off"
                            placeholder="उदा. रामलाल"
                            value={answer.candidate ?? ""}
                            onChange={(e) => setAnswer(post.id, { party: answer.party, candidate: e.target.value })}
                          />
                        </div>
                      )}
                      {errors[post.id] && <div className="text-danger small mt-2">{errors[post.id]}</div>}
                    </fieldset>
                  );
                })}

                <div className="civic-card privacy-card p-3 p-md-4 mb-4">
                  <div className="d-flex gap-2 align-items-start">
                    <span className="material-symbols-outlined">info</span>
                    <div>
                      <div className="fw-semibold mb-1">गोपनीयता सूचना</div>
                      <ul className="small mb-0 ps-3">
                        <li>हम केवल आपके द्वारा चुनी गई पसंद (पार्टी या उम्मीदवार का नाम) और जमा करने का समय दर्ज करते हैं।</li>
                        <li>आपका नाम, मोबाइल नंबर या पता नहीं माँगा जाता और न ही सहेजा जाता है।</li>
                        <li>प्रतिक्रियाएँ सर्वेक्षण आयोजक की Google Sheet में सहेजी जाती हैं और केवल कुल आँकड़ों के रूप में दिखाई जाती हैं।</li>
                        <li>
                          एक डिवाइस से केवल एक बार प्रतिक्रिया दी जा सकती है। इसके लिए आपके ब्राउज़र में एक रैंडम पहचान-कोड रखा जाता है,
                          जिससे आपकी व्यक्तिगत पहचान नहीं होती। जमा करने के बाद प्रतिक्रिया बदली नहीं जा सकती।
                        </li>
                        <li>यह व्यवस्था पूरी तरह यह सुनिश्चित नहीं कर सकती कि हर व्यक्ति केवल एक बार ही भाग ले (जैसे कोई दूसरा फ़ोन या ब्राउज़र इस्तेमाल करे)।</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-4">
                <aside className="civic-card summary-card p-3 p-md-4 sticky-lg-top">
                  <div className="d-flex gap-2 align-items-center mb-2">
                    <span className="material-symbols-outlined text-secondary-civic">assignment_turned_in</span>
                    <span className="fw-semibold">आपकी पसंद की समीक्षा</span>
                  </div>
                  <p className="small text-muted">जमा करने से पहले अपनी पसंद जाँच लें।</p>
                  <div className="progress-line mb-3">
                    <span style={{ width: `${(completed / POSTS.length) * 100}%` }} />
                  </div>
                  <div className="small mb-3">
                    प्रगति: <strong>{completed}</strong> / {POSTS.length} पद चयनित
                  </div>
                  <ul className="summary-list list-unstyled mb-3">
                    {POSTS.map((post) => {
                      const text = answerText(post, answers[post.id]);
                      return (
                        <li key={post.id}>
                          <span className="small text-muted d-block">{post.label}</span>
                          <span className={`summary-value ${text ? "chosen" : ""}`}>{text ?? "— चयन प्रतीक्षारत —"}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <button type="submit" className="btn btn-civic w-100">
                    <span className="material-symbols-outlined">fact_check</span> पसंद की पुष्टि करें और जमा करें
                  </button>
                </aside>
              </div>
            </div>
          </form>
        </>
      )}

      {confirming && (
        <>
          <div className="modal show" role="dialog" aria-modal="true" aria-labelledby="confirm-title" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 className="modal-title h5" id="confirm-title">अपनी पसंद की पुष्टि करें</h2>
                  <button type="button" className="btn-close" aria-label="बंद करें" onClick={() => setConfirming(false)} disabled={sending} />
                </div>
                <div className="modal-body">
                  <p className="small text-muted">कृपया जाँच लें। जमा करने के बाद प्रतिक्रिया बदली नहीं जा सकती।</p>
                  <ul className="list-unstyled confirm-list mb-0">
                    {POSTS.map((post) => (
                      <li key={post.id}>
                        <span className="text-muted small d-block">{post.label}</span>
                        <strong>{answerText(post, answers[post.id])}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="modal-footer d-grid gap-2">
                  <button type="button" className="btn btn-civic" onClick={submit} disabled={sending}>
                    {sending ? (
                      <>
                        <span className="spinner-border spinner-inline me-2" /> जमा हो रहा है...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">send</span> हाँ, सर्वे जमा करें
                      </>
                    )}
                  </button>
                  <button type="button" className="btn btn-outline-civic" onClick={() => setConfirming(false)} disabled={sending}>
                    वापस जाएँ और बदलें
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop show" />
        </>
      )}
    </>
  );
}
