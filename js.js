let failedAttempts = 0;
let reconnectTimeout;
let ws;
let url;
function tryParseJSON(jsonString) {
    try {
        var o = JSON.parse(jsonString);
        if (o && typeof o === "object") {
            return o;
        }
    }
    catch (e) { }
    return false;
};
function stringToCommand(string) {
    let object = tryParseJSON(string);
    if (object) {
        if (typeof object.cmd === 'string') {
            return object
        } else {
            return { cmd: '' }
        }
    }
};
function onMessageHandler(data) {
    obj = stringToCommand(data);
    switch (obj.cmd.toUpperCase()) {
        case 'RELOAD': {
            window.location.reload();
            break;
        }
        case 'SHOW': {
            document.getElementById('iframe').src = obj.data.url;
            document.getElementById('iframe').style.display = ''
            break;
        }
        case 'HIDE': {
            document.getElementById('iframe').style.display = 'none'
            document.getElementById('iframe').src = '';
            break;
        }

        default:
            break;
    }
};

function connectWebsocket() {
    clearTimeout(reconnectTimeout)
    reconnectTimeout = setTimeout(() => {
        if (!ws || ws.readyState != 1) {
            createWebSocketConnection(url);
        }
    }, 100 + failedAttempts * 5000);
}
function createWebSocketConnection(url) {
    if (ws) {
        ws.onerror = ws.onopen = ws.onclose = null;
        ws.close();
    }
    
    ws = new WebSocket(url);
    ws.onopen = () => {
        failedAttempts = 0;
        ws.send(JSON.stringify({
            cmd: 'GROUP',
            data:{
                group:'iframe'
            }
        }));
    }
    ws.onmessage = ({ data }) => onMessageHandler(data);
    ws.onclose = function () {
        if (failedAttempts >= 60) {
            failedAttempts = 60;
        } else {
            failedAttempts += 1;
        }
        connectWebsocket();
    }

}
window.addEventListener('DOMContentLoaded', (event) => {
    let urlParams = new URLSearchParams(window.location.search);
    url = urlParams.get('url')
    createWebSocketConnection(url);
});