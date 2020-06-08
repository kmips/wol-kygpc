// Javscript to increment the download progress-bar
var elem = document.getElementById("progress-bar");
var width = 7;
var id = setInterval(frame, 200);

function frame() {
  if (width >= 90) {
    clearInterval(id);
  } else {
    width++;
    elem.style.width = width + '%';
    elem.innerHTML = width * 1 + '%';
  }
}
