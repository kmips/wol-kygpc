//To customize this app, you should be able to add all the information you need here. 

const collections = []
const otherText = []


//For each HTML collection, add the following. Delete any extra entries or copy and paste to add. 
collection = {
    name: 'Kàddug Yàlla', //the name of the collection
    icon: 'bookmark', //the Material icon to use. Go to https://fontdrop.info/ and drop the MaterialIcons font in the HTML folder.
                                //Check which icon you want to use, and note the unicode character. You can directly use the unicode
                                //character like this: icon: "&#xE031;", or you can look up the name of the icon in the MaterialIcons.txt
                                //file in the HTML folder and grab the name there. 
    folder: 'org.mbs.kyg.wol', //The folder in the HTML folder in which this collection is found. 
    fileToView: 'index.html',  //The first file to view on a new install - usually index.html but not necessarily. 
    cssClass: 'icon-text',      //For Roman script (abc) leave as icon-text. For Arabic script icon-text-arabic. 
    horizontalLineFollows: false //If you want a horizontal line following this entry, put true. 
}
collections.push(collection)

collection = {
    name: 'Injiil 2020',
    icon: 'add_circle',
    folder: 'org.mbs.kyg.wol.2020',
    fileToView: 'index.html',
    cssClass: 'icon-text',
    horizontalLineFollows: false
}
collections.push(collection)

collection = {
    name: 'ڪَدُّگْ يَلَّ گِ',
    icon: 'polymer',
    folder: 'org.mbs.kygma.wol',
    fileToView: 'index.html',
    cssClass: 'icon-text-arabic',
    horizontalLineFollows: true
}
collections.push(collection)

collection = {
    name: 'Ab Jukki',
    icon: 'format_align_left',
    folder: 'org.mbs.chrono.wol.alfa',
    fileToView: 'index.html',
    cssClass: 'icon-text',
    horizontalLineFollows: false
}
collections.push(collection)

collection = {
    name: 'اَبْ جُڪِّ',
    icon: 'format_align_right',
    folder: 'org.mbs.chrono.wol.ajami',
    fileToView: 'index.html',
    cssClass: 'icon-text-arabic',
    horizontalLineFollows: false
}
collections.push(collection)

myTranslations = {
    //The invitation to open and close the second window, e.g. "One Pane" "Two Pane": 
    invToOpen: 'Ñaari laf',
    invToClose: 'Wenn laf',
    
    //If this is null, then there will be no feedback button. Make sure it looks like this if you want the button: 
    //giveFeedback: 'Feedback',
    //or like this if you want no feedback button: 
    //giveFeedback: '',
    giveFeedback: 'Feedback',
    giveFeedbackemail: 'equipedevmbs@gmail.com', //the email address to send feedback to
    giveFeedbacksubject: 'Feedback on KYG desktop app', //the subject line to include automatically in any feedback email. 
    
    thisAppName: 'Kàddug Yàlla gi', //The name that you want to use in the app title bar etc. 
    
    //Menu items below are for both Mac menu and Mac Win and Lin context menus
    menuZoomIn: 'Zoom +',
    menuZoomOut:'Zoom -',
    menuResetZoom: 'Zoom 100%',
    menuCopy: 'Copier',
    menuSelectAll: 'Sélectionner tout', 
    menutoggleDevTools: 'Outils de développement',
    menuWebsite: 'Notre site web',
    menuWebURL: 'https://sng.al/app',
    menuOpenAboutWin: 'Copyright && license',
    menuQuit: 'Quitter',
    
}
otherText.push(myTranslations)

module.exports.otherText = otherText
module.exports.collections = collections

