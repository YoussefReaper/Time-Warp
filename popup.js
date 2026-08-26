document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById("compare-toggle");
    const ui = document.getElementById("compare-ui");
    const slider = document.getElementById("pop-slider");
    const startLbl = document.getElementById("start-lbl");
    const endLbl = document.getElementById("end-lbl");
    const goBtn = document.getElementById("go-btn");
    const aiKey = document.getElementById("ai-key");
    const aiOut = document.getElementById("ai-out");
    const pane1 = document.getElementById("pane1");
    const pane2 = document.getElementById("pane2");

    let snaps = [];
    let currentTabUrl = '';
    let clickStep = 0;
    let t1 = null;
    let t2 = null;

    const stored = await chrome.storage.local.get(["aiKey"]);
    if (stored.aiKey) aiKey.value = stored.aiKey;

    aiKey.addEventListener("input", () => {
        chrome.storage.local.set({aiKey: aiKey.value});
    });

    toggle.addEventListener("change", async(e) => {
        ui.style.display = e.target.checked ? "block": "none";
        if (e.target.checked && snaps.length === 0) {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tabs.length) return;
            currentTabUrl = tabs[0].url;
            const cached = await chrome.storage.local.get([currentTabUrl]);
            if (cached[currentTabUrl]) {
                snaps = cached[currentTabUrl];
                slider.disabled = false;
                slider.min = 0;
                slider.max = snaps.length - 1;
                slider.value = 0;
            } else {
                aiOut.innerText = "no snapshots mapped boi. scrub the page first.";
            }
        }
    });

    slider.addEventListener("change", (e) => {
        const val = parseInt(e.target.value);
        const ts = snaps[val];
        if (clickStep === 0) {
            t1 = ts;
            startLbl.innerText = t1;
            clickStep = 1;
        } else {
            t2 = ts;
            endLbl.innerText = t2;
            clickStep = 0;
        }
    });

    async function fetchExtractBoi(ts) {
        const u = `https://web.archive.org/web/${ts}id_/${currentTabUrl}`;
        try {
            const res = await fetch(u);
            if (!res.ok) throw new Error("bad fetch");
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            const text = doc.body ? doc.body.innerText.replace(/\s+/g, " ").trim() : "";
            return {html, text};
        } catch(e) {
            return {html: "Error boi", text: ""};
        }
    }

    function textDiffFallback(s1, s2) {
        const w1 = s1.split(" ").slice(0, 1000);
        const w2 = s2.split(" ").slice(0, 1000);
        let o1 = "", o2 ="";
        const limit = Math.max(w1.length, w2.length);
        for (let i =0; i < limit; i++) {
            const a = w1[i] || "";
            const b = w2[i] || "";
            if (a===b) {
                o1 += a + " ";
                o2 += b + " ";
            } else {
                if (a) o1 += `<span class="red-highlight">${a}</span>`;
                if (b) o2 += `<span class="green-highlight">${b}</span>`;
            }
        }
        pane1.innerHTML = o1;
        pane2.innerHTML = o2;
    }

    goBtn.addEventListener("click", async ()=> {
        if(!t1 || !t2) {
            aiOut.innerText = "pick two points boi";
            return;
        }
        aiOut.innerText = "fetching archives, wait here boi";
        const [d1, d2] = await Promise.all([fetchExtractBoi(t1), fetchExtractBoi(t2)]);

        textDiffFallback(d1.text, d2.text);

        aiOut.innerText = "asking ai boi.";
        chrome.runtime.sendMessage({action: "AI_SUMMARY", t1: d1.text, t2: d2.text},
            (resp) => {
                if (chrome.runtime.lastError || !resp.success) {
                    aiOut.innerText = "summary unavailable boi: " + (resp?.error || "unknown");
                } else {
                    aiOut.innerHTML = resp.summary.replace(/\n/g, '<br>');
                }
            }
        );
    });
});