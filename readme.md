#Wolof Bible unified desktop app 

*and* 

#[SAB](http://software.sil.org/scriptureappbuilder/download/) HTML output multi-version desktop app

To reuse this app for your multiple HTML collection reading app, 
* download the source, 
* open as an [Electron](https://electronjs.org/) app in your development environment, 
* delete the "org.mbs..." folders in the HTML folder, 
* replace with your SAB HTML output folder(s), 
* and then open mydata.js and replace the information there with your information. 
* Run it using
	* `npm run test` or `npm run debug` from terminal
	* `Debug main process` if using [Visual Studio Code](https://code.visualstudio.com/).

If you are using mp3's, export the HTML output using `../mp3/` as the path to files in HTML output settings in SAB. 

The css to get the look used in this app on the HTML collections is in css-changes.txt in the HTML folder. 

If you run into any problems, raise an issue at https://github.com/kmips/wol-kygpc/issues. 
