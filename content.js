// TODO: refactor this whole file later
// console.log("loaded");
// console.log("loaded 2");
// console.log("is it working?");

console.log("Time warp thing script running.");

// var testUrl = "https://google.com"; //unused for now

const maxZ = 2147483647;

const container = document.createElement('div');
container.id = "timewarp-ui-wrapper";

container.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    left: 50% !important;
    transform: translateX(-50%) !important;
    width: 80%;
    max-width: 800px;
    background: rgba(30, 30, 30, 0.95);
    padding: 15px 25px;
    border-radius: 12px;
    border: 1px solid #555;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    z-index: ${maxZ};
    color: white;
    font-family: sans-serif;
    display: flex;
    align-items: center;
    gap: 15px;
`;

container.innerHTML = `
    <div style="font-weight: bold; font-size: 14px;">Time Warp</div>
    <span style="font-size: 12px; opacity: 0.7;">Past</span>
    <input type="range" id="tw-slider" min="0" max="100" value="100"
        style="flex-grow: 1; cursor: pointer; accent-color: #f39c12;">
    <span style="font-size: 12px; opacity: 0.7;">Now</span>
    <div id="tw-display" style="min-width: 80px; text-align: right; font-family: monospace; font-size: 14px;">Today</div>
`;

if (document.body) {
    document.body.appendChild(container);
    console.log("Slider injected. If you don't see it, some site is doing weird things with the body tag.");
} else {
    console.error("No body tag found.");
}

const slider = document.getElementById('tw-slider');
const display = document.getElementById('tw-display');

slider.addEventListener('input', (e) => {
    let val = e.target.value;
    console.log("Scrubbing to index:", val);

    if (val==100) {
        display.innerText = 'Today';
    } else {
        display.innerText = "Index: " + val;
    }
});