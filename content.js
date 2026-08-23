console.log("Starting the player app application");

const maxZ = 2147483647;
let snapshots = [];
let activeIframe = null;

const hostElement = document.createElement('div');
hostElement.id = "timewarp-extension-host";
hostElement.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: ${maxZ};
`;
const shadowRoot = hostElement.attachShadow({mode: 'open'});
const style=document.createElement('style');
style.textContent=`
    :host {
        --tw-bg: rgba(25, 25, 25,0.84);
        --tw-text: #ffffff;
        --tw-border:rgba(255,255,255,0.1);
        --tw-accent: #f39c12;
        --tw-glass-blur: blur(12px);
    }
    :host(.light-mode){
        --tw-bg: rgba(255,255,255,0.84);
        --tw-text: #2c3e50;
        --tw-border:rgba(0,0,0,0.14);
        --tw-accent:#d35400;
    }

    #tw-master-container {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        pointer-events: none;
        z-index: ${maxZ};
    }

    #ui-container{
        width: 80vw;
        max-width: 800px;
        background: var(--tw-bg);
        backdrop-filter: var(--tw-glass-blur);
        -webkit-backdrop-filter: var(--tw-glass-blur);
        padding:15px 25px;
        border-radius: 16px;
        border:1px solid var(--tw-border);
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        color: var(--tw-text);
        font-family: system-ui, -apple-system, sans-serif;
        display: flex;
        align-items: center;
        gap: 15px;
        pointer-events: auto;
        transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
                    opacity 0.4s ease, background 0.3s ease, color 0.3s ease;
    }

    #ui-container.collapsed {
        transform: translateY(150%);
        opacity: 0;
        pointer-events: none;
    }

    .label {font-size: 12px; opacity: 0.69; font-weight: 500;}
    .title {font-weight: bold; font-size:15px;white-space:nowrap;letter-spacing:0.5px;}

    input[type=range]{
        flex-grow: 1;
        cursor: pointer;
        accent-color: var(--tw-accent);
        height: 6px;
        border-radius: 5px;
        outline: none;
    }

    #tw-display {
        min-width: 100px;
        text-align: right;
        font-family: 'Courier New', monospace;
        font-size: 14px;
        font-weight: bold;
        color: var(--tw-accent);
    }

    .controls {
        display: flex;
        gap: 8px;
        pointer-events: auto;
    }

    button {
        background: var(--tw-bg);
        backdrop-filter: var(--tw-glass-blur);
        border: 1px solid var(--tw-border);
        color: var(--tw-text);
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-family: inherit;
        font-size: 12px;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
    }

    button:hover {
        background:var(--tw-accent);
        color: #fff;
        border-color: var(--tw-accent);
    }
`;

const masterContainer = document.createElement('div');
masterContainer.id = "tw-master-container";
masterContainer.innerHTML = `
    <div class="controls">
        <button id="tw-toggle-btn">Hide Time Warp </button>
        <button id="tw-theme-btn">Light Mode</button>
    </div>
    <div id="ui-container">
        <div class="title">Time Warp</div>
        <span class="label">Past</span>
        <input type="range" id="tw-slider" min="0" max="0" value="0" disabled>
        <span class="label">Now</span>
        <div id="tw-display">Loading...</div>
    </div>
`;

shadowRoot.appendChild(style);
shadowRoot.appendChild(masterContainer);

const injectUI = () => {
    if (document.body) {
        document.body.appendChild(hostElement);
    } else {
        requestAnimationFrame(injectUI);
    }
};
injectUI();

const slider= shadowRoot.getElementById('tw-slider');
const display= shadowRoot.getElementById('tw-display');
const uiContainer = shadowRoot.getElementById('ui-container');
const toggleBtn = shadowRoot.getElementById('tw-toggle-btn');
const themeBtn = shadowRoot.getElementById('tw-theme-btn');

toggleBtn.addEventListener('click', ()=> {
    uiContainer.classList.toggle('collapsed');
    toggleBtn.innerText = uiContainer.classList.contains('collapsed') ? "Show Time Warp" : "Hide Time Warp";
});

themeBtn.addEventListener('click', ()=> {
    hostElement.classList.toggle('light-mode');
    themeBtn.innerText = hostElement.classList.contains('light-mode') ? "Dark Mode": "Light Mode";
});

function formatTimestamp(ts) {
    if(!ts) return "Now";
    return `${ts.substring(0,4)}-${ts.substring(4,6)}-${ts.substring(6,8)}`;
}

chrome.runtime.sendMessage(
    { action: "FETCH_SNAPSHOTS", url: window.location.href},
    (response) => {
        if (chrome.runtime.lastError){
            display.innerText = "Ext error";
            return;
        }

        if (response&&response.success) {
            if(response.timestamps.length > 0) {
                snapshots = response.timestamps;
                slider.disabled=false;
                slider.min=0;
                slider.max=snapshots.length;
                slider.value=snapshots.length;
                display.innerText = "Live site";
            } else {
                display.innerText = "No archives";
                display.style.color = '#e74c3c';
            }
        } else {
            display.innerText = "API Error";
            display.style.color = '#e74c3c';
        }
    }
);

slider.addEventListener('change', (e)=> {
    const idx=parseInt(e.target.value);
    if(idx=== snapshots.length){
        display.innerText="Live site";
        if(activeIframe){
            activeIframe.remove();
            activeIframe=null;
        }
    } else {
        const selectedTimestamp = snapshots[idx];
        display.innerText = formatTimestamp(selectedTimestamp);

        if (!activeIframe) {
            activeIframe = document.createElement('iframe');
            activeIframe.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                border: none;
                z-index: ${maxZ-1};
                background: white;
                pointer-events: auto;
            `;
            document.body.appendChild(activeIframe);
        }

        activeIframe.src=`https://web.archive.org/web/${selectedTimestamp}if_/${window.location.href}`;
    }
});

slider.addEventsListener('input', (e) => {
    const idx=parseInt(e.target.value);
    display.innerText = idx === snapshots.length ? "Live site": formatTimestamp(snapshots[idx]);
});