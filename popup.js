document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById("compare-toggle");
    const hideToggle = document.getElementById("hide-toggle");
    const ui = document.getElementById("compare-ui");
    const startSel = document.getElementById("start-sel");
    const endSel = document.getElementById("end-sel");
    const goBtn = document.getElementById("go-btn");
    const msg = document.getElementById("msg");

    let snaps = [];
    let currentTabUrl = '';
    let labels = [];

    function fmt(ts) {
        const y = ts.substring(0, 4), m = ts.substring(4, 6), d = ts.substring(6, 8);
        const date = new Date(`${y}-${m}-${d}`);
        return date.toLocaleDateString("en-US", {month: "short", day: "numeric", year: "numeric"});
    }
    
    function fillSelects() {
        startSel.innerHTML = '<option value="">pick start boi</option>';
        endSel.innerHTML = '<option value="">pick end boi</option>';
        snaps.forEach((ts, i) => {
            const o1 = document.createElement("option");
            o1.value = String(i); o1.text = fmt(ts);
            startSel.appendChild(o1);
            const o2 = document.createElement("option");
            o2.value = String(i); o2.text = fmt(ts);
            endSel.appendChild(o2);
        });
    }

    function refresh() {
        const ok = startSel.value !== "" && endSel.value !== "" && startSel.value !== endSel.value;
        goBtn.disabled = !ok;
        if (startSel.value !== "" && startSel.value === endSel.value) msg.innerText = "pick two different points boi";
        else msg.innerText = "";
    }

    startSel.addEventListener("change", refresh);
    endSel.addEventListener("change", refresh);

    async function sendToTab(msg) {
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (tabs.length) chrome.tabs.sendMessage(tabs[0].id, msg);
    }

    hideToggle.addEventListener("change", (e) => {
        sendToTab({action: e.target.checked ? "HIDE_UI" : "SHOW_UI"});
    });

    toggle.addEventListener("change", async (e) => {
        ui.style.display = e.target.checked ? "block" : "none";
        if (e.target.checked && snaps.length === 0) {
            const tabs = await chrome.tabs.query({active: true, currentWindow: true});
            if (!tabs.length) return;
            currentTabUrl = tabs[0].url.split('#')[0];
            const cached = await chrome.storage.local.get([currentTabUrl]);
            if (cached[currentTabUrl]) {
                snaps = cached[currentTabUrl];
                fillSelects();
            } else {
                msg.innerText = "no snapshots mapped boi. scrub the page first.";
            }
        }
    });

    goBtn.addEventListener("click", async () => {
        const i1 = parseInt(startSel.value), i2 = parseInt(endSel.value);
        if (isNaN(i1) || isNaN(i2) || i1 === i2) return;
        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        if (!tabs.length) return;
        msg.innerText = "opening compare boi...";
        chrome.tabs.sendMessage(tabs[0].id, {
            action: "OPEN_COMPARE",
            t1: snaps[i1],
            t2: snaps[i2],
            url: currentTabUrl
        }, (resp) => {
            if (chrome.runtime.lastError) msg.innerText = "page not ready boi. refresh the tab.";
            else window.close();
        });
    });
});
