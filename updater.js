// Modules
const {dialog, BrowserWindow, ipcMain} = require('electron')
const {autoUpdater} = require('electron-updater')

// Enable logging
autoUpdater.logger = require('electron-log')
autoUpdater.logger.transports.file.level = 'info'

// Disable auto downloading
autoUpdater.autoDownload = false

// Check for updates
exports.check = () => {

  // Start update check
  autoUpdater.checkForUpdates()

  // Listen for download (update) found
  autoUpdater.on('update-available', () => {

    // Track progress percent
    let downloadProgress = 0

    // Prompt user to update
    dialog.showMessageBox({
      type: 'info',
      title: 'Mise à jour disponible',
      message: 'Une nouvelle version de cette application est disponible. Voulez-vous la mettre à jour maintenant ?',
      buttons: ['Mettre à jour', 'Non']
    }, (buttonIndex) => {

      // If not 'Update' button, return
      if(buttonIndex !== 0) return

      // Else start download and show download progress in new window
      autoUpdater.downloadUpdate()

      // Create progress window
      let progressWin = new BrowserWindow({
        width: 350,
        height: 70,
        useContentSize: true,
        autoHideMenuBar: true,
        maximizable: false,
        fullscreen: false,
        fullscreenable: false,
        resizable: false
      })

      // Load progress HTML
      
      progressWin.loadFile('renderer/progress.html')

      // Handle win close
      progressWin.on('closed', () => {
        progressWin = null
      })

      // Listen for preogress request from progressWin
      ipcMain.on('download-progress-request', (e) => {
        e.returnValue = downloadProgress
      })

      // Track download progress on autoUpdater
      autoUpdater.on('download-progress', (d) => {
        downloadProgress = d.percent
      })

      // Listen for completed update download
      autoUpdater.on('update-downloaded', () => {

        // Close progressWin
        if(progressWin) progressWin.close()

        // Prompt user to quit and install update
        dialog.showMessageBox({
          type: 'info',
          title: 'Prêt pour la mise à jour',
          message: 'Une nouvelle version de cette application est prête. Quitter et installer maintenant ?',
          buttons: ['Oui', 'Plus tard']
        }, (buttonIndex) => {

          // Update if 'Yes'
          if(buttonIndex === 0) autoUpdater.quitAndInstall()
        })
      })
    })
  })
}
