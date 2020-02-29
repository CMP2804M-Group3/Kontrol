const { remote, BrowserWindow, screen } = require('electron');
const $ = require('jquery');
const fs = require('fs');
const kodiController = require('kodi-controller');
let kodi = new kodiController();

let kodiEnabled = false;

let configPath = "src/config.json";


class JSONReader{
    constructor(src){
        this.src = src;
        let json = fs.readFileSync(this.src);
        this.JSONData = JSON.parse(json);
    }

    save(callback){
        var jsonContent = JSON.stringify(this.JSONData);
        fs.writeFile(this.src, jsonContent, 'utf8', callback);
    }

    getActionFromGesture(gestureName, status){
        for(let i in this.JSONData.gesture_bindings){
            let binding = this.JSONData.gesture_bindings[i];
            if (binding.gesture === gestureName && binding.status === status){
                return binding;
            }
        }
        console.error("Error, no command found for this gesture");
    }
    
    overwriteSetting(settingName, value){
        this.JSONData.general[settingName] = value;        
    }
    readSetting(settingName){
        return this.JSONData.general[settingName];
    }
    
    overwriteAction(gestureName, status, newAction){
        let newBinding ={"gesture": gestureName,"status": status, "action": newAction};

        for(let i in this.JSONData.gesture_bindings){
            let binding = this.JSONData.gesture_bindings[i];
            if (binding.gesture === gestureName && binding.status === status){
                this.JSONData.gesture_bindings[i] = newBinding;
                console.log(this.JSONData.gesture_bindings[i]);
            }
        }
    }
    
}

let settings = new JSONReader(configPath);

function startScan(){
    if(kodiEnabled){
        loadContent("pages/loading.html");
    }else{
        loadContent("pages/enableRemoteControl.html");
    }
}


window.onload = ()=> {

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
    let file = `src/${url}`;
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
            console.log(e);
        }
        if (callback) {
            setTimeout(callback, 500);
            // callback();
        }
    });
}

function setItem( array, item, length ) {
    array.unshift( item ) > length ? array.pop() : null
}

function rewind() {
    kodi.rewind();
}

function fastForward() {
    kodi.fastForward();
}

function goPrevious() {
    kodi.rewind();
}

function goNext() {
    kodi.goNext();
}

function playPause() {
    kodi.playPause();
}

function volumeUp() {
    kodi.volumeUp();
}

function volumeDown() {
    kodi.volumeDown();
}

function mute() {
    kodi.setVolume( null, 0 );
}
function readIP(){
    let win = remote.getCurrentWindow();
    let ip = $("#IP")[0].value;
    let port = $("#port")[0].value;
    
    settings.overwriteSetting("ip", ip);
    settings.overwriteSetting("port", port);
    settings.save(() => {
        win.hide();
        win.loadFile("main.html");
    });
}

function selectFromScan() {
    let win = remote.getCurrentWindow();
    let ip = $( "#kodiList li.selected h2" ).text();
    let port = 8080;
    settings.overwriteSetting("ip", ip);
    settings.overwriteSetting("port", port);
    settings.save(() => {
        win.hide();
        win.loadFile("main.html");
    });

}