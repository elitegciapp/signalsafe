let lastScannedHash = "";

const SAFE_KEY = "signalsafe_safe_fingerprints_v1";

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function fnv1a(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash = Math.imul(hash, 0x01000193);
  }
  // eslint-disable-next-line no-bitwise
  return (hash >>> 0).toString(16);
}

function getOpenedEmailMeta() {
  if (location.hostname !== "mail.google.com") return null;

  const subject = (document.querySelector("h2.hP")?.innerText || "").trim();

  const senderNode = document.querySelector("span.gD") || document.querySelector("span.go");
  const sender = (
    senderNode?.getAttribute?.("email") ||
    senderNode?.getAttribute?.("data-hovercard-id") ||
    senderNode?.innerText ||
    ""
  ).trim();

  const bodyNode = document.querySelector("div.a3s.aiL") || document.querySelector("div.a3s");
  let body = (bodyNode?.innerText || "").trim();

  // Fallback: Gmail also renders message containers as role=listitem.
  if (body.length < 80) {
    const messages = document.querySelectorAll('[role="listitem"]');
    const last = messages[messages.length - 1];
    const maybeBody = (last?.innerText || "").trim();
    if (maybeBody.length > body.length) body = maybeBody;
  }

  if (!body || body.length < 80) return null;

  return { subject, sender, body };
}

function fingerprint(meta) {
  const subject = normalize(meta.subject);
  const sender = normalize(meta.sender);
  const bodyNorm = normalize(meta.body).slice(0, 2000);
  const bodyHash = fnv1a(bodyNorm);
  return { subject, sender, bodyHash };
}

function loadSafeList() {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve([]);
    chrome.storage.local.get([SAFE_KEY], (res) => {
      resolve(Array.isArray(res?.[SAFE_KEY]) ? res[SAFE_KEY] : []);
    });
  });
}

function saveSafeList(list) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve();
    chrome.storage.local.set({ [SAFE_KEY]: list.slice(-200) }, () => resolve());
  });
}

function isMarkedSafe(meta, safeList) {
  const fp = fingerprint(meta);
  return safeList.some((s) =>
    (s.sender && s.subject && s.sender === fp.sender && s.subject === fp.subject) ||
    (s.bodyHash && s.sender && s.bodyHash === fp.bodyHash && s.sender === fp.sender) ||
    (s.bodyHash && s.bodyHash === fp.bodyHash)
  );
}

async function analyze(text, meta) {
  try {
    const res = await fetch("http://localhost:3000/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const result = await res.json();

    if (result.riskScore >= 60) showBanner(result, meta);
  } catch {}
}

function showBanner(result, meta) {
  if (document.getElementById("signalsafe-gmail-banner")) return;

  const banner = document.createElement("div");
  banner.id = "signalsafe-gmail-banner";

  banner.style.background = "#7f1d1d";
  banner.style.color = "white";
  banner.style.padding = "12px";
  banner.style.fontSize = "14px";
  banner.style.textAlign = "center";
  banner.style.position = "sticky";
  banner.style.top = "0";
  banner.style.zIndex = "99999";

  banner.innerHTML = `
    ⚠ SignalSafe detected a risky email — ${result.verdict} (${result.riskScore}/100)
    <button id="ss-safe" style="margin-left:10px">Mark Safe</button>
    <button id="ss-close" style="margin-left:10px">Dismiss</button>
  `;

  document.body.prepend(banner);

  document.getElementById("ss-close").onclick = () => banner.remove();
  document.getElementById("ss-safe").onclick = async () => {
    const currentMeta = meta || getOpenedEmailMeta();
    if (!currentMeta) {
      banner.remove();
      return;
    }

    const safeList = await loadSafeList();
    const fp = fingerprint(currentMeta);

    const next = [
      ...safeList.filter((s) => !(s.bodyHash === fp.bodyHash && s.sender === fp.sender && s.subject === fp.subject)),
      fp,
    ];

    await saveSafeList(next);
    banner.remove();
  };
}

/* THIS is the important part */
const observer = new MutationObserver(async () => {
  const meta = getOpenedEmailMeta();
  if (!meta) return;

  const fp = fingerprint(meta);
  if (fp.bodyHash === lastScannedHash) return;
  lastScannedHash = fp.bodyHash;

  const safeList = await loadSafeList();
  if (isMarkedSafe(meta, safeList)) return;

  analyze(meta.body, meta);
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
