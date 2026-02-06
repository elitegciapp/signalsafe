document.getElementById("scan").onclick = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["scanner.js"]
    });
  } catch (e) {
    // Chrome blocks injection into internal pages like chrome://extensions
    const msg = String(e?.message || e || "");
    if (msg.includes("Cannot access")) return;
    throw e;
  }
};
