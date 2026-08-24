console.log("bg worker alive");

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.sendMessage(details.tabId, {action: "URL_CHANGED", url: details.url}).catch(()=> {});
});

async function fetchWithRetry(url, retries = 3, delay=1000) {
    for (let i=0; i<retries;i++){
        try{
            const res=await fetch(url);
            if (res.status === 503 || res.status===429) {
                if (i===retries-1) throw new Error("Wayback servers overload");
                await new Promise(r=> setTimeout(r, delay*(i+1)));
                continue;
            }
            if (!res.ok) throw new Error(`API Error ${res.status}`);
            return await res.json();
        } catch (err){
            if (i=== retries-1 ) throw err;
            await new Promise(r=> setTimeout(r, delay*(i+1)));
        }
    }
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_SNAPSHOTS") {
        const cleanUrl = request.url.split('#')[0];
        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&fl=timestamp&filter=statuscode:200&filter=mimetype:text/html&limit=150`;

        fetchWithRetry(cdxUrl)
            .then(data=> {
                if (!data || data.length <= 1) {
                    sendResponse({success: true, timestamps: []});
                    return;
                }
                const timestamps = data.slice(1).map(row=> row[0]);
                sendResponse({success: true, timestamps: timestamps});
            })
            .catch(err => {
                console.error("Time Warp API Fetch failed:", err.message);
                sendResponse({success: false, error: err.message});
            });
        return true;
    }
});