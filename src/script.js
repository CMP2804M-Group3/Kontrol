const remote = require( 'electron' ).remote;
const { ipcMain } = remote;
const BrowserWindow = remote.BrowserWindow;
const $ = require( 'jquery' );
const fs = require( 'fs' );
const kodiController = require( 'kodi-controller' );
let kodi = new kodiController();
let kodiEnabled = false;
let configPath = `${require('os').homedir()}/.Kontrol/config.json`;
let running = true;
let settings;
let ip = "";
class JSONReader {
    constructor( src, callback ) {
        this.src = src;
        let json;
        fs.readFile( this.src, "utf8", ( err, data ) => {
            if (err) {
                fs.mkdir(this.src.substr(0, this.src.length - "config.json".length,), () =>{
                    fs.writeFile(this.src, `{"general": {"ip": "","port": "","theme": "Light Blue","webcamEnabled": false,"showSkeleton": true},"performance": {"architecture": "MobileNetV1","stride": "16","multiplier": "0.5","quant": "2"},"kodis": []}`, function (err) {
                        if (err) throw err;
                        console.log('File is created successfully.');
                        let win = remote.getCurrentWindow();
                        win.reload();
                      });  
                });
                
            }
            else{ 
                json = data; 
                this.JSONData = JSON.parse( json );
                if (callback){ callback(); }
            }
        });
        
    }
    save( callback ) {
        var jsonContent = JSON.stringify( this.JSONData );
        fs.writeFile( this.src, jsonContent, 'utf8', callback );
    }
    getActionFromGesture( gestureName, status ) {
        for ( let i in this.JSONData.gesture_bindings ) {
            let binding = this.JSONData.gesture_bindings[ i ];
            if ( binding.gesture === gestureName && binding.status ===
                status ) {
                return binding;
            }
        }
        console.error( "Error, no command found for this gesture" );
    }
    overwriteSetting( settingName, value ) {
        this.JSONData.general[ settingName ] = value;
    }
    overwritePerformanceSetting( settingName, value ) {
        this.JSONData.performance[ settingName ] = value;
    }
    addKodi( ip, port ) {
        let exists = this.JSONData.kodis.find( ( k ) => {
            return ( k.ip === ip && k.port === port )
        } )
        console.log( exists );
        if ( exists === undefined ) {
            this.JSONData.kodis.push( {
                'ip': ip,
                'port': port
            } );
        }
    }
    readSetting( settingName ) {
        return this.JSONData.general[ settingName ];
    }
    readPerformanceSetting( settingName ) {
        return this.JSONData.performance[ settingName ];
    }
    readKodis() {
        return this.JSONData.kodis;
    }
    emptyKodis(){
        this.JSONData.kodis = [];
    }
    overwriteAction( gestureName, status, newAction ) {
        let newBinding = {
            "gesture": gestureName,
            "status": status,
            "action": newAction
        };
        for ( let i in this.JSONData.gesture_bindings ) {
            let binding = this.JSONData.gesture_bindings[ i ];
            if ( binding.gesture === gestureName && binding.status ===
                status ) {
                this.JSONData.gesture_bindings[ i ] = newBinding;
                console.log( this.JSONData.gesture_bindings[ i ] );
            }
        }
    }
}

function quitApp() {
    let wins = BrowserWindow.getAllWindows();
    for ( let i = 0; i < wins.length; i++ ) {
        let path = wins[ i ].getURL();
        let file = path.substr( path.lastIndexOf( "/" ) + 1 );
        if ( file !== "popup.html" ) {
            wins[ i ].close();
        }
    }
    let win = remote.getCurrentWindow();
    win.close();
}

function startScan() {
    if ( kodiEnabled ) {
        loadContent( "pages/loading.html" );
    } else {
        loadContent( "pages/enableRemoteControl.html" );
    }
}

function webcamAllow() {
    
    let win = remote.getCurrentWindow();
    win.close();

}

function toggleNightMode() {
    if ( document.documentElement.getAttribute( "data-theme" ) === 'light' ) {
        document.documentElement.setAttribute( 'data-theme', 'dark' );
        settings.overwriteSetting( "theme", "dark" );
        settings.save();
    } else {
        document.documentElement.setAttribute( 'data-theme', 'light' );
        settings.overwriteSetting( "theme", "light" );
        settings.save();
    }
}
window.onload = () => {
    document.getElementById( "closeButton" ).addEventListener( "click",
        function( e ) {
            let win = remote.getCurrentWindow();
            win.close();
        } );
    document.getElementById( "minimise" ).addEventListener( "click",
        function( e ) {
            let win = remote.getCurrentWindow();
            win.minimize();
        } );
};

function gotIPandPort() {
    ip = settings.readSetting( "ip" );
    let port = settings.readSetting( "port" );
    if ( ip !== "" && port !== "" ) {
        return [ ip, port ]
    } else {
        return false
    }
}

function loadContent( url, callback ) {
    // var win = remote.getCurrentWindow();
    // window.location = ;
    let file = `resources/app/src/${url}`;
    console.log( file );
    let parent = document.getElementById( 'parent' );
    let old = document.getElementById( 'inserted' );
    running = false;
    fs.readFile( file, "utf8", ( err, data ) => {
        if ( err ) { console.log(err); }
        else{
            old.parentNode.removeChild( old );
            parent.insertAdjacentHTML( "beforeend", data );
            try {
                eval( $( "#inserted script" )[ 0 ][ "text" ] );
            } catch ( e ) {
                console.log( e );
            }
            if ( callback ) {
                setTimeout( callback, 500 );
                // callback();
            }
        }
        
    } );
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

function readIP() {
    let win = remote.getCurrentWindow();
    if ( $( "#IP" )[ 0 ] === $( "#IP:valid" )[ 0 ] && $( "#port" )[ 0 ] === $(
            "#port:valid" )[ 0 ] ) {
        let ip = $( "#IP" )[ 0 ].value;
        let port = $( "#port" )[ 0 ].value;
        settings.overwriteSetting( "ip", ip );
        settings.overwriteSetting( "port", port );
        settings.addKodi( ip, port );
        settings.save( () => {
            win.hide();
            win.loadURL(`file://${__dirname}/main.html`);

        } );
    }
}

function selectFromScan() {
    let win = remote.getCurrentWindow();
    let ip = $( "#kodiList li.selected h2" ).text();
    let port = 8080;
    settings.overwriteSetting( "ip", ip );
    settings.overwriteSetting( "port", port );
    settings.addKodi( ip, port );
    settings.save( () => {
        win.hide();
        win.loadURL(`file://${__dirname}/main.html`);    } );
}
function connectionSetup(){
    var parent = document.getElementById('kodiConnectList');
    let kodis = settings.readKodis();
    $(parent).empty()
    parent.insertAdjacentHTML("afterbegin", "<p>Past Connections:</p>")
    if(connection){
        $("#currentConnection")[0].innerHTML = "Connected!";
        parent.insertAdjacentHTML("afterbegin",
                            `<li tabindex="0" class = "connectedConnection" >
            <div style="display: flex; align-items: center;"><img class = "wifi" src="images/wifi.svg" draggable="false"><h2>${kodi.url.split("http://")[1].split(":")[0]
            }:${kodi.url.split("http://")[1].split(":")[1].split("/")[0]}</h2></div>
            <div class = "connectionControls">            
                <button class="whiteButton" onclick = 'dissconnect()'">Disconnect</button>
            </div>
        </li>`);
    }else{
        $("#currentConnection")[0].innerHTML = "You are not connected to a Kodi!";
    }
    if (kodis.length === 0){$(parent).css("display", "none");}
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
function setupDropdown( dropdown, item ) {
    $( dropdown ).children()[ 1 ].click();
    for ( let i = 0; i < $( $( dropdown ).children()[ 2 ] ).children().length; i++ ) {
        if ( $( $( dropdown ).children()[ 2 ] ).children()[ i ].innerHTML ==
            item ) {
            $( $( dropdown ).children()[ 2 ] ).children()[ i ].click();
        }
    }
}

function loadMain() {
    win.hide();
    win.loadURL(`file://${__dirname}/main.html`);}

function saveSettings() {
    let webcam = $( "#webcamTickbox input" ).is( ":checked" );
    let skeleton = $( "#skeletonTickbox input" ).is( ":checked" );
    let theme = $( "#themeSelect .select-selected" )[ 0 ].innerHTML;
    let architecture = $( "#architectureSelect .select-selected" )[ 0 ].innerHTML;
    let output = $( "#outputSelect .select-selected" )[ 0 ].innerHTML;
    let multi = $( "#multiplierSelect .select-selected" )[ 0 ].innerHTML;
    let quant = $( "#quantSelect .select-selected" )[ 0 ].innerHTML;
    settings.overwriteSetting( "webcamEnabled", webcam );
    settings.overwriteSetting( "showSkeleton", skeleton );
    settings.overwriteSetting( "theme", theme );
    settings.overwritePerformanceSetting( "architecture", architecture );
    settings.overwritePerformanceSetting( "stride", output );
    settings.overwritePerformanceSetting( "multiplier", multi );
    settings.overwritePerformanceSetting( "quant", quant );
    settings.save( () => {
        console.log( "Saved!" );
        win.hide();
        win.loadURL(`file://${__dirname}/main.html`);    } );
}

function toggleConnect( device ) {
    showLoading();
    details = device.parentElement.parentElement.firstElementChild.children[ 1 ]
        .innerText.split( ":" )
    kodi = new kodiController( details[ 0 ], details[ 1 ] );
    kodi.pingKodi( kodi.url ).then( ( data ) => {
        connection = data;
        if ( !connection ) {
            showWarningPopup( "Connection Failed",
                "Cannot connect, make sure that Kodi is turned on.");
        }else{
            hideLoading();
            connectionSetup();
        }
    } );
    ipcMain.on( 'hide_loading', () => {
        hideLoading();
    } );
}

function showLoading() {
    $( "#loading" ).css( "display", "flex" );
}

function hideLoading() {
    $( "#loading" ).css( "display", "none" );
}

function showWarningPopup( title, message, callback ) {
    settingsWin = new BrowserWindow( {
        width: 350,
        height: 180,
        frame: false,
        transparent: true,
        icon: `file://${__dirname}/icons/png/48x48.png`,
        fullScreenable: false,
        maximizable: false,
        resizable: false,
        fullscreen: false,
        show: true,
        webPreferences: {
			nodeIntegration: true
        }
    } );
    settingsWin.loadURL(`file://${__dirname}/pages/info.html`);
    $( "html" ).css( "pointer-events", "none" );
    settingsWin.setAlwaysOnTop( true );
    ipcMain.on( 'Am_I_Ready', () => {
        settingsWin.webContents.send( 'store-data', [ title, message ] );
    } );
    settingsWin.on( "closed", () => {
        settingsWin = null;
        $( "html" ).css( "pointer-events", "all" );
        if ( callback ) {
            callback();
        }
    } );
}


function dissconnect(){
    showLoading();
    kodi = new kodiController("");
    connection = false;
    setTimeout(hideLoading, 200);
    connectionSetup();
}

function saveConnections(){
    let parent = document.getElementById( 'kodiConnectList' );
    let kodis = settings.readKodis();
    settings.emptyKodis();
    
    for (let index = 1; index < parent.children.length; index++) {
        const element = parent.children[index];
        let checked = $($(element.children[1].children[0]).children()[1]).is( ":checked");
        if ( checked ){
            settings.addKodi(element.children[0].innerText.split(":")[0], element.children[0].innerText.split(":")[1]);
        }
    }
    settings.save(() => {
        connectionSetup();
    });
}


ipcMain.on('connect', webcamAllow);
ipcMain.on('quit', quitApp);
