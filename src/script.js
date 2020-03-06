const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const $ = require('jquery');
const fs = require('fs');
const kodiController = require('kodi-controller');
let kodi = new kodiController();

let kodiEnabled = false;

let configPath = "src/config.json";

let running = true;
let kodis = [];
let ip = "";

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
    overwritePerformanceSetting(settingName, value){
        this.JSONData.performance[settingName] = value;        
    }
    addKodi(number, ip){
        this.JSONData.kodis[number] = ip;        
    }
    readSetting(settingName){
        return this.JSONData.general[settingName];
    }
    readPerformanceSetting(settingName){
        return this.JSONData.performance[settingName];
    }
    readKodi(number){
        return this.JSONData.kodis[number];       
    }
    removeKodis(){
        this.JSONData.kodis = [];
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
function quitApp() {
    let wins = BrowserWindow.getAllWindows();

    for (let i = 0; i < wins.length; i++) {
        let path = wins[i].getURL();
        let file = path.substr(path.lastIndexOf("/")+1);
        if (file !== "popup.html"){
            wins[i].close();
        }
    }
    let win = remote.getCurrentWindow();
    win.close();
}
function startScan(){
    if(kodiEnabled){
        loadContent("pages/loading.html");
    }else{
        loadContent("pages/enableRemoteControl.html");
    }
}
function webcamAllow(){
    settings.overwriteSetting("webcamEnabled", "true");
    settings.save(() => {
        let win = remote.getCurrentWindow();
        win.close();
    });


}


function toggleNightMode(){
	if (document.documentElement.getAttribute("data-theme") === 'light'){
        document.documentElement.setAttribute('data-theme', 'dark');
        settings.overwriteSetting("theme", "dark");
        settings.save();
	}else{
        document.documentElement.setAttribute('data-theme', 'light');
        settings.overwriteSetting("theme", "light");
        settings.save();
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

function gotIPandPort() {
    ip = settings.readSetting("ip");
    let port = settings.readSetting("port");
    if (ip !== "" && port !== ""){
        return [ip, port]
    }else{
        return false
    }

}


function loadContent(url, callback) {
    // var win = remote.getCurrentWindow();
    // window.location = ;
    let file = `src/${url}`;
    console.log(file);
    let parent = document.getElementById('parent');
    let old = document.getElementById('inserted');
    running = false;

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
    kodi.goBack();
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
    if($("#IP")[0] === $("#IP:valid")[0] && $("#port")[0] === $("#port:valid")[0]){
        let ip = $("#IP")[0].value;
        let port = $("#port")[0].value;

        settings.overwriteSetting("ip", ip);
        settings.overwriteSetting("port", port);
        settings.save(() => {
            win.hide();
            win.loadFile("main.html");
        });
    }

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

function setupDropdown(dropdown, item) {
    $(dropdown).children()[1].click();
    for (let i = 0; i < $($(dropdown).children()[2]).children().length; i++){
        if ($($(dropdown).children()[2]).children()[i].innerHTML == item){
            $($(dropdown).children()[2]).children()[i].click();
        }
    }
}

function loadMain(){
    win.hide();
    win.loadFile("main.html");
}


function saveSettings(){
    let webcam = $("#webcamTickbox input").is(":checked");
    let skeleton = $("#skeletonTickbox input").is(":checked");
    let theme = $("#themeSelect .select-selected")[0].innerHTML;
    let architecture = $("#architectureSelect .select-selected")[0].innerHTML;
    let output = $("#outputSelect .select-selected")[0].innerHTML;
    let multi = $("#multiplierSelect .select-selected")[0].innerHTML;
    let quant = $("#quantSelect .select-selected")[0].innerHTML;
    settings.overwriteSetting("webcamEnabled", webcam);
    settings.overwriteSetting("showSkeleton", skeleton);
    settings.overwriteSetting("theme", theme);
    settings.overwritePerformanceSetting("architecture", architecture);
    settings.overwritePerformanceSetting("stride", output);
    settings.overwritePerformanceSetting("multiplier", multi);
    settings.overwritePerformanceSetting("quant", quant);
    settings.save(() =>{
        console.log("Saved!");
        win.hide();
        win.loadFile('main.html');
    });
}