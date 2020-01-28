const { app, BrowserWindow } = require("electron");

let win;

// Creates the electron window.
function CreateWindow(){
	win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			nodeIntegration: true
		}
	});

	win.loadFile("ui/index.html");

	// remove this before complete release
	win.webContents.openDevTools();

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