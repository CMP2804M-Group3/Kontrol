const remote = require('electron').remote;
const BrowserWindow = remote.BrowserWindow;
const {ipcMain} = remote;
const $ = require('jquery');
const fs = require('fs');
const kodiController = require('kodi-controller');
const JSONReader = require(__dirname + '/scripts/JSONReader');

let kodi = new kodiController();
let toldUserAboutSetup = false;
let configPath = `${require('os').homedir()}/.Kontrol/config.json`;
let running = true;
let settings = new JSONReader(configPath);


/**
 * Set up the close and minimise buttons
 */
window.onload = () => {
    document.getElementById("closeButton").addEventListener("click",
        function (e) {
            let win = remote.getCurrentWindow();
            win.close();
        }
    );
    document.getElementById("minimise").addEventListener("click",
        function (e) {
            let win = remote.getCurrentWindow();
            win.minimize();
        }
    );

    ipcMain.on("webcamAllow", closePopups);
    ipcMain.on("quit", quitApp);
};


/**
 * Quits the application and all popup windows
 */
function quitApp() {
    let wins = BrowserWindow.getAllWindows();
    for (let i = 0; i < wins.length; i++) {
        let path = wins[i].getURL();
        let file = path.substr(path.lastIndexOf("/") + 1);
        // if ( file !== "popup.html" || file !== "info.html" ) {
        wins[i].close();
        // }
    }
    let win = remote.getCurrentWindow();
    win.close();
}

/**
 * Loads the scanning page if the user has already been informed about how to set up Kodi
 */
function startScan() {
    if (toldUserAboutSetup) {
        loadContent("pages/loading.html");
    } else {
        loadContent("pages/enableRemoteControl.html");
    }
}

/**
 * Closes the current window
 */
function closePopups() {
    let wins = BrowserWindow.getAllWindows();
    for (let i = 0; i < wins.length; i++) {
        let path = wins[i].getURL();
        let file = path.substr(path.lastIndexOf("/") + 1);
        if (file === "popup.html" || file === "info.html") {
            wins[i].close();
        }
    }
}

/**
 * Toggles between light and dark mode
 */
function toggleNightMode() {
    if (document.documentElement.getAttribute("data-theme") === 'light') {
        document.documentElement.setAttribute('data-theme', 'dark');
        settings.overwriteSetting("theme", "dark");
        settings.save();
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        settings.overwriteSetting("theme", "light");
        settings.save();
    }
}


/**
 * Gets the IP and PORT from settings, if not set it returns false
 * @returns {boolean|*[]}
 */
function gotIPandPort() {
    let ip = settings.readSetting("ip");
    let port = settings.readSetting("port");
    if (ip !== "" && port !== "") {
        return [ip, port]
    } else {
        return false
    }
}

/**
 * Loads a page, runs its scripts and then calls the callback
 * @param url The page to load
 * @param callback The function to run once the content is loaded
 */
function loadContent(url, callback) {
    // resources/app/
    let file = __dirname + "/" + src;
    running = false;
    let parent = document.getElementById('parent');
    let old = document.getElementById('inserted');

    fs.readFile(file, "utf8", (err, data) => { // Read the new HTML
        if (err) {
            console.log(err);
        } else {
            old.parentNode.removeChild(old); // Remove the old inserted data
            parent.insertAdjacentHTML("beforeend", data); // Insert the new one
            try {
                eval($("#inserted script")[0]["text"]); // Run the inserted JavaScript
            } catch (e) {
                console.log(e); // If it errored catch it so it doesn't crash the entire program
            }
            if (callback) { // If a callback is supplied that call it after 500ms to give the DOM time to update
                setTimeout(callback, 500);
            }
        }
    });
}

/**
 * Puses to an array of a fixed size
 * @param array The array
 * @param item The item to push
 * @param length The length of the array
 */
function setItem(array, item, length) {
    array.unshift(item) > length ? array.pop() : null
}


function readIP() {
    let win = remote.getCurrentWindow();
    if ($("#IP")[0] === $("#IP:valid")[0] && $("#port")[0] === $(
        "#port:valid")[0]) {
        let ip = $("#IP")[0].value;
        let port = $("#port")[0].value;
        settings.overwriteSetting("ip", ip);
        settings.overwriteSetting("port", port);
        settings.addKodi(ip, port);
        settings.save(() => {
            win.hide();
            win.loadURL(`file://${__dirname}/main.html`);

        });
    }
}

/**
 * Select a kodi instance from the scan list
 */
function selectFromScan() {
    let win = remote.getCurrentWindow();
    let ip = $("#kodiList li.selected h2").text();
    let port = 8080;
    settings.overwriteSetting("ip", ip);
    settings.overwriteSetting("port", port);
    settings.addKodi(ip, port);
    settings.save(() => {
        win.hide();
        win.loadURL(`file://${__dirname}/main.html`);
    });
}

/**
 * Connection tabtab setup code
 */
function connectionSetup() {
    var parent = document.getElementById('kodiConnectList');
    let kodis = settings.readKodis();
    $(parent).empty();
    parent.insertAdjacentHTML("afterbegin", "<p>Past Connections:</p>");
    if (connection) {
        $("#currentConnection")[0].innerHTML = "Connected!";
        parent.insertAdjacentHTML("afterbegin",
            `<li tabindex="0" class = "connectedConnection" >
            <div style="display: flex; align-items: center;"><img class = "wifi" src="images/wifi.svg" draggable="false"><h2>${kodi.url.split("http://")[1].split(":")[0]
            }:${kodi.url.split("http://")[1].split(":")[1].split("/")[0]}</h2></div>
            <div class = "connectionControls">            
                <button class="whiteButton" onclick = 'dissconnect()'">Disconnect</button>
            </div>
        </li>`);
    } else {
        $("#currentConnection")[0].innerHTML = "You are not connected to a Kodi!";
    }
    if (kodis.length === 0) {
        $(parent).css("display", "none");
    }
    kodis.reverse().forEach(kodi => {
        parent.insertAdjacentHTML("beforeend",
            `<li tabindex="0" >
            <div style="display: flex; align-items: center;"><img class = "wifi" src="images/wifi.svg" draggable="false"><h2>${kodi.ip}:${kodi.port}</h2></div>
            <div class = "connectionControls">
                <label class="tickbox"><p style="margin-left: 0px;">Remember this connection</p>
                    <input type="checkbox" checked="checked">
                    <span class="checkmark"></span>
                </label>                    
                <button class="whiteButton" onclick = 'toggleConnect(this)'">Connect</button>
            </div>
        </li>`);
    });
    $("#kodiConnectList li").on("click", function () {
        $("#kodiConnectList .selectedConnection").toggleClass("selectedConnection");
        $(this).toggleClass("selectedConnection");
    });

}

/**
 * Setup a dropdown and choose an item
 * @param dropdown A jquery selector
 * @param item The item to
 */
function setupDropdown(dropdown, item) {
    $(dropdown).children()[1].click();
    for (let i = 0; i < $($(dropdown).children()[2]).children().length; i++) {
        if ($($(dropdown).children()[2]).children()[i].innerHTML === item) {
            $($(dropdown).children()[2]).children()[i].click();
        }
    }
}

/**
 * Load the main page
 */
function loadMain() {
    win.hide();
    win.loadURL(`file://${__dirname}/main.html`);
}

/**
 * Save the settings
 */
function saveSettings() {
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

    settings.save(() => {
        console.log("Saved!");
        win.hide();
        win.loadURL(`file://${__dirname}/main.html`);
    });
}

function saveControlSettings() {
    function getNotUnique(array) {
        let map = new Map();
        array.forEach(a => {
            if (a.innerHTML !== "Unset") {
                map.set(a.innerHTML, (map.get(a.innerHTML) || 0) + 1)
            }
        });
        return array.filter(a => map.get(a.innerHTML) > 1);
    }

    let duplicates = getNotUnique($("#controlsList li .select-selected").toArray());
    if (duplicates.length === 0) {
        let play = $("#playSelect .select-selected")[0].innerHTML;
        let rewind = $("#rewindSelect .select-selected")[0].innerHTML;
        let fastForward = $("#forwardSelect .select-selected")[0].innerHTML;
        let previous = $("#previousSelect .select-selected")[0].innerHTML;
        let next = $("#nextSelect .select-selected")[0].innerHTML;
        let volDown = $("#volDownSelect .select-selected")[0].innerHTML;
        let volUp = $("#volUpSelect .select-selected")[0].innerHTML;
        let mute = $("#muteSelect .select-selected")[0].innerHTML;

        settings.overwriteAction("play", play);
        settings.overwriteAction("rewind", rewind);
        settings.overwriteAction("fastForward", fastForward);
        settings.overwriteAction("previous", previous);
        settings.overwriteAction("next", next);
        settings.overwriteAction("volumeDown", volDown);
        settings.overwriteAction("volumeUp", volUp);
        settings.overwriteAction("mute", mute);
        settings.save(() => {
            console.log("Save control settings");
            win.hide();
            win.loadURL(`file://${__dirname}/main.html`);
        });
    }




}


function toggleConnect(device) {
    showLoading();
    details = device.parentElement.parentElement.firstElementChild.children[1]
        .innerText.split(":");
    kodi = new kodiController(details[0], details[1]);
    kodi.pingKodi(kodi.url).then((data) => {
        connection = data;
        if (!connection) {
            showWarningPopup("Connection Failed",
                "Cannot connect, make sure that Kodi is turned on.");
        } else {
            hideLoading();
            connectionSetup();
        }
    });
    ipcMain.on('hide_loading', () => {
        hideLoading();
    });
}

function showLoading() {
    $("#loading").css("display", "flex");
}

function hideLoading() {
    $("#loading").css("display", "none");
}

function showWarningPopup(title, message, callback) {
    settingsWin = new BrowserWindow({
        width: 350,
        height: 180,
        frame: false,
        icon: `file://${__dirname}/icons/win/icon.ico`,
        transparent: true,
        fullScreenable: false,
        maximizable: false,
        resizable: false,
        fullscreen: false,
        show: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    settingsWin.loadURL(`file://${__dirname}/pages/info.html`);
    $("html").css("pointer-events", "none");
    settingsWin.setAlwaysOnTop(true);
    ipcMain.on('Am_I_Ready', () => {
        settingsWin.webContents.send('store-data', [title, message]);
    });
    settingsWin.on("closed", () => {
        settingsWin = null;
        $("html").css("pointer-events", "all");
        if (callback) {
            callback();
        }
    });
}


function dissconnect() {
    showLoading();
    kodi = new kodiController("");
    connection = false;
    setTimeout(hideLoading, 200);
    connectionSetup();
}

function saveConnections() {
    let parent = document.getElementById('kodiConnectList');
    let kodis = settings.readKodis();
    settings.emptyKodis();

    for (let index = 1; index < parent.children.length; index++) {
        const element = parent.children[index];
        let checked = $($(element.children[1].children[0]).children()[1]).is(":checked");
        if (checked) {
            settings.addKodi(element.children[0].innerText.split(":")[0], element.children[0].innerText.split(":")[1]);
        }
    }
    settings.save(() => {
        connectionSetup();
    });
}

function changeTab(evt, tab) {
    // Declare all variables
    var i, tabcontent, tablinks;

    // Get all elements with class="tabcontent" and hide them
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }

    // Get all elements with class="tablinks" and remove the class "active"
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
        tablinks[i].className = tablinks[i].className.replace(" open", "");
    }

    // Show the current tab, and add an "active" class to the button that opened the tab
    document.getElementById(tab).style.display = "block";
    evt.currentTarget.className += " active open";
}

function setupControlTab() {
    changeTab(event, 'Controls');
    setupDropdown("#playSelect", settings.getGestureFromAction("play", "player"));
    setupDropdown("#rewindSelect", settings.getGestureFromAction("rewind", "player"));
    setupDropdown("#forwardSelect", settings.getGestureFromAction("fastForward", "player"));
    setupDropdown("#previousSelect", settings.getGestureFromAction("previous", "player"));
    setupDropdown("#nextSelect", settings.getGestureFromAction("next", "player"));
    setupDropdown("#volDownSelect", settings.getGestureFromAction("volumeDown", "player"));
    setupDropdown("#volUpSelect", settings.getGestureFromAction("volumeUp", "player"));
    setupDropdown("#muteSelect", settings.getGestureFromAction("mute", "player"));


}


ipcMain.on('connect', closePopups);
ipcMain.on('quit', quitApp);
module.exports = setupDropdown;
