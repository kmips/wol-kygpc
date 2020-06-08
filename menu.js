//This is js for the main process, called from main.js. Renderer process js is in ./HTML/script.js
//Here you have main menu, context menu, and opening call for the copyright window. 
const electron = require('electron')
const { app, Menu, shell, BrowserWindow } = electron
//get our localisation from mydata
const myData = require('./mydata')
//This is the array with information about our collections in an array
const initialState = myData.collections
const transl = myData.otherText[0]
let MyAppVersion = app.getVersion()

let copyrightWindow
let mainMenu
let contextMenu
let mainWindow


//Copyright window

//Copyright & license window to show from the above menu
// var copyrightWindow = null

function openAboutWindow() {
	if (copyrightWindow) {
	  copyrightWindow.focus()
	  return
	}
	
	copyrightWindow = new BrowserWindow({
	  parent: mainWindow, 
	  modal: true, 
	  width: 600,
	  height: 650,
	  title: 'Copyright // Version ' + MyAppVersion,
	  minimizable: false,
	  fullscreenable: false,
	  resizable: false,
	  alwaysOnTop: true,
	  menu: null,
	  show: false,
	  webPreferences: {nodeIntegration: true, enableRemoteModule: true} 
	})
  
  
	copyrightWindow.loadFile('HTML/copy.html')
	
	  copyrightWindow.once('ready-to-show', () => {
		copyrightWindow.show()
		//copyrightWindow.webContents.openDevTools()
	  })
  
	  copyrightWindow.once('blur', () => {copyrightWindow.close()})
  
	copyrightWindow.on('closed', function() {
	  copyrightWindow = null
	})
  }
  //End of copyright window

// Here we have separate menus for Mac (darwin) vs Win&Linux. To gain some consistency across the operating systems, we show the menu only in Mac.
// If Win or Linux, it returns null below, which makes the menu empty, and thus hidden, and all functions are available from context menu. 
// Because of that our menu and contextmenu are basically identical, except that the mainMenu needs an extra level on top, with the main menu elements
// as a submenu underneath that. So set up the core menu, then either dress it with that top Menu level or not and return the objects. 

let coreMenuSection1 = [
	{
		label: transl.menuZoomIn,
		role: "zoomIn"
	},
	{
		label: transl.menuZoomOut, 
		role: "zoomOut"
	},
	{
		label: transl.menuResetZoom, 
		role: "resetZoom"
	},
	{
		type: "separator"
	},
	{
		label: transl.menuCopy,
		accelerator: "CmdOrCtrl+C",
		selector: "copy:"
	},
	{
		label: transl.menuSelectAll,
		role: "selectAll"
	},
	{
		type: "separator"
	},
	{
		label: transl.menutoggleDevTools, 
		role: "toggleDevTools"
	},
	{
	label: transl.menuOpenAboutWin, 
		click() {openAboutWindow()}
	}
]

//Now we have the first part of the menu as the array coreMenuDefinition
//If we have a website prompt and a URL, make it the next part of the menu, 
//but if we don't have either one, then skip on to the final section of the menu
if (!(transl.menuWebsite === '') && !(transl.menuWebURL === '')) {coreMenuSection2 = [
	{
		type: "separator"
	},
	{
	label: transl.menuWebsite,
	click() {shell.openExternal(transl.menuWebURL);}
	},
	{
		type: "separator"
	}
	]} else {coreMenuSection2 = [
	{
		type: "separator"
	}]
}


//This is the last section of the menu 
coreMenuSection3 = [
	{
		label: transl.menuQuit,
		role: "quit"
	},
	{label: transl.thisAppName + " " + MyAppVersion, 
		enabled: false
	}
]
//This operator takes multiple arrays (coreMenuSections) and joins them into one array, coreMenuDefinition
//https://dmitripavlutin.com/operations-on-arrays-javascript/#42-spread-operator
coreMenuDefinition = [...coreMenuSection1, ...coreMenuSection2, ...coreMenuSection3];

//Now take that core definition array that we've assembled and include it in the Menu array wrapper
//but only enable it if we're on macOS (darwin) 
if (process.platform === 'darwin') {
	mainMenu = Menu.buildFromTemplate([
		{label: 'Menu',
		submenu: coreMenuDefinition
		}
	])
} else {
	mainMenu = null
};

//The context menu just takes that core menu
contextMenu = Menu.buildFromTemplate(coreMenuDefinition)
	

//export the relevant elements so that they will be available when the require hits in main.js
module.exports.mainMenu = mainMenu
module.exports.contextMenu = contextMenu
