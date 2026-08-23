console.log("bg worker alive");

chrome.webNavigation.onHistoryStateUpdated.addListener((details) => {
    chrome.tabs.sendMessage(details.tabId, {action: "URL_CHANGED", url: details.url}).catch(()=> {});
});

chrome.runtime.onInstalled.addListener(()=> {
    console.log("installed");
});

chrome.runtime.onMessage.addEventListener((request, sender, sendResponse) => {
    if (request.action==="FETCH_SNAPSHOTS") {
        const cleanUrl = request.url.split('#')[0];
        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&fl=timestamp&filter=statuscode:200&filter=mimetype:text/html&limit=150`;

        fetch(cdxUrl)
            .then(res => {
                if(!res.ok) {
                    if(res.status===503) throw new Error("Wayback servers overloaded (503).");
                    throw new Error(`Wayback API threw a ${res.status} error`);
                }
                return res.json();
            })
            .then(data => {
                if(!data || data.length <= 1) {
                    sendResponse({success:true, timestamps: []});
                    return;
                }

                const timestamps = data.slice(1).map(row=>row[0]);
                sendResponse({success:true, timestamps: timestamps});
            })
            .catch(err=>{
                console.error("time warp failed:", err.message);
                sendResponse({success:false,error:err.message});
            });

        return true;
    }
});