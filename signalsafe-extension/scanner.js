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

  // extract visible text
  const text = document.body.innerText.slice(0, 15000);

  const res = await fetch("http://localhost:3000/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text })
  });

  const result = await res.json();

  clearInterval(interval);
  overlay.remove();

  alert(`SignalSafe Scan Complete:
${result.verdict}
Risk Score: ${result.riskScore}`);

})();
