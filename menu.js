//This is js for the main process, called from main.js. Renderer process js is in ./HTML/script.js
//Here you have main menu, context menu, and opening call for the copyright window.
const {
  electron,
  remote,
  app,
  Menu,
  shell,
  BrowserWindow,
  window,
  ipcMain,
  ipcRenderer,
} = require("electron");
//get our localisation (changeable strings depending on language)
//and otherText strings (things that don't change based on language) from mydata
const myData = require("./mydata");
const appText = myData.otherText;
const transl = myData.myTranslations;

let MyAppVersion = app.getVersion();

let copyrightWindow;
let mainMenu;
let contextMenu;
let mainWindow;
function goHigh() {
  console.log("in gohigh");
}

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
    //copyrightWindow.webContents.openDevTools()
  });

  copyrightWindow.once("blur", () => {
    copyrightWindow.close();
  });

  copyrightWindow.on("closed", function () {
    copyrightWindow = null;
  });
}
//End of copyright window

//Before going about constructing the menu, get the displayLang
console.log("global.globalDisplayLang is set to " + global.globalDisplayLang);

displayLang = global.globalDisplayLang;
console.log(displayLang);
console.log(Object.keys(transl.langName));

// Here we have separate menus for Mac (darwin) vs Win&Linux. To gain some consistency across the operating systems, we show the menu only in Mac.
// If Win or Linux, it returns null below, which makes the menu empty, and thus hidden, and all functions are available from context menu.
// Because of that our menu and contextmenu are basically identical, except that the mainMenu needs an extra level on top, with the main menu elements
// as a submenu underneath that. So set up the core menu, then either dress it with that top Menu level or not and return the objects.

let coreMenuSection1 = [
  {
    label: transl.menuZoomIn[displayLang],
    role: "zoomIn",
  },
  {
    label: transl.menuZoomOut[displayLang],
    role: "zoomOut",
  },
  {
    label: transl.menuResetZoom[displayLang],
    role: "resetZoom",
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

//Language switcher

if (!(Object.entries(transl.langName).length === 1)) {
  var langMenuDefinition = [];
  console.log("object keys length for lang name is not equal to 1");
  for (let [key, value] of Object.entries(transl.langName)) {
    console.log(`${key}: ${value}`);
    miniLangMenuDefinition = {
      label: `${value}`,
      click() {
        //langChange(`${key}`);
        ipcRenderer.send("change-lang", `${key}`);
      },
    };
    langMenuDefinition.push(miniLangMenuDefinition);
  }
  console.log(langMenuDefinition);

  coreMenuSection2 = [
    {
      label: transl.menuLangSwitch[displayLang],
      submenu: langMenuDefinition,
    },
  ];
} //If the length is not equal to 1 that means there are multiple languages, so put in lang switcher
//If there's only one display language it keeps rolling, skipping the language switcher

//Now we have the first part of the menu as the array coreMenuDefinition
//If we have a website prompt and a URL, make it the next part of the menu,
//but if we don't have either one, then skip on to the final section of the menu
if (!(transl.menuWebsite[displayLang] === "") && !(appText.menuWebURL === "")) {
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

//This is the last section of the menu
coreMenuSection4 = [
  {
    label: transl.menuQuit[displayLang],
    role: "quit",
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

//export the relevant elements so that they will be available when the require hits in main.js
module.exports.mainMenu = mainMenu;
module.exports.contextMenu = contextMenu;
