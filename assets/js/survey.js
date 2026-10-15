// Survey page: independent-name boxes, progress summary, validation,
// confirmation dialog and submission.
(() => {
  const form = document.getElementById("survey-form");
  if (!form) return;

  const cards = [...form.querySelectorAll(".post-card")];
  const NAME_RE = /^[\p{L}\p{M}\s.'-]{2,60}$/u;
  const modal = new bootstrap.Modal(document.getElementById("confirm-modal"));
  const confirmBtn = document.getElementById("confirm-submit");
  const formError = document.getElementById("form-error");

  const chosen = (card) => card.querySelector(".choice-input:checked");
  const nameInput = (card) => card.querySelector(".candidate-box input");
  const cleanName = (s) => s.trim().replace(/\s+/g, " ");

  function cardError(card) {
    const input = chosen(card);
    const label = card.dataset.label;
    if (!input) return `${label} पद के लिए अपनी पसंद चुनें।`;
    if (input.dataset.independent && !NAME_RE.test(cleanName(nameInput(card).value))) {
      return `${label} पद के निर्दलीय उम्मीदवार का सही नाम लिखें (2–60 अक्षर)।`;
    }
    return "";
  }

  function showCardError(card, msg) {
    const el = card.querySelector(".invalid-msg");
    el.textContent = msg;
    el.classList.toggle("d-none", !msg);
    card.classList.toggle("has-error", Boolean(msg));
  }

  function selectionText(card) {
    const input = chosen(card);
    if (!input) return null;
    if (input.dataset.independent) {
      const name = cleanName(nameInput(card).value);
      return `${input.dataset.partyLabel} — ${name || "नाम लिखें"}`;
    }
    return input.dataset.partyLabel;
  }

  function refresh() {
    let done = 0;
    for (const card of cards) {
      const input = chosen(card);
      card.querySelector(".candidate-box").classList.toggle("d-none", !input?.dataset.independent);
      const complete = !cardError(card);
      if (complete) done++;
      card.classList.toggle("is-complete", complete);
      const pill = card.querySelector(".status-pill");
      pill.className = `pill status-pill ${complete ? "pill-done" : "pill-pending"}`;
      pill.querySelector(".material-symbols-outlined").textContent = complete ? "check_circle" : "radio_button_unchecked";
      pill.querySelector(".status-text").textContent = complete ? "पूर्ण" : "अपूर्ण";

      const li = document.querySelector(`[data-summary="${card.dataset.post}"] .summary-value`);
      const text = selectionText(card);
      li.textContent = text ?? "— चयन प्रतीक्षारत —";
      li.classList.toggle("chosen", Boolean(text));
    }
    document.getElementById("progress-count").textContent = done;
    document.getElementById("progress-bar").style.width = `${(done / cards.length) * 100}%`;
  }

  form.addEventListener("change", (e) => {
    const card = e.target.closest(".post-card");
    if (card && card.classList.contains("has-error")) showCardError(card, cardError(card));
    if (e.target.dataset.independent && e.target.checked) nameInput(card).focus();
    refresh();
  });
  form.addEventListener("input", refresh);

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    formError.classList.add("d-none");
    let first = null;
    for (const card of cards) {
      const msg = cardError(card);
      showCardError(card, msg);
      if (msg && !first) first = card;
    }
    if (first) {
      first.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const list = document.getElementById("confirm-list");
    list.replaceChildren(
      ...cards.map((card) => {
        const li = document.createElement("li");
        const post = document.createElement("span");
        post.className = "text-muted small d-block";
        post.textContent = card.dataset.label;
        const val = document.createElement("strong");
        val.textContent = selectionText(card);
        li.append(post, val);
        return li;
      }),
    );
    modal.show();
  });

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.disabled = true; // stops double clicks while the request runs
    const original = confirmBtn.innerHTML;
    confirmBtn.textContent = "जमा हो रहा है...";
    try {
      const res = await fetch(form.action, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new FormData(form),
      });
      const data = await res.json();
      if (data.ok || data.code === "device_used") {
        modal.hide();
        if (!data.ok) {
          showLocked();
          return;
        }
        document.getElementById("survey-area").classList.add("d-none");
        const panel = document.getElementById("success-panel");
        panel.classList.remove("d-none");
        panel.focus();
        window.scrollTo({ top: panel.offsetTop - 120, behavior: "smooth" });
        return;
      }
      if (data.form_token) form.elements.form_token.value = data.form_token;
      for (const [pid, msg] of Object.entries(data.errors ?? {})) {
        const card = cards.find((c) => c.dataset.post === pid);
        if (card) showCardError(card, msg);
      }
      showFormError(data.message);
    } catch {
      // network failure or a non-JSON response
      showFormError("कुछ गड़बड़ हुई। कृपया इंटरनेट जाँचकर दोबारा प्रयास करें।");
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.innerHTML = original;
    }
  });

  function showFormError(msg) {
    modal.hide();
    formError.textContent = msg;
    formError.classList.remove("d-none");
    formError.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function showLocked() {
    document.getElementById("survey-area").classList.add("d-none");
    document.getElementById("locked-panel").classList.remove("d-none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  refresh();
})();
