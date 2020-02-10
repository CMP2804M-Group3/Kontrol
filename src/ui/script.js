const { remote } = require('electron');
const $ = require('jquery');
const kodiController = require('kodi-controller');
const Kodi = new kodiController();

const fs = require('fs');
const { BrowserWindow } = remote;

let kodiEnabled = false;

window.onload = ()=> {

    loadContent("pages/loading.html");

    document.getElementById("closeButton").addEventListener("click", function (e) {
        let win = remote.getCurrentWindow();
        win.close();
    });

    document.getElementById("minimise").addEventListener("click", function (e) {
        let win = remote.getCurrentWindow();
        win.minimize();
    });

};

function loadContent(url, callback) {
    // var win = remote.getCurrentWindow();
    // window.location = ;
    let file = `src/ui/${url}`;
    console.log(file);
    let parent = document.getElementById('parent');
    let old = document.getElementById('inserted');

    fs.readFile(file, "utf8", (err, data) => {
        old.parentNode.removeChild(old);
        parent.insertAdjacentHTML("beforeend", data);
        try{
            eval($("#inserted script")[0]["text"]);
        }
        catch (e) {
            //
        }
        if (callback) {
            setTimeout(callback, 500);
            // callback();
        }
    });
}
// win.loadURL();