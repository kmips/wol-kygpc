# Wolof Bible unified desktop app 

*and* 

# [SAB](http://software.sil.org/scriptureappbuilder/download/) HTML output multi-version desktop app

If you are comfortable with the basics of [Electron](https://electronjs.org/) apps you can reuse this app's framework to make a multi-collection app for your language.

To make your own app: 
* download the source, 
* open as an app in your development environment, 
* delete the "org.mbs..." folders in the HTML folder and all the mp3's in the mp3 folder, 
* replace with your SAB HTML output folder(s), and
	* if you are using mp3's, make sure to export the HTML output using `../mp3/` as the path to files in HTML output settings in SAB.
* and then open [mydata.js](https://github.com/kmips/wol-kygpc/blob/master/mydata.js) and replace the information there with your information. More instructions on how to do that are located in that file. 
* Run it using
	* `npm run test` or `npm run debug` from terminal
	* `Debug main process` if using [Visual Studio Code](https://code.visualstudio.com/).


The css to get the look used in this app on the HTML collections and how to use it is in css-changes.txt in the HTML folder. 

If you run into any problems, [raise an issue](https://github.com/kmips/wol-kygpc/issues) and I will try to help. 
