// Append button to body
//document.getElementsByTagName('body')[0].appendChild(readitClose)

// Modules
const { ipcRenderer } = require("electron");

let searchButton = document.getElementById("searchButton"),
  searchText = document.getElementById("searchText");

// Navigate item selection with up/down arrows?
// document.addEventListener("keydown", (e) => {
//   if (e.key === "ArrowUp" || e.key === "ArrowDown") {
//     items.changeSelection(e.key);
//   }
// });

//Look at ohter things he does wit the box in electron-master

// Set item as selected
const select = (e) => {
  // Remove currently selected item class
  console.log("in select fn");

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
  };
  console.log(openthis);
};

const open = () => {
  console.log("in open fn");

  // Get selected item
  let selectedItem = document.getElementsByClassName(
    "search-result selected"
  )[0];

  // Get item's info
  console.log(selectedItem.dataset.file + " " + selectedItem.dataset.folder);
  var openthis = {
    file: selectedItem.dataset.file,
    folder: selectedItem.dataset.folder,
  };
  console.log(openthis);

  ipcRenderer.send("open-search-result-search-to-main", openthis);
};

//Go time on the search
searchButton.addEventListener("click", (e) => {
  // Check a url exists
  if (searchText.value) {
    // Send new item url to main process
    // Get the <ul> element with id="myList"
    let resultsList = document.getElementById("items");

    // If we've previously searched, remove search results and start fresh
    if (resultsList.hasChildNodes()) {
      resultsList.innerHTML = "";
    }

    document.getElementById("no-items").innerHTML = `<img src="loading2.gif">`;
    ipcRenderer.send("vanilla-search-for-this", searchText.value);
  }
});

// Listen for Enter on keyboard and call searchButton click
searchText.addEventListener("keyup", (e) => {
  if (e.key === "Enter") searchButton.click();
});

//If there are no results stop the spinner and show the magnifying glass w/ x
ipcRenderer.on("no-results", (e) => {
  console.log("no-results in search.js");

  document.getElementById("no-items").innerHTML = `<img src="no-results.png">`;
});

// Listen for new item from main process
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
