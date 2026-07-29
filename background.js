console.log("bg worker alive");

// function testAPI() {
//    fetch('https://archive.org/...') // CORS error.
// }
// testAPI(); //broken

chrome.runtime.onInstalled.addListener(() => {
    console.log("extension installed. please say it.");
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "FETCH_SNAPSHOTS") {
        const cleanUrl = request.url.split('#')[0];

        const cdxUrl = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(cleanUrl)}&output=json&fl=timestamp&collapse=timestamp:4&limit=300`;

        fetch(cdxUrl)
            .then(res => {
                if(!res.ok) throw new Error(`Wayback API threw a ${res.status} error`);
                return res.json();
            })
            .then(data => {
                if (!data || data.length <= 1) {
                    sendResponse({success: true, timestamps: []});
                    return;
                }
                const timestamps = data.slice(1).map(row=>row[0]);
                sendResponse({ success: true, timestamps: timestamps});
            })
            .catch(err => {
                console.error("API Fetch fialied: ", err.message);
                sendResponse({success: false, error: err.message});
            });
        return true;
    }
});