console.log("bg worker alive");

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.sendMessage(details.tabId, {action: "URL_CHANGED", url: details.url}, (resp) => {
        if (chrome.runtime.lastError) {
            return;
        }
    });
});

async function fetchWithRetry(url, retries = 3, delay = 1200) {
    for (let i = 0; i < retries; i++) {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        try {
            const res = await fetch(url, {signal: ctrl.signal});
            clearTimeout(t);
            if (res.status >= 500 || res.status === 429) {
                if (i === retries - 1) throw new Error(`Wayback servers overload BOI ${res.status}`);
                const jitter = delay * Math.pow(2, i) + Math.random() * 1000;
                await new Promise(r => setTimeout(r, jitter));
                continue;
            }
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            return await res.json();
        } catch (err) {
            clearTimeout(t);
            if (err.name === 'AbortError') err.message = 'Wayback took too long BOI';
            if (i === retries - 1) throw err;
            const jitter = delay * (i + 1) + Math.random() * 1000;
            await new Promise(r => setTimeout(r, jitter));
        }
    }
}

async function availFallBoi(url) {
    const now = new Date().getFullYear();
    const years = [];
    for (let y = 1996; y <= now; y++) years.push(y);
    const stamps = [];
    await Promise.all(years.map(async (y) => {
        const aurl = `https://archive.org/wayback/available?url=${encodeURIComponent(url)}&timestamp=${y}0601`;
        try {
            const r = await fetch(aurl);
            if (!r.ok) return;
            const j = await r.json();
            const snap = j && j.archived_snapshots && j.archived_snapshots.closest;
            if (snap && snap.url) stamps.push(snap.timestamp);
        } catch (e) {
            console.warn("avail pull flopped for", y, e.message);
        }
    }));
    const seen = new Set();
    const out = [];
    stamps.filter(Boolean).sort().forEach(ts => {
        const k = ts.slice(0, 6);
        if (seen.has(k)) return;
        seen.add(k);
        out.push(ts);
    });
    console.log("avail fallback pulled", out.length, "snapshots Boi");
    return out;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_SNAPSHOTS") {
        const cleanUrl = request.url.split('#')[0];
        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&fl=timestamp&collapse=timestamp:6`;

        chrome.storage.local.get([cleanUrl], async (cached) => {
            if (cached[cleanUrl]) {
                sendResponse({success: true, timestamps: cached[cleanUrl], cached: true});
                return;
            }
            try {
                const data = await fetchWithRetry(cdxUrl);
                if (!data || data.length <= 1) {
                    sendResponse({success: true, timestamps: []});
                    return;
                }
                const timestamps = data.slice(1).map(row => row[0]);
                chrome.storage.local.set({[cleanUrl]: timestamps});
                sendResponse({success: true, timestamps: timestamps});
            } catch (err) {
                console.warn("CDX died on us Boi:", err.message, "| trying the lighter per-year avail pull");
                try {
                    const fallback = await availFallBoi(cleanUrl);
                    if (fallback.length) {
                        chrome.storage.local.set({[cleanUrl]: fallback});
                        sendResponse({success: true, timestamps: fallback, cached: false, fallback: true});
                        return;
                    }
                } catch (e2) {
                    console.error("avail fallback also died Boi:", e2.message);
                }
                console.error("Time Warp API Fetch failed Boi:", err.message);
                sendResponse({success: false, error: err.message});
            }
        });
        return true;
    }
});