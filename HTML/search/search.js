// Append button to body
//document.getElementsByTagName('body')[0].appendChild(readitClose)

// Modules
const { ipcRenderer } = require("electron");
const myData = require("../../mydata");
let searchButton = document.getElementById("searchButton"),
  searchText = document.getElementById("searchText");
searchSettingsButton = document.getElementById("searchSettingsButton");
closeSearchSettingsButton = document.getElementById("close-search-settings");
searchSettings;

// Navigate item selection with up/down arrows?
// document.addEventListener("keydown", (e) => {
//   if (e.key === "ArrowUp" || e.key === "ArrowDown") {
//     items.changeSelection(e.key);
//   }
// });

let indexBuildStartTime;
let indexBuildEndTime;

//Look at ohter things he does with the box in electron-master

//Build search settings panel
//Search type translations
displayLang = JSON.parse(localStorage.getItem("lastKnownDisplayLanguage"));
fuzzyLabel = myData.myTranslations.searchFuzzy[displayLang];
strictLabel = myData.myTranslations.searchStrict[displayLang];

//reinitialize search settings each time the user opens search
var searchSettings = [];
searchSetting = "fuzzy";
searchSettings.push(searchSetting);

document.getElementById("fuzzyLabel").innerHTML = fuzzyLabel;
document.getElementById("strictLabel").innerHTML = strictLabel;

let searchWhichCollections = document.getElementById("searchWhichCollections");

myData.collections.forEach((collection) => {
  //set up the collectionOption, which will be used for each of the items in the array "collections" exported from mydata.js above.

  let collectionFolder = collection.folder;
  let collectionOption = document.createElement("input");
  collectionOption.setAttribute("type", "checkbox");
  collectionOption.setAttribute("id", collectionFolder);
  collectionOption.setAttribute("class", "collectionChoice");
  collectionOption.setAttribute("name", collectionFolder);
  collectionOption.setAttribute("value", collectionFolder);
  collectionOption.setAttribute("checked", true);
  searchWhichCollections.appendChild(collectionOption);
  let collectionLabel = document.createElement("label");
  collectionLabel.setAttribute("for", collectionFolder);
  collectionLabel.innerHTML = ` ${collection.name}`;
  searchWhichCollections.appendChild(collectionLabel);
  searchWhichCollections.appendChild(document.createElement("br"));

  searchSetting = collectionFolder;
  searchSettings.push(searchSetting);
});
//Store default search settings to localstorage
localStorage.removeItem("searchSettings");

localStorage.setItem("searchSettings", JSON.stringify(searchSettings));
//On searchWindow open, build the index if it is not already built.
rebuildIndex = localStorage.getItem("rebuildIndex");
//Below for troubleshooting - uncomment to always build the index on search window load.
//rebuildIndex = "true";
//If rebuild the Index request
if (rebuildIndex === "true" || localStorage.getItem("searchIndex") === null) {
  //Set loading icon
  document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;

  var d = new Date();
  indexBuildStartTime = d.getTime();

  ipcRenderer.send("build-search-index");
}

ipcRenderer.on("search-index-incoming", (e, allVersesArray) => {
  document.getElementById("no-items").innerHTML = `filter_list`;

  //Here we store the index in localStorage
  localStorage.setItem("searchIndex", JSON.stringify(allVersesArray));

  //log out how long it took to do the index build
  var d = new Date();
  indexBuildEndTime = d.getTime();
  var totalTimeElapsed = (indexBuildEndTime - indexBuildStartTime) / 1000;
  console.log("Index built in " + totalTimeElapsed + " seconds");
});

//Search settings show and hide
searchSettingsButton.addEventListener("click", (e) => {
  console.log("searchSettingsButton click listener heard");

  searchSettingsPanel.style.display = "block";
});

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
  searchSettingsPanel.style.display = "none";

  var val = getRadioVal(document.getElementById("searchType"), "searchType");
  searchSettings = [];
  searchSetting = val;
  searchSettings.push(searchSetting);

  Array.from(document.getElementsByClassName("collectionChoice")).forEach(
    (choice) => {
      if (choice.checked === true) {
        console.log(choice.id);
        var searchFolder = choice.id;
        searchSetting = choice.id;
        searchSettings.push(searchSetting);
      }
    }
  );
  localStorage.removeItem("searchSettings");
  localStorage.setItem("searchSettings", JSON.stringify(searchSettings));
});

// Set item as selected
const select = (e) => {
  // Remove currently selected item class

  document
    .getElementsByClassName("search-result selected")[0]
    .classList.remove("selected");

  // Add to clicked item
  e.currentTarget.classList.add("selected");
  let selectedItem = document.getElementsByClassName(
    "search-result selected"
  )[0];
  var openthis = {
    file: selectedItem.dataset.file,
    folder: selectedItem.dataset.folder,
    id: selectedItem.dataset.id,
    collectionName: selectedItem.dataset.collectionName,
    verseNumber: selectedItem.verseNumber,
  };
};

const open = () => {
  // Get selected item
  let selectedItem = document.getElementsByClassName(
    "search-result selected"
  )[0];

  // Get item's info
  console.log(selectedItem.dataset.file + " " + selectedItem.dataset.folder);
  var openthis = {
    file: selectedItem.dataset.file,
    folder: selectedItem.dataset.folder,
    verseNumber: selectedItem.dataset.verseNumber,
  };

  ipcRenderer.send("open-search-result-search-to-main", openthis);
};

//Go time on the search
searchButton.addEventListener("click", (e) => {
  let resultsList = document.getElementById("items");
  // Check a search term has been entered
  if (searchText.value) {
    // If we've previously searched, remove search results and start fresh

    if (resultsList.hasChildNodes()) {
      resultsList.innerHTML = "";
    }

    //While we're searching give the user the loading gif so they will know we're working
    document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;

    //First search routine sent to main, which did the searching with no index, just opening html files directly and without options.
    //ipcRenderer.send("vanilla-search-for-this", searchText.value);

    //Search with index
    //Load searchIndex and searchSettings from localStorage.
    searchTerm = searchText.value;
    searchIndex = JSON.parse(localStorage.getItem("searchIndex"));
    searchSettings = JSON.parse(localStorage.getItem("searchSettings"));

    if ((searchSettings[0] = "fuzzy")) {
      //do fuzzy search
      //First normalize the searchterm: no accents, no caps
      var searchTermLowerCaseNoAccents = searchTerm
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      for (const verse of searchIndex) {
        var verseLowerCaseNoAccents = verse.verseText
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        //Now search:
        //First check if the folder we're looking at exists in searchSettings
        if (searchSettings.includes(verse.folder) === true) {
          //if there is the search term, then give the result.
          var searchSuccess = verseLowerCaseNoAccents.search(
            searchTermLowerCaseNoAccents
          );
          if (searchSuccess > 0) {
            var result = document.createElement("div");
            result.setAttribute("class", "search-result");
            result.setAttribute("data-file", verse.file);
            result.setAttribute("data-folder", verse.folder);
            result.setAttribute("data-id", verse.id);
            result.setAttribute("data-verse-number", verse.verseNumber);
            result.innerHTML = `${verse.verseText}<br><resultRef>${verse.bookAndChapter}.${verse.verseNumber} | ${verse.collectionName}`;

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
        }
      }
    } else if ((searchSettings.searchType = "strict")) {
      //do strict search
      for (const verse of searchIndex) {
        //First check if the folder we're looking at exists in searchSettings
        if (searchSettings.includes(verse.folder) === true) {
          //if there is the search term, then give the result.
          var searchSuccess = verse.verseText.search(searchTerm);
          if (searchSuccess > 0) {
            var result = document.createElement("div");
            result.setAttribute("class", "search-result");
            result.setAttribute("data-file", verse.file);
            result.setAttribute("data-folder", verse.folder);
            result.setAttribute("data-id", verse.id);
            result.setAttribute("data-verse-number", verse.verseNumber);
            result.innerHTML = `${verse.verseText}<br><resultRef>${verse.bookAndChapter}.${verse.verseNumber} | ${verse.collectionName}`;

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
        }
      }
    }
  }
  console.log("done searching");
});

// Listen for Enter on keyboard and call searchButton click
searchText.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchButton.click();
});

//If there are no results stop the spinner and show the magnifying glass w/ x
ipcRenderer.on("no-results", (e) => {
  document.getElementById("no-items").innerHTML = `<img src="no-results.png">`;
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
