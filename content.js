console.log("Starting the player app application");

const maxZ = 2147483647;
let snapshots = [];
let activeIframe = null;
let currentUrl = window.location.href;

const hostElement = document.createElement("div");
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
const shadowRoot = hostElement.attachShadow({ mode: "open" });
const style = document.createElement("style");
style.textContent = `
    :host {
        --tw-bg: rgba(20, 15, 32, 0.75);
        --tw-text: #f3f0ff;
        --tw-text-muted: #b9aed6;
        --tw-border: rgba(139, 92, 246, 0.2);
        --tw-accent: #a855f7;
        --tw-glass-blur: blur(16px);
        --tw-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    }

    :host(.light-mode) {
        --tw-bg: rgba(250, 248, 255, 0.85);
        --tw-text: #2e2340;
        --tw-text-muted: #6b5c8c;
        --tw-border: rgba(124, 58, 237, 0.15);
        --tw-accent: #7c3aed;
        --tw-accent-hover: #6d28d9;
        --tw-shadow: 0 8px 32px rgba(124, 58, 237, 0.15);
    }

    #tw-master-container {
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        pointer-events: none;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }

    .controls {
        display: flex;
        gap: 10px;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    :host(:hover) .controls, .controls.active {
        opacity: 1;
        transform: translateY(0);
    }

    button {
        background: var(--tw-bg);
        backdrop-filter: var(--tw-glass-blur);
        border: 1px solid var(--tw-border);
        color: var(--tw-text-muted);
        padding: 6px 14px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: all 0.2s ease;
    }

    button:hover {
        background: var(--tw-accent);
        color: #fff;
        border-color: var(--tw-accent);
        box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
    }

    #ui-container {
        width: 85vw;
        max-width: 650px;
        background: var(--tw-bg);
        backdrop-filter: var(--tw-glass-blur);
        -webkit-backdrop-filter: var(--tw-glass-blur);
        padding: 18px 24px;
        border-radius: 24px;
        border: 1px solid var(--tw-border);
        box-shadow: var(--tw-shadow);
        display: flex;
        align-items: center;
        gap: 20px;
        pointer-events: auto;
        transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease, background 0.3s ease;
    }

    .brad {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--tw-accent);
    }

    .brand svg {
        width: 20px;
        height: 20px;
        fill: currentColor;
    }

    #tw-display {
        min-width: 110px;
        text-align: center;
        font-family: 'JetBrains Mono', 'Courier New', monospace;
        font-size: 13px;
        font-weight: 700;
        background: rgba(168, 85, 247, 0.1);
        color: var(--tw-accent);
        padding: 8px 12px;
        border-radius: 12px;
        border: 1px solid rgba(168, 85, 247, 0.2);
        transition: all 0.3s ease;
    }

    #tw-display.loading {
        animation: pulse 1.5s infinite;
        color: var(--tw-text-muted);
        background: transparent;
        border-color: var(--tw-border);
    }

    @keyframes pulse {
        0% { opacity: 0.5; }
        50% { opacity: 1; }
        100% { opacity: 0.5; }
    }

    .slider-label {
        font-size: 11px;
        color: var(--tw-text-muted);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    input[type=range] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
        cursor: pointer;
    }

    input[type=range]:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }

    input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        background: var(--tw-border);
        border-radius: 10px;
        transition: all 0.2s;
    }

    input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: var(--tw-accent);
        margin-top: -7px;
        box-shadow: 0 0 10px rgba(168, 85, 247, 0.6);
        transition: transform 0.1s, background 0.2s;
        border: 2px solid #fff;
    }

    input[type=range]:active::-webkit-slider-thumb {
        transform: scale(1.2);
        background: var(--tw-accent-hover);
    }

    .iframe-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #fff;
        z-index: ${maxZ - 2};
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.4s ease;
    }
    .iframe-overlay.active {opacity: 1; pointer-events: auto;}
`;

const masterContainer = document.createElement("div");
masterContainer.id = "tw-master-container";
masterContainer.innerHTML = `
    <div class="controls" id="tw-controls">
        <button id="tw-toggle-btn">Hide</button>
        <button id="tw-theme-btn">Light Mode</button>
    </div>
    <div id="ui-container">
        <div class="brand">
            <svg viewBox="0 0 24 24">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
                <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
            </svg>
        </div>

        <div class="slider-wrapper">
            <span class="slider-label">Past</span>
            <input type="range" id="tw-slider" min="0" max="0" value="0" disabled>
            <span class="slider-label">Now</span>
        </div>

        <div id="tw-display" class="loading">Loading</div>
    </div>
`;

shadowRoot.appendChild(style);
shadowRoot.appendChild(masterContainer);

const injectUI = () => {
  if (document.body) document.body.appendChild(hostElement);
  else requestAnimationFrame(injectUI);
};
injectUI();

const slider = shadowRoot.getElementById("tw-slider");
const display = shadowRoot.getElementById("tw-display");
const uiContainer = shadowRoot.getElementById("ui-container");
const toggleBtn = shadowRoot.getElementById("tw-toggle-btn");
const themeBtn = shadowRoot.getElementById("tw-theme-btn");
const controls = shadowRoot.getElementById("tw-controls");

toggleBtn.addEventListener("click", () => {
  uiContainer.classList.toggle("collapsed");
  controls.classList.toggle("active");
  toggleBtn.innerText = uiContainer.classList.contains("collapsed")
    ? "Show Time Warp"
    : "Hide";
});

themeBtn.addEventListener("click", () => {
  hostElement.classList.toggle("light-mode");
  themeBtn.innerText = hostElement.classList.contains("light-mode")
    ? "Dark Mode"
    : "Light Mode";
});

function formatTimestamp(ts) {
  if (!ts) return "Now";
  const year = ts.substring(0, 4);
  const month = ts.substring(4, 6);
  const day = ts.substring(6, 8);

  const date = new Date(`${year}-${month}-${day}`);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function removeActiveIframe() {
  if (activeIframe) {
    activeIframe.style.opacity = "0";
    setTimeout(() => {
      if (activeIframe) {
        activeIframe.remove();
        activeIframe = null;
      }
    }, 400);
  }
}

function updateDisplay(text, isError = false) {
  display.innerText = text;
  display.classList.remove("loading");
  display.style.background = isError
    ? "rgba(255, 71, 87, 0.1)"
    : "rgba(168, 85, 247, 0.1)";
  display.style.borderColor = isError
    ? "rgba(255, 71, 87, 0.3)"
    : "rgba(168, 85, 247, 0.2)";
  display.style.color = isError ? "#ff4757" : "var(--tw-accent)";
}

function setDisplayLoading() {
  display.innerText = "Scanning";
  display.classList.add("loading");
  display.style.color = "";
  display.style.background = "";
  display.style.borderColor = "";
}

function loadSnapshots(targetUrl) {
  setDisplayLoading();
  slider.disabled = true;
  removeActiveIframe();

  chrome.runtime.sendMessage(
    {
      action: "FETCH_SNAPSHOTS",
      url: targetUrl,
    },
    (response) => {
      if (chrome.runtime.lastError || !response) {
        updateDisplay("Extension Error", true);
        return;
      }

      if (response.success) {
        if (response.timestamps.length > 0) {
          snapshots = response.timestamps;
          slider.disabled = false;
          slider.min = 0;
          slider.max = snapshots.length;
          slider.value = snapshots.length;
          display.innerText = "Live site";
        } else {
          updateDisplay("No archives", true);
        }
      } else {
        updateDisplay("API Overloaded", true);
      }
    },
  );
}

loadSnapshots(currentUrl);

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "URL_CHANGED" && request.url !== currentUrl) {
    currentUrl = request.url;
    loadSnapshots(currentUrl);
  }
});

slider.addEventListener("change", (e) => {
  const idx = parseInt(e.target.value);

  if (idx === snapshots.length) {
    updateDisplay("Live site");
    removeActiveIframe();
  } else {
    const selectedTimestamp = snapshots[idx];
    updateDisplay(formatTimestamp(selectedTimestamp));

    if (!activeIframe) {
      activeIframe = document.createElement("iframe");
      activeIframe.className = "iframe-overlay";
      activeIframe.style.cssText = `
                position: fixed;top:0;left:0;width:100vw;height:100vh;
                border:none;z-index:${maxZ - 1};background:white;pointer-events:auto;
            `;
      document.body.appendChild(activeIframe);

      setTimeout(() => {
        if (activeIframe) activeIframe.style.opacity = "1";
      }, 100);
    }

    const archiveUrl = `https://web.archive.org/web/${selectedTimestamp}if_/${currentUrl}`;
    activeIframe.src = chrome.runtime.getURL(
      `warp.html?url=${encodeURIComponent(archiveUrl)}`,
    );
  }
});

slider.addEventListener("input", (e) => {
  const idx = parseInt(e.target.value);
  if (idx === snapshots.length) {
    updateDisplay("Live site");
  } else {
    updateDisplay(formatTimestamp(snapshots[idx]));
  }
});
