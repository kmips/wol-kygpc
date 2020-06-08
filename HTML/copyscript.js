// Renderer javascript for copy.html
const { remote, shell } = require('electron')
//This happens each time there's a click on the page and if it's an external link opens it in the user's default browser. 
  document.addEventListener('click', function (event) {
    if (event.target.tagName === 'A' && event.target.href.startsWith('http')) {
      event.preventDefault()
      shell.openExternal(event.target.href)
    }
  })
  