const { app, BrowserWindow } = require("electron");

let win;

// Creates the electron window.
function CreateWindow(){
	win = new BrowserWindow({
		width: 400,
		height: 300,
		frame: false,
		transparent: true,
		resizable: false,
		fullscreen: false,
		show: false,
		webPreferences: {
			nodeIntegration: true
		}
	});
	win.setMenu(null);

	win.webContents.on('dom-ready', function () {
		win.show();
	});

	win.loadFile("ui/index.html");

	// remove this before complete release
	// win.webContents.openDevTools();

	win.on("closed", () => {
		win = null;
	});
}

app.on("ready", CreateWindow);

app.on("window-all-closed", () => {
	app.quit();
});

app.on("activate", () => {
	if (win === null){
		CreateWindow();
	}
})