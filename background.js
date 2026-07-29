console.log("bg worker alive");

// function testAPI() {
//    fetch('https://archive.org/...') // CORS error.
// }
// testAPI(); //broken

chrome.runtime.onInstalled.addListener(() => {
    console.log("extension installed. please say it.");
});