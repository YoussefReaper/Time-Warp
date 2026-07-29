
console.log("Time warp thing script running");

const maxZ = 2147483647;
let snapshots = [];
let activeIframe = null;

const container = document.createElement('div');
container.id = "timewarp-ui-wrapper";
container.style.cssText = `
    position: fixed;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%);
    width: 80%;
    max-width: 800px !important;
    background: rgba(30, 30, 30, 0.95);
    padding: 15px 25px;
    border-radius: 12px;
    border: 1px solid #555;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: ${maxZ} !important;
    color: white !important;
    font-family: sans-serif !important;
    display: flex;
    align-items: center;
    gap: 15px;
`;

container.innerHTML = `
    <div style="font-weight: bold; font-size: 14px; white-space: nowrap;">Time Warp</div>
    <span style="font-size: 12px; opacity: 0.7;">Past</span>
    <input type="range" id="tw-slider" min="0" max="0" value="0" disabled
        style="flex-grow: 1; cursor: pointer; accent-color: #f39c12;">
    <span style="font-size: 12px; opacity: 0.7;">Now</span>
    <div id="tw-display" style="min-width:100px; text-align: right; font-family: monospace; font-size: 13px; color: #f39c12;">
      Loading
    </div>
`;

if (document.body) {
    document.body.appendChild(container);
}

const slider = document.getElementById('tw-slider');
const display = document.getElementById('tw-display');

function formatTimestamp(ts) {
    if (!ts) return "Now";
    return `${ts.substring(0,4)}-${ts.substring(4,6)}-${ts.substring(6,8)}`;
}

console.log("asking background for archives");
chrome.runtime.sendMessage(
    { action: "FETCH_SNAPSHOTS", url: window.location.href},
    (response) => {
        if (chrome.runtime.lastError) {
            console.error("Message passing failed: ", chrome.runtime.lastError);
            display.innerText = "Error loading";
            return;
        }

        if (response && response.success) {
            if (response.timestamps.length > 0) {
                snapshots = response.timestamps;
                slider.disabled = false;
                slider.min =0;
                slider.max = snapshots.length;
                slider.value = snapshots.length;
                display.innerText = 'live site';
            } else {
                display.innerText = "No archives";
                display.style.color = "#e74c3c";
            }
        } else {
            display.innerText ="api dead";
            display.style.color ="#e74c3c";
            console.error("Background error said:", response.error);
        }
    }
);

slider.addEventListener('change', (e) => {
    const idx = parseInt(e.target.value);

    if (idx=== snapshots.length) {
        display.innerText = "live site";
        if(activeIframe) {
            activeIframe.remove();
            activeIframe = null;
        }
    } else {
        const selectedTimestamp = snapshots[idx];
        display.innerText = formatTimestamp(selectedTimestamp);

        if(!activeIframe) {
            activeIframe = document.createElement('iframe');
            activeIframe.id = "timewarp-iframe";
            activeIframe.style.cssText =`
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                border: none;
                z-index: ${maxZ -1};
                background: white !important;
            `;
            document.body.appendChild(activeIframe);
        }

        const archiveUrl = `https://web.archive.org/web/${selectedTimestamp}/${window.location.href}`;
        console.log("loading iframe: ", archiveUrl);
        activeIframe.src = archiveUrl;
    }
});

slider.addEventListener('input', (e) => {
    const idx = parseInt(e.target.value);
    if (idx===snapshots.length) {
        display.innerText = "current site";
    } else {
        display.innerText = formatTimestamp(snapshots[idx]);
    }
})