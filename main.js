const {app, BrowserWindow, Menu, ipcMain } = require ('electron')
const { screen }  = require ('electron')

//Get the app name from mydata.js - rather than in package.json
const myData = require('./mydata') 
thisAppName = myData.otherText[0].thisAppName
app.setName(thisAppName);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.

//declare a placeholder for our secondary window for later but don't do anything with it
//let mainWindow would normally be declared here but because of how our about window calling order works it's in menu.js
let secWindow

//Import our other javascript
const updater = require('./updater')
const menu = require('./menu')

//Set context menu to the definition in menu.js
contextMenu = menu.contextMenu



// Window state keeper - this and below windowStateKeeper code let the window 
//return at its last known dimensions and location when reopened.
const windowStateKeeper = require('electron-window-state')

function createWindow () {
  //This is a global shared variable we'll use just to differentiate between mainWindow and secWindow on load. 
  //We want to set it to true on createWindow so the window loading will know it is to run the mainWindow 
  //code rather thansecondary window code. 
  global.sharedObj = {loadingMain: true};
	let winState  = windowStateKeeper({
		defaultWidth: 800,
		defaultHeight: 600,
	})
  // Create the browser window.
  mainWindow = new BrowserWindow({
	width: winState.width, 
	height: winState.height, 
	minHeight: 500,
  minWidth: 500,
	x: winState.x, 
  y: winState.y, 
  show: false,
  backgroundColor: 111111,
	webPreferences: {nodeIntegration: true, enableRemoteModule: true} })

  //Attach the windowstatemanager 
  winState.manage(mainWindow)

  // and load the index.html of the app.
  mainWindow.loadFile('HTML/index.htm')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()


  //Listener for right click to call the menu defined in menu.js
  mainWindow.webContents.on('context-menu', e => {
    contextMenu.popup()
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  // Emitted when the window is closed.

  mainWindow.on('close',  () => {
    //Hiding the window makes things look a bit snappier
    mainWindow.hide()
    //send a message to mainWindow to save its data
    mainWindow.focus()
    mainWindow.send('mainWin-closing-save-data')
    //If secWindow has not already been closed - then close it. 
    if (secWindow) {
      secWindow.close();
    }
  })

  //On close clear the variable
  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Create main window
  createWindow()
  
  //This is the menu declared in menu.js. If Win or Lin there will be no main menu. 
  Menu.setApplicationMenu(menu.mainMenu)
 
})

// Check for update after x seconds
setTimeout(updater.check, 2000)

//----------------
//Secondary Window

//Microsoft puts invisible ~7px borders around Win10 windows. Adjust for this so there's not unsightly empty space around
//our windows when we open secondary window. This gets called in the createSecondaryWindow code immediately below.
function adjustForWin10InvisibleBorders () {
  //First check to see if we're on Windows - if not leave this function and go ahead with createSecondaryWindow
  if (process.platform === "win32") {
    //getsystemversion is e.g. 10.0.8484; 'split' gives us that info as an array, e.g. ["10", "0", "8484"]
    completeOSversion = process.getSystemVersion().split(".");
    //'parseInt' gets the first element of the array into a string into a usable integer
    OSversion = parseInt(completeOSversion[0], 10)
    //We know it's Windows, but is it Windows 10?
    if (OSversion >= 10) {
      //Adjust for Windows 10's invisible borders
      winWidth = (screenWidth/2) + 12 
      screenHeight = screenHeight + 7 
      secWinscreenx = screenX + winWidth -19
      screenX = screenX - 7 
    }
  }  
}

//Opening
function createSecondaryWindow () {
  mainWindow.hide()
  //Set this global to false so we know we're loading index.html 
  //in the secondary window, not the primary window
  global.sharedObj = {loadingMain: false};
  // If it's maximized (Windows) or FullScreen (Mac) get it back to a normal window so we can resize it
  if (mainWindow.isMaximized() === true) {mainWindow.unmaximize()}
  if (mainWindow.isFullScreen() === true) {mainWindow.setFullScreen(false)}
  
  
//Get current setup primary screen dimensions
//getAllDisplays is an array of all displays, so array length gives you number of screens
let numScreens = screen.getAllDisplays().length

if (numScreens === 2) {
  
  //workArea gives you the area without the taskbar - regular bounds would get you with the taskbar, so your window goes underneath it
  primaryDisplay = screen.getAllDisplays()[0].workArea
  secondaryDisplay = screen.getAllDisplays()[1].workArea
  //Where is my mouse pointer?
  xpoint = screen.getCursorScreenPoint().x

  if (xpoint > primaryDisplay.x && xpoint < (primaryDisplay.x + primaryDisplay.width)) {
    //then we're on primaryDisplay
    screenWidth = primaryDisplay.width
    screenHeight = primaryDisplay.height
    screenX = primaryDisplay.x
    screenY = primaryDisplay.y
  } else if (xpoint > secondaryDisplay.x && xpoint < (secondaryDisplay.x + secondaryDisplay.width)) {
    //then we're on secondaryDisplay
    screenWidth = secondaryDisplay.width
    screenHeight = secondaryDisplay.height
    screenX = secondaryDisplay.x
    screenY = secondaryDisplay.y
  }
}
//The else below is the normal case, 1 screen, or the really abnormal case, more than 2 screens. 
//For both we just arrange the windows on the primary display. 
  else {
    screenWidth = screen.getAllDisplays()[0].workArea.width
    screenHeight = screen.getAllDisplays()[0].workArea.height
    screenX = screen.getAllDisplays()[0].workArea.x
    screenY = screen.getAllDisplays()[0].workArea.y
}

//Calculate for all other than Win10:
winWidth = screenWidth/2
secWinscreenx = (screenX+(screenWidth/2))
//Now calculate for Win10 using the function above 
adjustForWin10InvisibleBorders() 

  //The above get our dimensions set, now we open the window in the right place on the right screen
  secWindow = new BrowserWindow({
    width: winWidth, 
    height: screenHeight, 
    title: thisAppName,
    minHeight: 430,
    minWidth: 500,
    animate: true,
    x: secWinscreenx,
    y: screenY,
    backgroundColor: 111111, 
    show: false,
    webPreferences: {nodeIntegration: true, enableRemoteModule: true} 
  })



  secWindow.loadFile('HTML/index.htm')

  //This is cleanup - normally the above window definition should work in any situation 
  //but in two-monitor situations the height doesn't get set correctly. 
  //Hoping to clear this up for future release. 
  secWindow.setBounds({height: screenHeight})

  //Now resize and reposition the mainWindow
  mainWindow.setBounds({ x: screenX, y: screenY, width: winWidth, height: screenHeight , animate: false })
  mainWindow.show()

  // Open the DevTools.
  //secWindow.webContents.openDevTools()

  // Right-click listener
  secWindow.webContents.on('context-menu', e => {
    contextMenu.popup()
  })

  secWindow.on('ready-to-show', () => {
    secWindow.show()
  })  
  //The user has two ways they can close secWindow - they can click the X and also our 'close secWindow' button.
  //So we route all the things we have to do on cleanup here to make it happen right.
  //With the showing and hiding just trying to make it snappier. 
  secWindow.on('close', () => {
    if (secWindow) {
      secWindow.hide()
      secWindow.focus()
      secWindow.send('sec-window-is-closed-sec-window-actions') //lastKnownState save
    } 
    
    mainWindow.hide()
    mainWindow.send('sec-window-is-closed-main-window-actions') //toggle button from - to +
    mainWindow.show()

  })
  
  //This is after the window is closed. 
  secWindow.on('closed', () => {
  secWindow = null
  }) 
} 
//End of createSecondaryWindow

// Calling secondary window 
  
//Listening from the command to open secWindow
ipcMain.on('secondary-window', (e, message) => {
  if (message === 'open-sec') {
    createSecondaryWindow ()
  } else if (message === 'close-sec') {
    //this closes the window, which triggers secWindow.on('close' where the cleanup happens
    secWindow.close()
  }
})
//End of secondary Window 
//------------------------


app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') app.quit()
})


// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on('activate', () => {
  if (mainWindow === null) createWindow()
})