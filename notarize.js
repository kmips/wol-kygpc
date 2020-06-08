const { notarize } = require('electron-notarize');
const os = require("os");
// Variable to hold the path to the home directory.
let homeDir = os.homedir();

// Location of the .env file.
require('dotenv').config({ path: homeDir + "/" +  ".env"  });


exports.default = async function notarizing(context) {
  const {electronPlatformName, appOutDir} = context

  if (electronPlatformName !== 'darwin') {
    return;
  }

  const appName = context.packager.appInfo.productFilename;

  return await notarize({
    appBundleId: process.env.npm_package_build_appId,
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.devID,
    appleIdPassword: process.env.devPass, // Use app specific password.
  });
};
