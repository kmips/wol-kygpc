// Modules
const { ipcRenderer, clipboard, webFrame } = require("electron");
const myData = require("../../mydata");
let searchButton = document.getElementById("searchButton"),
  searchText = document.getElementById("searchText"),
  searchSettingsButton = document.getElementById("searchSettingsButton"),
  closeSearchSettingsButton = document.getElementById("close-search-settings");

let indexBuildStartTime;
let indexBuildEndTime;

//Build search settings panel
//Search method (fuzzy or strict) translations
displayLang = JSON.parse(localStorage.getItem("lastKnownDisplayLanguage"));

fuzzyLabel = myData.myTranslations.searchFuzzy[displayLang];
strictLabel = myData.myTranslations.searchStrict[displayLang];

//reinitialize search settings each time the user opens search
var searchSettings = [];
searchSetting = "fuzzy";
searchSettings.push(searchSetting);

//Get that default font name, the one that all collection names look good in
defaultFontName = myData.otherText.defaultFont.substr(
  0,
  myData.otherText.defaultFont.indexOf(".")
);

//Include the style definition necessary for the default font the sidebar is displayed in
var cssToAdd = `
  @font-face {
    font-family: "${defaultFontName}";
    font-style: normal;
    src: 
      url(./${myData.otherText.defaultFont}) format("truetype");
  }
  `;
//css insert https://www.electronjs.org/docs/api/web-frame#webframeinsertcsscss
webFrame.insertCSS(cssToAdd);

//Build the search settings panel
document.getElementById("fuzzyLabel").innerHTML = fuzzyLabel;
document.getElementById(
  "fuzzyLabel"
).style = `font-family:${defaultFontName}; user-select: none;`;

document.getElementById("strictLabel").innerHTML = strictLabel;
document.getElementById(
  "strictLabel"
).style = `font-family:${defaultFontName}; user-select: none;`;

searchText.style = `font-family:${defaultFontName}`;

let searchWhichCollections = document.getElementById("searchWhichCollections");
let resultsList = document.getElementById("items");

myData.collections.forEach((collection) => {
  //set up the collectionOption, which will be used for each of the items in the array "collections" exported from mydata.js above.

  let collectionFolder = collection.folder;
  //collectionOption is the radio button
  let collectionOption = document.createElement("input");
  collectionOption.setAttribute("type", "checkbox");
  collectionOption.setAttribute("id", collectionFolder);
  collectionOption.setAttribute("class", "collectionChoice");
  collectionOption.setAttribute("name", collectionFolder);
  collectionOption.setAttribute("value", collectionFolder);
  collectionOption.setAttribute("checked", true);
  searchWhichCollections.appendChild(collectionOption);

  //collectionLabel is the text to the side of the radio button
  let collectionLabel = document.createElement("label");
  collectionLabel.setAttribute("for", collectionFolder);
  collectionLabel.innerHTML = ` ${collection.name}`;
  collectionLabel.style = `font-family:${defaultFontName}; user-select: none;`;
  searchWhichCollections.appendChild(collectionLabel);
  searchWhichCollections.appendChild(document.createElement("br"));

  searchSetting = collectionFolder;
  searchSettings.push(searchSetting);
});

//Store default search settings to localstorage
localStorage.removeItem("searchSettings");
localStorage.setItem("searchSettings", JSON.stringify(searchSettings));

//--
//On searchWindow open, build the index if it is not already built.
rebuildIndex = localStorage.getItem("rebuildIndex");

//Below for troubleshooting - uncomment to always build the index on search window load.
//rebuildIndex = "true";
//If rebuild the Index request is true,
if (rebuildIndex === "true" || localStorage.getItem("searchIndex") === null) {
  //Set loading icon
  document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;
  //hiccup so the page & animation can load
  setTimeout(function () {
    var d = new Date();
    indexBuildStartTime = d.getTime();

    //and send the messag to main process to build it
    ipcRenderer.send("build-search-index");
  }, 1);
}

//The main process builds the index but does not have access to localStorage, so hand it back here to save
ipcRenderer.on("search-index-incoming", (e, allVersesArray) => {
  //This is the user feedback to hide the spinner to tell them the index is built and search is ready.
  document.getElementById("no-items").innerHTML = `filter_list`;

  //Here we store the index in localStorage
  localStorage.setItem("searchIndex", JSON.stringify(allVersesArray));

  //Now that we've build the index, set a flag that we don't need to do it again
  let rebuildIndex = false;
  localStorage.setItem("rebuildIndex", JSON.stringify(rebuildIndex));

  //log out how long it took to do the index build
  var d = new Date();
  indexBuildEndTime = d.getTime();
  var totalTimeElapsed = (indexBuildEndTime - indexBuildStartTime) / 1000;
  console.log(
    "Index built and ready to search in " + totalTimeElapsed + " seconds"
  );
});

//Search settings show and hide
searchSettingsButton.addEventListener("click", (e) => {
  searchSettingsPanel.style.display = "block";
});

//Get the value of the radio button
function getRadioVal(form, name) {
  var val;
  // get list of radio buttons with specified name
  var radios = form.elements[name];

  // loop through list of radio buttons
  for (var i = 0, len = radios.length; i < len; i++) {
    if (radios[i].checked) {
      // radio checked?
      val = radios[i].value; // if so, hold its value in val
      break; // and break out of for loop
    }
  }
  return val; // return value of checked radio or undefined if none checked
}

// Confirm search choices
closeSearchSettingsButton.addEventListener("click", (e) => {
  //hide the search settings planel
  searchSettingsPanel.style.display = "none";

  //Get the search type, fuzzy or strict
  var val = getRadioVal(document.getElementById("searchType"), "searchType");
  searchSettings = [];
  searchSetting = val;
  //And save the result
  searchSettings.push(searchSetting);

  Array.from(document.getElementsByClassName("collectionChoice")).forEach(
    (choice) => {
      if (choice.checked === true) {
        searchSetting = choice.id;
        //Put the collection in the search setting
        searchSettings.push(searchSetting);
      }
    }
  );

  //Get rid of old stored search settings and save new
  localStorage.removeItem("searchSettings");
  localStorage.setItem("searchSettings", JSON.stringify(searchSettings));
});

//--
//Setting up the search results styles dynamically
//Here grab unique fonts in myData.collections
var allFonts = [];
for (let collection of myData.collections) {
  allFonts.push(collection.searchFont);
}
const uniqueFonts = allFonts.filter((x, i, a) => a.indexOf(x) == i);

//Now include the styles definition necessary for the fonts
var cssToAdd;
for (let uniqueFont of uniqueFonts) {
  uniqueFontName = uniqueFont.substr(0, uniqueFont.indexOf("."));
  cssToAdd =
    cssToAdd +
    `
  @font-face {
    font-family: "${uniqueFontName}";
    font-style: normal;
    src: 
      url(../${uniqueFont}) format("truetype");
  }
  `;
}

//css insert https://www.electronjs.org/docs/api/web-frame#webframeinsertcsscss
webFrame.insertCSS(cssToAdd);
//---

// Set item as selected
const select = (e) => {
  // Remove currently selected item class
  document
    .getElementsByClassName("search-result selected")[0]
    .classList.remove("selected");

  // Add selected to clicked item
  e.currentTarget.classList.add("selected");
};

const open = () => {
  // Get selected item
  let selectedItem = document.getElementsByClassName(
    "search-result selected"
  )[0];

  // Get item's info
  var openthis = {
    file: selectedItem.dataset.file,
    folder: selectedItem.dataset.folder,
    id: selectedItem.dataset.id,
    collectionName: selectedItem.dataset.collectionName,
    verseNumber: selectedItem.dataset.verseNumber,
  };

  ipcRenderer.send("open-search-result-search-to-main", openthis);
};

//When a search is found, add it to the list so the user can see it
function addSearchResult(verse) {
  //Each result found runs through here:
  var result = document.createElement("div");
  result.setAttribute("class", "search-result");

  //get which collection we're in
  var i = myData.collections.findIndex((obj) => obj.folder === verse.folder);

  //Get the font name each colletion should be displayed in
  searchFontNameWithExtension = myData.collections[i].searchFont;
  searchFontName = searchFontNameWithExtension.substr(
    0,
    searchFontNameWithExtension.indexOf(".")
  );

  result.setAttribute("data-file", verse.file);
  result.setAttribute("data-folder", verse.folder);
  result.setAttribute("data-id", verse.id);
  result.setAttribute("data-verse-number", verse.verseNumber);
  result.setAttribute("data-collection-name", verse.collectionName);
  resultRefFontSize = myData.collections[i].searchFontSize - 4;
  result.innerHTML = `${verse.verseText}<br><resultRef style="font-size:${resultRefFontSize}px">${verse.bookAndChapter}.${verse.verseNumber} | ${verse.collectionName}`;
  result.setAttribute(
    "style",
    `font-family:${searchFontName}; font-size:${myData.collections[i].searchFontSize}px; direction:${myData.collections[i].textDirection}`
  );

  // Attach click handler to select
  result.addEventListener("click", select);

  // Attach open doubleclick handler
  result.addEventListener("dblclick", open);
  resultsList.appendChild(result);

  // If this is the first item, select it
  if (document.getElementsByClassName("search-result").length === 1) {
    result.classList.add("selected");
  }
}

//Here is where the magic happens
function mainSearchFn() {
  // Check a search term has been entered
  if (searchText.value) {
    //Track how long the search takes: search start
    var d = new Date();
    var searchStartTime = d.getTime();

    //Search with index
    //Load searchIndex and searchSettings from localStorage.
    searchTerm = searchText.value;
    searchIndex = JSON.parse(localStorage.getItem("searchIndex"));
    searchSettings = JSON.parse(localStorage.getItem("searchSettings"));

    //kick off the search
    if (searchSettings[0] === "fuzzy") {
      console.log("Doing a fuzzy search...");

      //First normalize the searchterm: no accents, no caps
      var searchTermLowerCaseNoAccents = searchTerm
        .toLowerCase()
        .normalize("NFD")
        //replace accents with normal/unaccented characaters
        .replace(/[\u0300-\u036f]/g, "");
      for (const verse of searchIndex) {
        var verseLowerCaseNoAccents = verse.verseText
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        //Now search:
        //First check if the folder we're looking at exists in searchSettings
        if (searchSettings.includes(verse.folder) === true) {
          //if there is the search term, then give the result boolean result; string.includes returns true or false.
          var searchSuccess = verseLowerCaseNoAccents.includes(
            searchTermLowerCaseNoAccents
          );
          if (searchSuccess === true) {
            addSearchResult(verse);
          }
        }
      }
    } else if (searchSettings[0] === "strict") {
      //do strict search
      console.log("Doing a strict search...");

      for (const verse of searchIndex) {
        //First check if the folder we're looking at exists in searchSettings
        if (searchSettings.includes(verse.folder) === true) {
          var searchSuccess = verse.verseText.match(searchTerm);
          //if there is no search term found, the result is null - if the search term is found, it's not null.
          //If success, then give the result.
          if (!(searchSuccess === null)) {
            addSearchResult(verse);
          }
        }
      }
    }
  }

  //If there are no results by now, give the user feedback to that effect
  document.getElementById("no-items").innerHTML = "";
  if (!resultsList.hasChildNodes()) {
    console.log("Search item not found in index");
    document.getElementById(
      "no-items"
    ).innerHTML = `<img src="no-results.png">`;
  }

  //Log out time elapsed on the search
  var d = new Date();
  var searchEndTime = d.getTime();
  var totalTimeElapsed = searchEndTime - searchStartTime;
  console.log("Search complete in " + totalTimeElapsed + " milliseconds");
}

//Go time on the search
searchButton.addEventListener("click", (e) => {
  //While we're searching give the user the loading gif so they will know we're working
  document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;
  if (resultsList.hasChildNodes()) {
    resultsList.innerHTML = "";
  }
  //This ugly thing is required to give the page time to update to show that animation so the user knows we are working for them!
  setTimeout(function () {
    mainSearchFn();
  }, 40);
});

// Listen for Enter on keyboard and call searchButton click
searchText.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchButton.click();
});

// Listen for Ctl V paste
document.addEventListener("keydown", (e) => {
  if ((e.ctrlKey && e.key === "v") || (e.metaKey && e.key === "v")) {
    document.execCommand("paste");
  }
});

// Listen for new item from main process vanilla
ipcRenderer.on("search-result", (e, verseResult) => {
  //
  let resultsList = document.getElementById("items");
  let result = document.createElement("div");
  result.setAttribute("class", "search-result");
  result.setAttribute("data-file", verseResult.file);
  result.setAttribute("data-folder", verseResult.folder);
  result.setAttribute("data-id", verseResult.id);
  result.setAttribute("data-verse-number", verseResult.verseNumber);
  result.innerHTML = `${verseResult.verseText}<br><resultRef>${verseResult.bookAndChapter} | ${verseResult.collectionName}`;

  // Attach click handler to select
  result.addEventListener("click", select);

  // Attach open doubleclick handler
  result.addEventListener("dblclick", open);
  resultsList.appendChild(result);
  // If this is the first item, select it
  if (document.getElementsByClassName("search-result").length === 1) {
    result.classList.add("selected");
  }
});
