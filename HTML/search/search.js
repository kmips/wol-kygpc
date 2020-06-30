// Append button to body
//document.getElementsByTagName('body')[0].appendChild(readitClose)

// Modules
const { ipcRenderer, clipboard } = require("electron");
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
//Search method (fuzzy or strict) translations
displayLang = JSON.parse(localStorage.getItem("lastKnownDisplayLanguage"));
fuzzyLabel = myData.myTranslations.searchFuzzy[displayLang];
strictLabel = myData.myTranslations.searchStrict[displayLang];

//reinitialize search settings each time the user opens search
var searchSettings = [];
searchSetting = "fuzzy";
searchSettings.push(searchSetting);

defaultFontName = myData.otherText.defaultFont.substr(
  0,
  myData.otherText.defaultFont.indexOf(".")
);

document.getElementById("fuzzyLabel").innerHTML = fuzzyLabel;
document.getElementById("fuzzyLabel").style = `font-family:${defaultFontName}`;
document.getElementById("strictLabel").innerHTML = strictLabel;
document.getElementById("strictLabel").style = `font-family:${defaultFontName}`;
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
  //collectionLabel is the text to the side of it
  let collectionLabel = document.createElement("label");
  collectionLabel.setAttribute("for", collectionFolder);
  collectionLabel.innerHTML = ` ${collection.name}`;
  collectionLabel.style = `font-family:${defaultFontName}`;
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
//If rebuild the Index request
if (rebuildIndex === "true" || localStorage.getItem("searchIndex") === null) {
  //Set loading icon
  document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;
  //hiccup so the page & animation can load
  setTimeout(function () {
    var d = new Date();
    indexBuildStartTime = d.getTime();

    ipcRenderer.send("build-search-index");
  }, 1);
}

ipcRenderer.on("search-index-incoming", (e, allVersesArray) => {
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
        var searchFolder = choice.id;
        searchSetting = choice.id;
        searchSettings.push(searchSetting);
      }
    }
  );
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
//Get the head element

var searchHead = document.head;
var searchHeadStr = searchHead.innerHTML;
//var endHeadTag = searchHeadStr.indexOf("</head>");
var searchHeadInnerReplacement = "";

for (let uniqueFont of uniqueFonts) {
  uniqueFontName = uniqueFont.substr(0, uniqueFont.indexOf("."));
  searchHeadInnerReplacement =
    searchHeadInnerReplacement +
    `
  @font-face {
    font-family: "${uniqueFontName}";
    font-style: normal;
    src: 
      url(../${uniqueFont}) format("truetype");
  }`;
}
//Alter as follows to add our style in the head element
searchHeadStr =
  searchHeadStr + `<style> ${searchHeadInnerReplacement} </style>`;
//set the new string as the head element
searchHead.innerHTML = searchHeadStr;
//---

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

// async function firstFunction(){
//   for(i=0;i<x;i++){
//     // do something
//   }
//   return;
// };
// then use await in your other function to wait for it to return:

// async function secondFunction(){
//   await firstFunction();
//   // now wait for firstFunction to finish...
//   // do something else
// };

// // Second example
// async doLongCalculation() {
//   let firstbit = await doFirstBit();
//   let secondbit = await doSecondBit(firstbit);
//   let result = await finishUp(secondbit);
//   return result;
// }

// async doFirstBit() {
//   //...
// }

// async doSecondBit...

// ...
function addSearchResult(verse) {
  var result = document.createElement("div");
  result.setAttribute("class", "search-result");
  //get which collection we're in
  var i = myData.collections.findIndex((obj) => obj.folder === verse.folder);

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
    `font-family:${searchFontName}; font-size:${myData.collections[i].searchFontSize}px`
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

//
function mainSearchFn() {
  // Check a search term has been entered
  if (searchText.value) {
    // If we've previously searched, remove search results and start fresh

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
          //string.match searches RegEx - but you can't put the regex right in the match parentheses, you have to contruct it with the
          //RegExp() constructor and double escape the special terms:
          // (?<=[\s,.:;"']|^)UNICODE_WORD(?=[\s,.:;"']|$)
          // var searchTermRegEx = new RegExp(
          //   `(?<=[\\s.,?!:;؞،؟!؛:]|^)" + searchTerm + "(?=[\\s.,?!:;؞،؟!؛:]|$)`
          // );
          //string.match returns an object if there is a match
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

  document.getElementById("no-items").innerHTML = "";
  if (!resultsList.hasChildNodes()) {
    console.log("Search item not found in index");
    document.getElementById(
      "no-items"
    ).innerHTML = `<img src="no-results.png">`;
  }
  var d = new Date();
  var searchEndTime = d.getTime();
  var totalTimeElapsed = searchEndTime - searchStartTime;
  console.log("Search complete in " + totalTimeElapsed + " milliseconds");
  // //Some regex testing
  //   var searchTermRegEx2 = new RegExp(
  //     `(?<=[\\s,.:;"']|^)" + "Ñu" + "(?=[\\s,.:;"']|$)`
  //   );

  //   // (?<=[\s,.:;"']|^)UNICODE_WORD(?=[\s,.:;"']|$)
  //   str =
  //     "«Dégluleen ma, ngalla sang yi, siyaare naa leen, tee ngeena dal ak man, su ko defee ngeen jàngu, fanaan ba suba, ngeen xëy topp seen yoon?» Ñu ne ko: «Bàyyil, nu fanaan ci mbedd mi.»";
  //   var searchSuccess2 = str.match(searchTermRegEx2);
  //   console.log("Ñu " + searchSuccess2);
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
    console.log("in timeout");

    mainSearchFn();
  }, 50);
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
