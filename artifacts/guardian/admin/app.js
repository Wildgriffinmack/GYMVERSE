// GUARDIAN moderator dashboard. Plain JS, no dependencies.
// Security: user content is only ever inserted with textContent, never innerHTML.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const state = { token: sessionStorage.getItem("guardian.token") || "", view: "queue", status: "pending", type: "", sev: "" };
  const TYPE_LABEL = { post: "Post", comment: "Comment", profile_username: "Username", profile_bio: "Bio", direct_message: "DM", image: "Image", video: "Video", user_report: "Report" };

  function el(tag, attrs, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === undefined || v === null || v === false) continue;
      if (k === "class") node.className = v;
      else if (k === "text") node.textContent = v;
      else if (k === "width") node.style.width = v; // CSSOM is allowed by the CSP; inline style attributes are not
      else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
      else node.setAttribute(k, v === true ? "" : String(v));
    }
    for (const c of children.flat()) if (c !== null && c !== undefined && c !== false) node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return node;
  }

  const human = (id) => id.replace(/_/g, " ");
  const when = (iso) => new Date(iso).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  let toastTimer;
  function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (t.hidden = true), 2600);
  }

  async function api(path, options = {}) {
    const res = await fetch(path, { ...options, headers: { ...(options.body ? { "content-type": "application/json" } : {}), authorization: `Bearer ${state.token}` } });
    if (res.status === 401) {
      signOut("Token rejected. Sign in again.");
      throw new Error("unauthorized");
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  }

  function signOut(message) {
    sessionStorage.removeItem("guardian.token");
    state.token = "";
    $("app").hidden = true;
    $("login").hidden = false;
    $("login-error").textContent = message || "";
  }

  async function loadQueue() {
    const q = new URLSearchParams({ status: state.status });
    if (state.type) q.set("content_type", state.type);
    if (state.sev) q.set("severity", state.sev);
    const data = await api(`/v1/review/queue?${q}`);
    $("count-pending").textContent = data.counts.pending;
    $("who").replaceChildren("Signed in as ", el("b", { text: data.role === "trust_safety" ? "Trust & Safety" : "Moderator" }));
    state.role = data.role;
    const list = $("queue");
    list.replaceChildren(...(data.items.length ? data.items.map(card) : [el("div", { class: "empty", text: state.status === "pending" ? "Queue is clear. Nothing waiting for review." : "No items match these filters." })]));
  }

  function card(item) {
    const content = item.text !== null
      ? el("p", { class: "content", text: item.text })
      : el("p", { class: "content private", text: item.content_note || "No text content." });
    const note = el("input", { class: "note", placeholder: "Note (optional)", maxlength: 500, "aria-label": "Moderator note" });
    const act = (action) => async () => {
      try {
        await api(`/v1/review/items/${encodeURIComponent(item.id)}/actions`, { method: "POST", body: JSON.stringify({ action, note: note.value || undefined }) });
        toast(`${action === "request_edit" ? "Edit requested" : action === "approve" ? "Approved" : "Rejected"} · ${TYPE_LABEL[item.content_type] || item.content_type}`);
        await loadQueue();
      } catch (e) {
        toast(e.message);
      }
    };
    const reveal = async () => {
      try {
        const r = await api(`/v1/review/items/${encodeURIComponent(item.id)}/reveal`, { method: "POST", body: JSON.stringify({ note: note.value || undefined }) });
        content.className = "content";
        content.textContent = r.text ?? "Content was purged.";
        toast("Private message revealed. This was logged.");
      } catch (e) {
        toast(e.message);
      }
    };

    const pending = item.status === "pending";
    return el(
      "article",
      { class: "card", "data-sev": item.severity },
      el(
        "div",
        {},
        el(
          "div",
          { class: "meta" },
          el("span", { class: "badge type", text: TYPE_LABEL[item.content_type] || item.content_type }),
          el("span", { class: `badge sev-${item.severity}`, text: item.severity }),
          item.categories.map((c) => el("span", { class: "pill", text: human(c) })),
          item.labels.map((c) => el("span", { class: "pill label", text: human(c) })),
          el("span", { class: "time", text: `${when(item.created_at)} · @${item.author_id || "unknown"} · ${item.source.replace(/_/g, " ")}` }),
        ),
        content,
        el("div", { class: "reason", text: item.reason }),
        item.findings.length
          ? el("ul", { class: "findings" }, item.findings.map((f) => el("li", {}, el("code", { text: f.rule_id }), ` · ${f.confidence} confidence${f.excerpt ? ` · “${f.excerpt}”` : ""}`)))
          : null,
      ),
      el(
        "div",
        { class: "side" },
        el("div", { class: "risk" }, el("div", { class: "risk-head" }, "Risk", el("b", { text: item.risk_score.toFixed(2) })), el("div", { class: "bar" }, el("span", { width: `${Math.round(item.risk_score * 100)}%` }))),
        pending ? note : el("div", { class: "status", text: item.status.replace(/_/g, " ") }),
        pending
          ? el(
              "div",
              { class: "actions" },
              el("button", { class: "act approve", onclick: act("approve"), text: "Approve" }),
              el("button", { class: "act edit", onclick: act("request_edit"), text: "Request edit" }),
              el("button", { class: "act reject", onclick: act("reject"), text: "Reject" }),
            )
          : null,
        item.private && item.text === null && pending && state.role === "trust_safety" ? el("button", { class: "act reveal", onclick: reveal, text: "Reveal (audited)" }) : null,
      ),
    );
  }

  async function loadHistory() {
    const q = new URLSearchParams({ limit: "200" });
    if (state.type) q.set("content_type", state.type);
    const data = await api(`/v1/review/history?${q}`);
    $("history").replaceChildren(
      ...data.entries.map((h) =>
        el("tr", {}, el("td", { text: when(h.at) }), el("td", { class: "action", text: h.action.replace(/_/g, " ") }), el("td", { text: h.actor }), el("td", { text: TYPE_LABEL[h.content_type] || h.content_type }), el("td", { text: h.categories.map(human).join(", ") || "—" }), el("td", { text: h.note || "" })),
      ),
    );
  }

  const refresh = () => (state.view === "queue" ? loadQueue() : loadHistory()).catch((e) => e.message !== "unauthorized" && toast(e.message));

  document.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      state.view = tab.dataset.view;
      document.querySelectorAll(".tab").forEach((t) => {
        t.classList.toggle("is-active", t === tab);
        t.setAttribute("aria-selected", String(t === tab));
      });
      $("queue-view").hidden = state.view !== "queue";
      $("history-view").hidden = state.view !== "history";
      $("f-status").disabled = state.view !== "queue";
      refresh();
    }),
  );
  document.querySelectorAll(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      state.sev = chip.dataset.sev;
      document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("is-active", c === chip));
      refresh();
    }),
  );
  $("f-status").addEventListener("change", (e) => ((state.status = e.target.value), refresh()));
  $("f-type").addEventListener("change", (e) => ((state.type = e.target.value), refresh()));
  $("refresh").addEventListener("click", refresh);
  $("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    state.token = $("token").value.trim();
    try {
      await api("/v1/review/queue?status=pending");
      sessionStorage.setItem("guardian.token", state.token);
      $("token").value = "";
      $("login").hidden = true;
      $("app").hidden = false;
      refresh();
    } catch (err) {
      if (err.message !== "unauthorized") $("login-error").textContent = err.message;
    }
  });

  if (state.token) {
    $("app").hidden = false;
    refresh();
  } else {
    $("login").hidden = false;
  }
})();
