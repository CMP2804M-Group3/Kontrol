const electronInstaller = require('electron-winstaller');


async function build(){
    try {
        await electronInstaller.createWindowsInstaller({
          appDirectory: 'Kontrol-win32-x64',
          outputDirectory: 'squirrel/',
          authors: 'Group 3',
          exe: 'Kontrol.exe'
        });
        console.log('It worked!');
      } catch (e) {
        console.log(`No dice: ${e.message}`);
      }
}

build()