(async function () {

  if (document.getElementById("signalsafe-scan-overlay")) return;

  // overlay
  const overlay = document.createElement("div");
  overlay.id = "signalsafe-scan-overlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.background = "rgba(0,0,0,0.6)";
  overlay.style.zIndex = 999999;
  overlay.style.pointerEvents = "none";

  // scanning bar
  const bar = document.createElement("div");
  bar.style.position = "absolute";
  bar.style.left = "0";
  bar.style.width = "100%";
  bar.style.height = "4px";
  bar.style.background = "red";
  bar.style.boxShadow = "0 0 15px red";
  overlay.appendChild(bar);

  document.body.appendChild(overlay);

  let pos = 0;
  const interval = setInterval(() => {
    pos += 8;
    bar.style.top = pos + "px";
    if (pos > window.innerHeight) pos = 0;
  }, 16);

  const timeout = setTimeout(() => {
    clearInterval(interval);
    overlay.remove();
    alert("SignalSafe could not analyze this page.");
  }, 8000);

  function uniq(items) {
    return Array.from(new Set(items));
  }

  function getOpenedGmailEmail() {
    if (location.hostname !== "mail.google.com") {
      return { subject: "", body: "" };
    }

    const subject = (document.querySelector("h2.hP")?.innerText || "").trim();

    const bodyNode = document.querySelector("div.a3s.aiL") || document.querySelector("div.a3s");
    let body = (bodyNode?.innerText || "").trim();

    // Fallback: sometimes Gmail renders the opened email inside role=listitem.
    if (body.length < 80) {
      const listItems = document.querySelectorAll('[role="listitem"]');
      const last = listItems[listItems.length - 1];
      const maybeBody = (last?.innerText || "").trim();
      if (maybeBody.length > body.length) body = maybeBody;
    }

    return { subject, body };
  }

  function getVisibleInboxSubjects() {
    if (location.hostname !== "mail.google.com") {
      return [];
    }

    const subjectNodes = document.querySelectorAll(
      // Inbox list subjects
      "tr.zA span.bog, span.bog"
    );

    const subjects = [];
    for (const node of subjectNodes) {
      const text = (node.innerText || node.getAttribute("title") || "").trim();
      if (!text) continue;
      if (text.length < 5) continue;
      if (text.length > 160) continue;
      subjects.push(text);
      if (subjects.length >= 30) break;
    }

    return uniq(subjects);
  }

  function subjectReasons(subject) {
    const s = String(subject || "").toLowerCase();
    const reasons = [];

    if (/(urgent|immediate|act now|final notice|last chance|expires|today only|24\s*hours?|asap)/.test(s)) {
      reasons.push("urgency pressure");
    }
    if (/(verify|verification|confirm|validate|suspended|locked|unusual activity|security alert|password reset|sign\s*in)/.test(s)) {
      reasons.push("account/security bait");
    }
    if (/(invoice|receipt|payment|refund|chargeback|subscription|renewal|billing|overdue)/.test(s)) {
      reasons.push("billing/payment lure");
    }
    if (/(gift\s*card|wire|crypto|bitcoin|wallet|bank transfer|zelle|venmo|cashapp)/.test(s)) {
      reasons.push("high-risk payment method");
    }
    if (/(prize|won|winner|free|giveaway|reward|bonus)/.test(s)) {
      reasons.push("too-good-to-be-true offer");
    }

    return reasons;
  }

  const opened = getOpenedGmailEmail();
  const inboxSubjects = getVisibleInboxSubjects();
  const suspiciousSubjects = inboxSubjects
    .map((subj) => ({ subj, reasons: subjectReasons(subj) }))
    .filter((x) => x.reasons.length > 0)
    .slice(0, 10);

  // extract visible text (prefer opened email body on Gmail)
  const scanTarget =
    location.hostname === "mail.google.com" && opened.body
      ? "Opened email"
      : "This page";

  const scanTextRaw =
    location.hostname === "mail.google.com" && opened.body
      ? opened.body
      : document.body.innerText;

  const text = scanTextRaw.slice(0, 15000);

  const result = await new Promise(resolve => {
    chrome.runtime.sendMessage(
      { type: "SCAN_TEXT", text },
      response => {
        const lastError = chrome?.runtime?.lastError;
        if (lastError?.message) {
          resolve({ error: true, message: lastError.message });
          return;
        }

        resolve(response);
      }
    );
  });

  clearTimeout(timeout);

  clearInterval(interval);
  overlay.remove();

  if (!result || result.error) {
    const msg = result?.message ? `\n\n${result.message}` : "";
    alert(`SignalSafe could not analyze this page.${msg}`);
    return;
  }

  const flags = result.flags || result.redFlags || [];
  const actions = result.actions || result.recommendedActions || [];
  const summary = (result.summary || "").trim();

  const scannedWhatText =
    location.hostname === "mail.google.com" && opened.subject
      ? `\nScanned: ${scanTarget}\nSubject: ${opened.subject}`
      : `\nScanned: ${scanTarget}`;

  const suspiciousSubjectsText =
    location.hostname === "mail.google.com" && suspiciousSubjects.length
      ? `\n\nSuspicious inbox subject lines (heuristic):\n${
          suspiciousSubjects
            .map(x => `- "${x.subj}" (${x.reasons.join(", ")})`)
            .join("\n")
        }`
      : "";

  const flagsText = flags.length
    ? `\n\nWhy this looks risky:\n${flags.slice(0, 8).map(f => `- ${f}`).join("\n")}`
    : "";

  const summaryText = summary ? `\n\nSummary:\n${summary}` : "";
  const actionsText = actions.length
    ? `\n\nNext steps:\n${actions.slice(0, 6).map(a => `- ${a}`).join("\n")}`
    : "";

  alert(
    `SignalSafe Scan Complete:\n${result.verdict}\nRisk Score: ${result.riskScore}` +
      scannedWhatText +
      flagsText +
      suspiciousSubjectsText +
      summaryText +
      actionsText
  );

})();
