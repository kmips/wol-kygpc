// Renderer javascript for index.html
const {
  remote,
  shell,
  ipcRenderer,
  Menu,
  BrowserWindow,
  ipcMain,
} = require("electron");

//Our app's version for comparison below
thisAppVersion = remote.app.getVersion();

// Get the data about collections from mydata.js and set it to our variable for use.
const myData = require("../mydata");

//This is the array with information about our collections in an array
const initialState = myData.collections;

//Set up variables to hold the current state of our two windows
let currentStateMainWindow = [];
let currentStateSecWindow = [];
let displayLang;

//Check the if the app has been previously run and if version is same as last run.
//If lastOpenedVersion is null, then it's a new open.
if (localStorage.getItem("lastOpenedVersion") === null) {
  //set things up for first run: set a variable in local storage equal to current app version and continue.
  //You don't need to set up lastKnownStateMainWin now, the app will do that as you change panes
  localStorage.setItem("lastOpenedVersion", JSON.stringify(thisAppVersion));
  //This is in case of a first run, this populates the session memory with the array for the folders and pages.
  currentStateMainWindow = initialState;
  currentStateSecWindow = initialState;
  localStorage.setItem(
    "lastKnownStateMainWin",
    JSON.stringify(currentStateMainWindow)
  );
  localStorage.setItem(
    "lastKnownStateSecWin",
    JSON.stringify(currentStateSecWindow)
  );
  //This gets us our default interface lang from myData.
  displayLang = myData.otherText.defaultLang;
  localStorage.setItem("lastKnownDisplayLanguage", JSON.stringify(displayLang));
  //Let the main process know the displayLang
  ipcRenderer.send("set-display-lang", displayLang);
}

//Or if the last version opened is the same as this one,
else if (
  JSON.parse(localStorage.getItem("lastOpenedVersion")) === thisAppVersion
) {
  //get the stored values for panes' last known states into our session memory for use.
  currentStateMainWindow = JSON.parse(
    localStorage.getItem("lastKnownStateMainWin")
  );
  currentStateSecWindow = JSON.parse(
    localStorage.getItem("lastKnownStateSecWin")
  );
  displayLang = JSON.parse(localStorage.getItem("lastKnownDisplayLanguage"));
  //Let the main process know the displayLang
  ipcRenderer.send("set-display-lang", displayLang);
}
//Or if we've upgraded, chances are we've added pages or collections, so reinitialize - that is:
else if (
  !(JSON.parse(localStorage.getItem("lastOpenedVersion")) === thisAppVersion)
) {
  //save our new version number
  localStorage.setItem("lastOpenedVersion", JSON.stringify(thisAppVersion));
  //and throw away the old lastKnownStateMainWin and use the initialState values from mydata.js.
  localStorage.removeItem("lastKnownStateMainWin");
  localStorage.removeItem("lastKnownStateSecWin");
  currentStateMainWindow = initialState;
  currentStateSecWindow = initialState;
  localStorage.setItem(
    "lastKnownStateMainWin",
    JSON.stringify(currentStateMainWindow)
  );
  localStorage.setItem(
    "lastKnownStateSecWin",
    JSON.stringify(currentStateSecWindow)
  );
  displayLang = JSON.parse(localStorage.getItem("lastKnownDisplayLanguage"));
  //Let the main process know the displayLang
  ipcRenderer.send("set-display-lang", displayLang);
}

//Get text for the other translations from myTranslations array; the app's invitation to open and close second window and to give feedback.
const appInvToOpen = myData.myTranslations.invToOpen[displayLang];

const appInvToClose = myData.myTranslations.invToClose[displayLang];
const appFeedback = myData.myTranslations.giveFeedback[displayLang];
const appFeedbackemail = myData.otherText.giveFeedbackemail;
const appFeedbacksubject =
  myData.myTranslations.giveFeedbacksubject[displayLang];
const thisAppName = myData.otherText.thisAppName;

//Housekeeping:
//Give the app builder a message if they have put feedback message but no email or subject
if (!(appFeedback === "") && appFeedbackemail === "") {
  alert(
    "App feedback is enabled but no email address is entered. Check out mydata.js."
  );
}

//** Navigation and saving lastKnownStateMainWin

//set up the click handler that we'll use below when one of the sidemenu items are clicked.
const sideBarClick = (e) => {
  //Here is the current path on the iframe
  var iframeSource = document.getElementById("mainFrame").contentDocument.URL;

  // .split() takes a string and splits it into an array by the character in the parentheses,
  // so here we make the array with the info about what the window is currently showing in the iframe
  var iframeInfotoSave = iframeSource.split("/");

  //.pop returns the last item in an array and simultaneously eliminates it from the array.
  //So here is the last element in the array, the page, split out from the path
  pageToSave = iframeInfotoSave.pop();
  //And here is the folder name split out from the path
  folderToSave = iframeInfotoSave.pop();

  //Note that we are identifying which window we're in and therefore which datatset to use
  //by looking at the arbitrary text 'dataset' that is coming from the link itself, not from observing the active window
  if (e.currentTarget.dataset.windowName === "mainWin") {
    //i here is the index number of the array currentStateMainWindow where myData.collections.folder = folderToSave from above
    var i = currentStateMainWindow.findIndex(
      (obj) => obj.folder === folderToSave
    );

    //Now change the array to set the window we are leaving so we can come back to it when the user returns to that collection
    currentStateMainWindow[i].fileToView = pageToSave;

    //That's the page we're leaving, now this is the page we are going to.

    //First find the page that has been stored in the array for the folder we're heading to.
    //e.currentTarget is info coming from the link the user just clicked on
    var i = currentStateMainWindow.findIndex(
      (obj) => obj.folder === e.currentTarget.dataset.folder
    );

    //Set the iframe to the new destination: e.currentTarget is the link the user just clicked on;
    //currentStateMainWindow[i].fileToView is coming straight from the array at index number i.
    document.getElementById(
      "mainFrame"
    ).src = `./${e.currentTarget.dataset.folder}/${currentStateMainWindow[i].fileToView}`;

    //To help the user keep track of where they are, set the collection name in the title bar
    remote
      .getCurrentWindow()
      .setTitle(
        thisAppName + "   ||   " + e.currentTarget.dataset.collectionName
      );

    //Now the info is stored in memory, go ahead and store to localStorage so it will survive a crash etc.
    localStorage.setItem(
      "lastKnownStateMainWin",
      JSON.stringify(currentStateMainWindow)
    );
  } else if (e.currentTarget.dataset.windowName === "secWin") {
    //This is the same as above and it would be nicer to have it in one function rather than an if
    //but I'm afraid it would render it much harder to understand
    var i = currentStateSecWindow.findIndex(
      (obj) => obj.folder === folderToSave
    );
    currentStateSecWindow[i].fileToView = pageToSave;
    var i = currentStateSecWindow.findIndex(
      (obj) => obj.folder === e.currentTarget.dataset.folder
    );
    document.getElementById(
      "mainFrame"
    ).src = `./${e.currentTarget.dataset.folder}/${currentStateSecWindow[i].fileToView}`;
    remote
      .getCurrentWindow()
      .setTitle(
        thisAppName + "   ||   " + e.currentTarget.dataset.collectionName
      );
    localStorage.setItem(
      "lastKnownStateSecWin",
      JSON.stringify(currentStateSecWindow)
    );
  }
};

//***Sidebar construction on load***
//This is a variable we'll use as a shortcut to refer to the place to put the new sidebarMenuItem.
let sidebarMenu = document.getElementById("mySidebar");

//This populates the sidebar on load with collection information from mydata.js, referred to here by myData
//Set up the loop to do for each item in the array 'collections'
myData.collections.forEach((item) => {
  //set up the sidebarMenuItem, which will be used for each of the items in the array "collections" exported from mydata.js above.

  //It's a link <a>
  let sidebarMenuItem = document.createElement("a");

  //set href to # for this a
  sidebarMenuItem.setAttribute("href", "#");

  //These next two set arbitrary text in the 'dataset' array.
  //The syntax is "data-" >> "dataset." and item-thing to itemThing - in other words
  //so data-url >> dataset.url when we call it.
  //We are setting here the value to the value in our array, e.g. item.folder and then
  //data-first-file >> dataset.firstFile when we call it
  //For more: https://www.w3schools.com/tags/att_global_data.asp

  //Store in the link the name of the folder and the name of the collection for use later on
  sidebarMenuItem.setAttribute("data-folder", item.folder);
  sidebarMenuItem.setAttribute("data-collection-name", item.name);

  //We use this code twice, once for mainWin and once for secWin, mark them on construction with a label that we can come back to later.
  if (remote.getGlobal("sharedObj").loadingMain === true) {
    sidebarMenuItem.setAttribute("data-window-name", "mainWin");
  } else if (remote.getGlobal("sharedObj").loadingMain === false) {
    sidebarMenuItem.setAttribute("data-window-name", "secWin");
  }

  //text with variables that goes inside the <a></a> tag. Remember this loops for each collection so each in its turn will get
  //its information included in a separate entry
  sidebarMenuItem.innerHTML = `<span><i class="material-icons">${item.icon}</i><span class=${item.cssClass}>${item.name}</span>`;

  // Append new node to "sidebarMenu" div
  //remember 'sidebarMenu' is document.getElementById('mySidebar') in index.htm.
  //sidebarMenuItem is the new a with the icon, text, and initial URL that we have set up.
  sidebarMenu.appendChild(sidebarMenuItem);

  // Attach click handler to select
  sidebarMenuItem.addEventListener("click", sideBarClick);

  //This enables us to put a blank line or horizontal line between each
  if (item.horizontalLineFollows === false) {
    sidebarMenu.appendChild(document.createElement("br"));
  } else if (item.horizontalLineFollows === true) {
    sidebarMenu.appendChild(document.createElement("hr"));
    sidebarMenu.appendChild(document.createElement("br"));
  }

  //To finish, set the iframe source to be the first collection, but the lastKnownState file.
  if (remote.getGlobal("sharedObj").loadingMain === true) {
    document.getElementById(
      "mainFrame"
    ).src = `./${currentStateMainWindow[0].folder}/${currentStateMainWindow[0].fileToView}`;
  } else if (remote.getGlobal("sharedObj").loadingMain === false) {
    document.getElementById(
      "mainFrame"
    ).src = `./${currentStateSecWindow[0].folder}/${currentStateSecWindow[0].fileToView}`;
  }
});

//Now add the sidebarBottom div to hold the bottom icons
let sidebarMenuBottomDiv = document.createElement("div");
sidebarMenuBottomDiv.setAttribute("class", "sidebarBottom");
sidebarMenuBottomDiv.setAttribute("id", "mySidebarBottom");
sidebarMenu.appendChild(sidebarMenuBottomDiv);

//Now add the button at the bottom of the sidebar for a new screen
//We only want that on the main window, so do an if to pick it up
if (remote.getGlobal("sharedObj").loadingMain === true) {
  sidebarMenuBottomDiv = document.getElementById("mySidebarBottom");
  sidebarMenuItem = document.createElement("a");
  sidebarMenuItem.setAttribute("href", "#");
  sidebarMenuItem.setAttribute("id", "twoPaneButton");
  sidebarMenuItem.setAttribute("data-open-close-state", "InvToOpen");
  sidebarMenuItem.innerHTML = `<span><i class="material-icons" id="two-window-icon">library_add</i><span class='icon-text'>${appInvToOpen}</span>`;
  sidebarMenuBottomDiv.appendChild(sidebarMenuItem);
  sidebarMenuItem.addEventListener("click", openOrCloseNewWindow);

  //This adds a contact us button, but only if there is one defined in mydata.js.
  if (!(appFeedback === "")) {
    //This enables us to put a blank line in between each
    sidebarMenuBottomDiv.appendChild(document.createElement("br"));
    sidebarMenuItem = document.createElement("a");
    sidebarMenuItem.setAttribute(
      `href`,
      `mailto:${appFeedbackemail}?subject=${appFeedbacksubject}`
    );
    sidebarMenuItem.innerHTML = `<span><i class="material-icons">local_post_office</i><span class='icon-text'>${appFeedback}</span>`;
    sidebarMenuBottomDiv.appendChild(sidebarMenuItem);
    sidebarMenuBottomDiv.appendChild(document.createElement("br"));
  }
}

//** Event listeners/handlers

//The context menu is coming from myjs.js and triggered in main.js. But we don't want to
//show contextmenu in the sidebar because it looks strange. So this
//1) the "if" statement checks to see if that element exists
//  (if you don't have it and you don't check it throws an error - i.e. copyright page) and
//2) suppresses it just in that mySidebar div.
if (document.getElementById("mainFrame")) {
  document.getElementById("mySidebar").addEventListener("contextmenu", (e) => {
    e.preventDefault(), false;
  });
}

//Safety with nodeintegration:
//Our index.html has no outside links so they can be normally handled. But often an HTML collection will have
//an outside link, perhaps for a copyright page or other information. Here we want to parse for relative hyperlinks
//and let those go, but open all others in the user's default browser.
//Wrapping the onclick event in the onload event is important because you have to reload this code each time the iframe reloads
//as the onclick event is really applied to the iframe's contents. When the contents chagnes (onload) you have to reapply the handler.
document.getElementById("mainFrame").onload = () => {
  document.getElementById("mainFrame").contentWindow.document.onclick = () => {
    if (event.target.tagName === "A" && event.target.href.startsWith("http")) {
      event.preventDefault();
      shell.openExternal(event.target.href);
    }
  };
};

//** Functions

//These two open and close the sidebar menu.
function openSidebar() {
  document.getElementById("mySidebar").style.width = "250px";
}

function closeSidebar() {
  document.getElementById("mySidebar").style.width = "85px";
}

function openOrCloseNewWindow(displayLang) {
  //Get the main process to open the secondary window
  //This checks if the invitation to open is showing:
  if (twoPaneButton.dataset.openCloseState === "InvToOpen") {
    //see this function lower down a bit - changes icon and text for the new window button
    toggleButtonIcon();
    //This changes our marker back to Invitation to Close showing so we can check whether to open or close
    twoPaneButton.dataset.openCloseState = "InvToClose";
    //Send via ipcRenderer to the main process on channel 'secondary-window' the message
    //'open-sec' or 'close-sec' the secondary window.
    ipcRenderer.send("secondary-window", "open-sec");
  } else {
    //here the toggle button was not set to library_add so we know the secondary window is open - close it
    ipcRenderer.send("secondary-window", "close-sec");
    //Change the marker so we know what state we're in, invitation to open or to close showing.
    twoPaneButton.dataset.openCloseState = "InvToOpen";
    //One expects toggleButtonIcon() here, but it is called from sec-window-is-closed-main-window-actions below
    //so that it gets triggered no matter how the user closes SecWindow (via x or via the sidebarmenu).
  }
}

//There are only two options, the interface can either offer to open secondary window or close it.
//The options just go back and forth when this is triggered.
function toggleButtonIcon() {
  let twoPaneButton = document.getElementById("twoPaneButton");
  if (twoPaneButton.innerText === "library_add" + appInvToOpen) {
    twoPaneButton.innerHTML = `<span><i class="material-icons" id="two-window-icon">indeterminate_check_box</i><span class='icon-text'>${appInvToClose}</span>`;
  } else {
    twoPaneButton.innerHTML = `<span><i class="material-icons" id="two-window-icon">library_add</i><span class='icon-text'>${appInvToOpen}</span>`;
  }
}

// Save and persist storage
function saveDataMainWindow() {
  var iframeSource = document.getElementById("mainFrame").contentDocument.URL;
  var iframeInfotoSave = iframeSource.split("/");
  pageToSave = iframeInfotoSave.pop();
  folderToSave = iframeInfotoSave.pop();
  var i = currentStateMainWindow.findIndex(
    (obj) => obj.folder === folderToSave
  );
  currentStateMainWindow[i].fileToView = pageToSave;
  localStorage.setItem(
    "lastKnownStateMainWin",
    JSON.stringify(currentStateMainWindow)
  );
}

function saveDataSecWindow() {
  var iframeSource = document.getElementById("mainFrame").contentDocument.URL;

  var iframeInfotoSave = iframeSource.split("/");
  pageToSave = iframeInfotoSave.pop();
  folderToSave = iframeInfotoSave.pop();
  var i = currentStateSecWindow.findIndex((obj) => obj.folder === folderToSave);
  currentStateSecWindow[i].fileToView = pageToSave;
  localStorage.setItem(
    "lastKnownStateSecWin",
    JSON.stringify(currentStateSecWindow)
  );
}

//** ipcRenderer listener */
//If the user closes the secondary window in any way other than the button in the sidebar
//main process lets you know. Here we receive the message that the secondary window is closed
//so that we can put the button and icon back to "open me"
ipcRenderer.on("sec-window-is-closed-sec-window-actions", (e) => {
  saveDataSecWindow();
});

ipcRenderer.on("sec-window-is-closed-main-window-actions", (e) => {
  toggleButtonIcon();
});

ipcRenderer.on("mainWin-closing-save-data", (e) => {
  saveDataMainWindow();
});

ipcRenderer.on("language-switch", (e, lang) => {
  //Store the incoming language request to localStorage
  localStorage.setItem("lastKnownDisplayLanguage", JSON.stringify(lang));
  //Now send a message back to main.js to reload the page
  ipcRenderer.send("lang-changed-reload-pages");
});

//
