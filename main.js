const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const { screen } = require("electron");

//Get the app name from mydata.js - rather than in package.json
const myData = require("./mydata");
const appText = myData.otherText;
const transl = myData.myTranslations;

//Set up some info about the app
thisAppName = myData.otherText.thisAppName;
app.setName(thisAppName);
let MyAppVersion = app.getVersion();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
//We also need a few more variables to be available everywhere.
let secWindow;
let copyrightWindow;
let mainMenu;
let contextMenu;
let searchWindow;

// Window state keeper - this and below windowStateKeeper code let the window
//return at its last known dimensions and location when reopened.
const windowStateKeeper = require("electron-window-state");

//------------------------
//mainWindow code
function createWindow() {
  //This is a global shared variable we'll use just to differentiate between mainWindow and secWindow on load.
  //We want to set it to true on createWindow so the window loading will know it is to run the mainWindow
  //code rather thansecondary window code.
  global.sharedObj = { loadingMain: true };
  let winState = windowStateKeeper({
    defaultWidth: 800,
    defaultHeight: 600,
  });
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: winState.width,
    height: winState.height,
    minHeight: 550,
    minWidth: 500,
    x: winState.x,
    y: winState.y,
    show: false,
    backgroundColor: 111111,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
  });

  //Attach the windowstatemanager
  winState.manage(mainWindow);

  // and load the index.html of the app.
  mainWindow.loadFile("HTML/index.htm");

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  //When ready, show
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });

  // Emitted when the window is closed.
  mainWindow.on("close", () => {
    //Hiding the window makes things look a bit snappier
    mainWindow.hide();
    //send a message to mainWindow to save its data
    mainWindow.focus();
    mainWindow.send("mainWin-closing-save-data");
    //If secWindow has not already been closed - then close it.
    if (secWindow) {
      secWindow.close();
    }
    if (searchWindow) {
      searchWindow.close();
    }
  });

  //On close clear the variable
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}
//End of mainWindow
//------------------------

//------------------------
//Copyright & license window to show from the menu

function openAboutWindow() {
  if (copyrightWindow) {
    copyrightWindow.focus();
    return;
  }

  copyrightWindow = new BrowserWindow({
    parent: mainWindow,
    modal: true,
    width: 600,
    height: 650,
    title: "Copyright // Version " + MyAppVersion,
    minimizable: false,
    fullscreenable: false,
    resizable: false,
    alwaysOnTop: true,
    menu: null,
    show: false,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
  });

  copyrightWindow.loadFile("HTML/copy.html");

  copyrightWindow.once("ready-to-show", () => {
    copyrightWindow.show();
    // copyrightWindow.webContents.openDevTools();
  });

  copyrightWindow.once("blur", () => {
    // copyrightWindow.close();
  });

  copyrightWindow.on("closed", function () {
    copyrightWindow = null;
  });
}
//End of copyright window
//------------------------

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  // Create main window
  createWindow();
  //createMenus();
});

//------------------------
//Menus
//For multilingual to work correctly we have to put our menus in separately
//from our normal window opening process, a bit unusually for Electron.
//This enables us to return to it however when we change languages.

//This calls the initial menu load after the variable has been loaded from localStorage
//Then for the refreshes the menu calls createMenus on click
ipcMain.on("set-display-lang", (e, displayLang) => {
  //Create Menus with the displayLang coming from the mainWindow
  createMenus(displayLang);
});

//Wait for mainWindow to signal that the displayLang is set before checking for update.
ipcMain.on("check-for-update", (e, displayLang) => {
  const updater = require("./updater");
  setTimeout(updater.check, 5000, displayLang);
});
//In this app we have one menu that displays both from menu bar and as context menu.
//Here we build the menu in pieces depending on which we need for this app and then wrap it in
//such a way that we can use it in both places.

//section one is always created.
function createMenus(displayLang) {
  let coreMenuSection1 = [
    {
      label: transl.menuZoomIn[displayLang],
      role: "zoomIn",
      accelerator: "CmdOrCtrl+Plus",
    },
    {
      label: transl.menuZoomOut[displayLang],
      role: "zoomOut",
      accelerator: "CmdOrCtrl+-",
    },
    {
      label: transl.menuResetZoom[displayLang],
      role: "resetZoom",
      accelerator: "CmdOrCtrl+0",
    },
    {
      type: "separator",
    },
    {
      label: transl.menuCopy[displayLang],
      accelerator: "CmdOrCtrl+C",
      selector: "copy:",
    },
    {
      label: transl.menuSelectAll[displayLang],
      role: "selectAll",
      accelerator: "CmdOrCtrl+A",
    },
    {
      type: "separator",
    },
    {
      label: transl.menutoggleDevTools[displayLang],
      role: "toggleDevTools",
    },
    {
      label: transl.menuOpenAboutWin[displayLang],
      click() {
        openAboutWindow();
      },
    },
  ];

  //Language switcher submenu
  //Section two is only created if there is more than one language name defined in mydata.js.
  //Otherwise it is just empty, so takes no space.
  var coreMenuSection2 = [];
  //If the length is not equal to 1 that means there are multiple languages, so put in lang switcher
  if (!(Object.entries(transl.langName).length === 1)) {
    var langMenuDefinition = [];
    for (let [key, value] of Object.entries(transl.langName)) {
      miniLangMenuDefinition = {
        label: `${value}`,
        click() {
          createMenus(`${key}`);
          //Send a message to the renderer to refresh the language on the sidebar
          mainWindow.send("language-switch", `${key}`);
        },
      };
      langMenuDefinition.push(miniLangMenuDefinition);
    }

    coreMenuSection2 = [
      {
        label: transl.menuLangSwitch[displayLang],
        submenu: langMenuDefinition,
      },
    ];
  }

  //If we have a website prompt and a URL, make it the next part of the menu,
  //but if we don't have either one, then skip on to the final section of the menu
  if (
    !(transl.menuWebsite[displayLang] === "") &&
    !(appText.menuWebURL === "")
  ) {
    coreMenuSection3 = [
      {
        type: "separator",
      },
      {
        label: transl.menuWebsite[displayLang],
        click() {
          shell.openExternal(appText.menuWebURL);
        },
      },
      {
        type: "separator",
      },
    ];
  } else {
    coreMenuSection3 = [
      {
        type: "separator",
      },
    ];
  }

  //This is the last section of the menu, always created.
  coreMenuSection4 = [
    {
      label: transl.menuQuit[displayLang],
      role: "quit",
      accelerator: "CmdOrCtrl+Q",
    },
    { label: appText.thisAppName + " " + MyAppVersion, enabled: false },
  ];

  //This operator takes multiple arrays (coreMenuSections) and joins them into one array, coreMenuDefinition
  //https://dmitripavlutin.com/operations-on-arrays-javascript/#42-spread-operator
  coreMenuDefinition = [
    ...coreMenuSection1,
    ...coreMenuSection2,
    ...coreMenuSection3,
    ...coreMenuSection4,
  ];

  // Here we have separate menus for Mac (darwin) vs Win&Linux. To gain some consistency across the operating systems, we show the menu only in Mac.
  // If Win or Linux, it returns null below, which makes the menu empty, and thus hidden, and all functions are available from context menu.
  // Because of that our menu and contextmenu are basically identical, except that the mainMenu needs an extra level on top, with the main menu elements
  // as a submenu underneath that. So set up the core menu, then either dress it with that top Menu level or not and return the objects.

  //Now take that core definition array that we've assembled and include it in the Menu array wrapper
  //but only enable it if we're on macOS (darwin)
  if (process.platform === "darwin") {
    mainMenu = Menu.buildFromTemplate([
      { label: "Menu", submenu: coreMenuDefinition },
    ]);
  } else {
    mainMenu = null;
  }

  //The context menu just takes that core menu
  contextMenu = Menu.buildFromTemplate(coreMenuDefinition);

  mainWindow.webContents.on("context-menu", (e) => {
    contextMenu.popup();
  });

  //This is the menu declared in menu.js. If Win or Lin there will be no main menu.
  Menu.setApplicationMenu(mainMenu);

  mainWindow.send("change-lang", displayLang);
}
//End of createMenus
//------------------------

//When a language change is triggered via a click() calling createMenus() with the new language, it sends a message to
//the renderer telling it to change localStorage to the desired lanugage for future loads. It then bounces a message
//back here to tell main process to reload the pages.
ipcMain.on("lang-changed-reload-pages", (e) => {
  mainWindow.hide();
  global.sharedObj = { loadingMain: true };
  mainWindow.webContents.reload();
  mainWindow.show();
});

//----------------
//Secondary Window

//Microsoft puts invisible ~7px borders around Win10 windows. Adjust for this so there's not unsightly empty space around
//our windows when we open secondary window. This gets called in the createSecondaryWindow code immediately below.
function adjustForWin10InvisibleBorders() {
  //First check to see if we're on Windows - if not leave this function and go ahead with createSecondaryWindow
  if (process.platform === "win32") {
    //getsystemversion is e.g. 10.0.8484; 'split' gives us that info as an array, e.g. ["10", "0", "8484"]
    completeOSversion = process.getSystemVersion().split(".");
    //'parseInt' gets the first element of the array ([0]) into a string into a usable integer
    OSversion = parseInt(completeOSversion[0], 10);
    //We know it's Windows, but is it Windows 10?
    if (OSversion >= 10) {
      //Adjust for Windows 10's invisible borders
      winWidth = screenWidth / 2 + 12;
      screenHeight = screenHeight + 7;
      secWinscreenx = screenX + winWidth - 19;
      screenX = screenX - 7;
    }
  }
}

//Opening Secondary Window
function createSecondaryWindow() {
  mainWindow.hide();
  //Set this global to false so we know we're loading index.html
  //in the secondary window, not the primary window
  global.sharedObj = { loadingMain: false };
  // If it's maximized (Windows) or FullScreen (Mac) get it back to a normal window so we can resize it
  if (mainWindow.isMaximized() === true) {
    mainWindow.unmaximize();
  }
  if (mainWindow.isFullScreen() === true) {
    mainWindow.setFullScreen(false);
  }

  //Get current setup primary screen dimensions
  //getAllDisplays is an array of all displays, so array length gives you number of screens
  let numScreens = screen.getAllDisplays().length;

  if (numScreens === 2) {
    //workArea gives you the area without the taskbar - regular 'bounds' would get you with the taskbar, so your window goes underneath it; yucky
    primaryDisplay = screen.getAllDisplays()[0].workArea;
    secondaryDisplay = screen.getAllDisplays()[1].workArea;
    //Where is my mouse pointer?
    xpoint = screen.getCursorScreenPoint().x;

    //If mouse pointer is between these numbers:
    if (
      xpoint > primaryDisplay.x &&
      xpoint < primaryDisplay.x + primaryDisplay.width
    ) {
      //then we're on primaryDisplay
      screenWidth = primaryDisplay.width;
      screenHeight = primaryDisplay.height;
      screenX = primaryDisplay.x;
      screenY = primaryDisplay.y;
    } else if (
      xpoint > secondaryDisplay.x &&
      xpoint < secondaryDisplay.x + secondaryDisplay.width
    ) {
      //then we're on secondaryDisplay
      screenWidth = secondaryDisplay.width;
      screenHeight = secondaryDisplay.height;
      screenX = secondaryDisplay.x;
      screenY = secondaryDisplay.y;
    }
  }
  //The else below is the normal case, 1 screen, or the really abnormal case, more than 2 screens.
  //For both we just arrange the windows on the primary display.
  else {
    screenWidth = screen.getAllDisplays()[0].workArea.width;
    screenHeight = screen.getAllDisplays()[0].workArea.height;
    screenX = screen.getAllDisplays()[0].workArea.x;
    screenY = screen.getAllDisplays()[0].workArea.y;
  }

  //Calculate for all other than Win10:
  winWidth = screenWidth / 2;
  secWinscreenx = screenX + screenWidth / 2;
  //Now calculate for Win10 using the function above
  adjustForWin10InvisibleBorders();

  //The above get our dimensions set, now we open the window in the right place on the right screen
  secWindow = new BrowserWindow({
    width: winWidth,
    height: screenHeight,
    title: thisAppName,
    minHeight: 550,
    minWidth: 500,
    animate: true,
    x: secWinscreenx,
    y: screenY,
    backgroundColor: 111111,
    show: false,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
  });

  secWindow.loadFile("HTML/index.htm");

  //This is cleanup - normally the above window definition should work in any situation
  //but in two-monitor situations the height doesn't get set correctly.
  //Hoping to clear this up for future release.
  secWindow.setBounds({ height: screenHeight });

  //Now resize and reposition the mainWindow
  mainWindow.setBounds({
    x: screenX,
    y: screenY,
    width: winWidth,
    height: screenHeight,
    animate: false,
  });
  mainWindow.show();

  // Open the DevTools.
  //secWindow.webContents.openDevTools()

  // Right-click listener
  secWindow.webContents.on("context-menu", (e) => {
    contextMenu.popup();
  });

  secWindow.on("ready-to-show", () => {
    secWindow.show();
  });

  //The user has two ways they can close secWindow - they can click the X and also our 'close secWindow' button.
  //So we route all the things we have to do on cleanup here to make it happen right.
  //With the showing and hiding just trying to make it snappier.
  secWindow.on("close", () => {
    if (secWindow) {
      secWindow.hide();
      secWindow.focus();
      secWindow.send("sec-window-is-closed-sec-window-actions"); //lastKnownState save
    }

    mainWindow.hide();
    mainWindow.send("sec-window-is-closed-main-window-actions"); //toggle button from - to +
    mainWindow.show();
  });

  //This is after the window is closed.
  secWindow.on("closed", () => {
    secWindow = null;
  });
}
//End of createSecondaryWindow

// Calling secondary window

//Listening for the command to open or close secWindow
ipcMain.on("secondary-window", (e, message) => {
  if (message === "open-sec") {
    createSecondaryWindow();
  } else if (message === "close-sec") {
    //this closes the window, which triggers secWindow.on('close') where the cleanup happens
    secWindow.close();
  }
});
//End of secondary Window
//------------------------

//------------------------
//Search Window
ipcMain.on("open-search", (e, displayLang) => {
  if (searchWindow) {
    searchWindow.focus;
    return;
  }

  searchWindow = new BrowserWindow({
    width: 350,
    height: 685,
    minWidth: 350,
    maxWidth: 650,
    minHeight: 300,
    title: "",
    minimizable: true,
    fullscreenable: false,
    resizable: true,
    alwaysOnTop: true,
    menu: null,
    show: false,
    spellcheck: false,
    webPreferences: { nodeIntegration: true, enableRemoteModule: false },
  });

  searchWindow.loadFile("HTML/search/search.html");

  //The search windows takes a different, smaller context menu for copy and paste alone
  let searchWinContextMenu = [
    {
      label: transl.menuCopy[displayLang],
      accelerator: "CmdOrCtrl+C",
      selector: "copy:",
    },
    {
      label: transl.menuPaste[displayLang],
      accelerator: "CmdOrCtrl+V",
      selector: "paste:",
    },
  ];

  //The context menu just takes that core menu
  searchWinContextMenu = Menu.buildFromTemplate(searchWinContextMenu);
  //Event listener for right-click
  searchWindow.webContents.on("context-menu", (e) => {
    searchWinContextMenu.popup();
  });
  searchWindow.once("ready-to-show", () => {
    searchWindow.show();
    // searchWindow.webContents.openDevTools();
  });

  // Listen for window being closed
  searchWindow.on("closed", () => {
    searchWindow = null;
  });
});

//Now open the search result the user selected in search Window
ipcMain.on("open-search-result-search-to-main", (e, openthis) => {
  mainWindow.focus();
  mainWindow.send("open-search-result-main-to-mainWindow", openthis);
});

//This is fired when the user opens the search window for the first time on each app update.
ipcMain.on("build-search-index", (e) => {
  //Track how long it takes to build the index
  var d = new Date();
  var indexBuildStartTime = d.getTime();
  console.log("Building search index...");

  let allVersesArray = []; //The big array index of all verses
  var verseid = 0; //in alltext array we want an easy to pass id - this increments further on

  //requiring path and fs modules
  const path = require("path");
  const fs = require("fs");

  //for each collection in the collection list from mydata.js
  for (const collection of myData.collections) {
    //joining path of HTML directory with the collection directory again from mydata.js
    const directoryPath = path.join(__dirname, "HTML", collection.folder);

    //Get all the html and htm files in our path
    files = fs.readdirSync(directoryPath);

    //listing all files using forEach
    for (const file of files) {
      if (file.substr(-5) == ".html" || file.substr(-4) == ".htm") {
        var fullFilePath = path.join(directoryPath, file);
        //read the contents of each file out
        var fileContents = fs.readFileSync(fullFilePath, "utf8");

        // Get a string containing chapter and book here
        var bookAndChapter = fileContents.substring(
          fileContents.indexOf("<title>") + 7,
          fileContents.indexOf("</title>")
        );

        //Grab the content, leave the headers and footers
        var fileContentsBody = fileContents.substring(
          fileContents.indexOf(`<div id="content">`) + 18,
          fileContents.indexOf(`<div class="footer">`)
        );

        //split the file contents via verse numbers into the array oneChapterByVerse
        var splitString = `<a id="v`;
        var oneChapterByVerse = fileContentsBody.split(splitString);
        //Leave out the documents that don't have more than two verses: intros, glossaries etc. This counts the array elements = verses.
        //.length here refers to number of elements in the array.
        if (oneChapterByVerse.length > 2) {
          //For each verse in the resulting array, make an object that contains the relevent info so we can go back to it
          for (const verse of oneChapterByVerse) {
            //Get verse number
            var verseNumber = verse.substring(0, verse.indexOf(`"`));

            //Get the verse string without the nbsp;. substring with no second argument goes to end of string
            var verseInteriorIndex = verse.indexOf(`&nbsp;</span>`);
            var verseString = verse.substring(verseInteriorIndex);

            //Now we're changing the verseString and stripping off bits we don't need
            verseString = verseString.substring(
              0,
              verse.indexOf(`<span id="bookmarks${verseNumber}"></span>`)
            );

            //for each verse, Take out HTML tags
            verseString = verseString.replace(/<\/?[^>]+(>|$)/g, "");

            //There is a nbsp; left over at the beginning of each verse, take it out; rememeber (6) here amounts to "start 6 characters in and go to the end"
            verseString = verseString.substring(6);

            //Now store each verse in the array
            var oneVerse = {
              id: verseid,
              file: file,
              folder: collection.folder,
              collectionName: collection.name,
              verseText: verseString,
              bookAndChapter: bookAndChapter,
              verseNumber: verseNumber,
            };
            allVersesArray.push(oneVerse);
            verseid++;
          }
        }
      }
    }
  }
  //Now that big for loop is done, send the data to the searchWindow.
  searchWindow.send("search-index-incoming", allVersesArray);

  //log out how long it took to do the index build
  var d = new Date();
  var indexBuildEndTime = d.getTime();
  var totalTimeElapsed = (indexBuildEndTime - indexBuildStartTime) / 1000;
  console.log("Index built in " + totalTimeElapsed + " seconds");
});

//------------------------

app.on("window-all-closed", function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") app.quit();
});

// When app icon is clicked and app is running, (macOS) recreate the BrowserWindow
app.on("activate", () => {
  if (mainWindow === null) createWindow();
});
