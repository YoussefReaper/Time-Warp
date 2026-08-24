const urlParams= new URLSearchParams(window.location.search);
const targetUrl = urlParams.get('url');
if(targetUrl){
    document.getElementById('archive-frame').src = targetUrl;
};
