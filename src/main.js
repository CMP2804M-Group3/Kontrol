const { app, BrowserWindow } = require("electron");

let win;

// Creates the electron window.
function CreateWindow(){
	win = new BrowserWindow({
		width: 400,
		height: 300,
		frame: false,
		transparent: true,
		fullScreenable: false,
		maximizable: false,
		resizable: false,
		fullscreen: false,
		show: false,
		webPreferences: {
			nodeIntegration: true,
			nativeWindowOpen: true
		}
	});
	win.setMenu(null);
	// this should stop the user from fullscreening from double clicking the title bar
	win.setFullScreenable(false);win.setMaximizable(false); win.isResizable(false);

	win.webContents.on('dom-ready', function () {
		win.show();
	});

	win.loadFile("index.html");

	// remove this before complete release
	win.webContents.openDevTools();

	win.on("closed", () => {
		win = null;
	});



}
app.on('ready', () => setTimeout(CreateWindow, 500));
// app.on("ready", CreateWindow);

app.on("window-all-closed", () => {
	app.quit();
});

app.on("activate", () => {
	if (win === null){
		CreateWindow();
	}
});

