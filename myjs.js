//This is js for the main process, called from main.js. Renderer process js is in ./HTML/script.js
const electron = require('electron')
const {app, BrowserWindow, Menu, MenuItem} = electron
const {remote, shell} = require('electron')
const updater = require('./updater')
//Get the app name to use accents here - rather than in package.json
app.setName("Kàddug Yàlla Gi");

let mainMenu

// Create app menu - alt with other things by cg
// Here we have separate menus for Mac (darwin) vs Win&Linux. To gain some consistency across the operating systems, we show the menu only in Mac.
// If Win or Linux, it returns null below, which makes the menu empty, and thus hidden, and all functions are available from context menu. 
if (process.platform === 'darwin') {
mainMenu = Menu.buildFromTemplate([
	{label: 'Menu',
	submenu: [
		{
			label: "Zoom +",
			role: "zoomIn"
		},
		{
			label: "Zoom -", 
			role: "zoomOut"
		},
		{
			label: "Zoom 100%", 
			role: "resetZoom"
		},
		{
			type: "separator"
		},
		{
			label: "Copier",
			accelerator: "CmdOrCtrl+C",
			selector: "copy:"
		},
		{
			label: "Sélectionner tout",
			role: "selectAll"
		},
		{
			type: "separator"
		},
		{
			label: "Outils de développement", 
			role: "toggleDevTools"
		},
		{
		label: 'Copyright && license', 
			click() {openAboutWindow()}
		},
		{	label: "Version",
			role: "about"
		},
		{
			type: "separator"
		},
		{
		label: "Applis mobiles",
		submenu: [
			{
			label: "Kàddug Yàlla Gi",
			click() {shell.openExternal("https://sng.al/appli");}
			},
			{
				label: "Kàddug Yàlla Gi en écriture arabe",
				click() {shell.openExternal("https://sng.al/appli#as");}
			},
			{
				label: "Ab Jukki ci Kàddug Yàlla Gi",
				click() {shell.openExternal("https://sng.al/chrono");}
			}, 
			{
				label: "Woyleen Boroom Bi",
				click() {shell.openExternal("https://sng.al/woy");}
			}
		]
		},
		{
			type: "separator"
		},
		{
			label: "Quitter",
			role: "quit"
		}
	]}
])
} else {
	mainMenu = null
};

let myContexMenu = {
	menu: () => [
		{
			label: "Copier",
			accelerator: "CmdOrCtrl+C",
			selector: "copy:"
		},
		{
			label: "Sélectionner tout",
			role: "selectAll"
		},
		{
			type: "separator"
		},
		{
			label: "Zoom +",
			role: "zoomIn"
		},
		{
			label: "Zoom -",
			role: "zoomOut"
		},
		{
			label: "Zoom 100%",
			role: "resetZoom"
		},
		{
			type: "separator"
		},
		{
			label: "Outils de développement", 
			role: "toggleDevTools"
		},
		{
			label: 'Copyright && license', 
			click() {openAboutWindow()}
		},
		{
			type: "separator"
		},
		{
			label: "Applis mobiles",
			submenu: [
				{
				label: "Kàddug Yàlla Gi",
				click() {shell.openExternal("https://sng.al/appli");}
				},
				{
					label: "Kàddug Yàlla Gi en écriture arabe",
					click() {shell.openExternal("https://sng.al/appli#as");}
				},
				{
					label: "Ab Jukki ci Kàddug Yàlla Gi",
					click() {shell.openExternal("https://sng.al/chrono");}
				}, 
				{
					label: "Woyleen Boroom Bi",
					click() {shell.openExternal("https://sng.al/woy");}
				}
			]
		},
		{
			type: "separator"
		},
		{
			label: "Quitter",
			role: "quit"
		}
	]
}

//Copyright & license window to show from the above menu
var copyrightWindow = null

function openAboutWindow() {
  if (copyrightWindow) {
    copyrightWindow.focus()
    return
  }

  copyrightWindow = new BrowserWindow({
	//normally we would like to have the window be modal, but I am having trouble referencing main.js' mainWindow from myjs.js -
	//so for now comment this out. 
    // parent: remote.getCurrentWindow(),
	//  	modal: true,
    resizable: true,
    width: 700,
	height: 500,
	title: 'Copyright',
    minimizable: true,
	fullscreenable: false,
	menu: null,
	show: false
  })



  copyrightWindow.loadURL('file://' + __dirname + '/HTML/copy.html')


	copyrightWindow.once('ready-to-show', () => {
	  copyrightWindow.show()
	})


  copyrightWindow.on('closed', function() {
    copyrightWindow = null
  })
}



//export the relevant elements so that they will be available when the require hits in main.js
module.exports.mainMenu = mainMenu;
module.exports.openAboutWindow = openAboutWindow
module.exports.myContexMenu = myContexMenu