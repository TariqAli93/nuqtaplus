import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const packagesDir = path.join(projectRoot, 'packages');
const distDirName = path.join(packagesDir, 'frontend', 'dist-electron');
const backendDistDir = path.join(projectRoot, 'dist-backend');
const releaseDir = path.join(projectRoot, 'release');
const dataDir = path.join(packagesDir, 'backend', 'data');

function deleteFolderRecursive(folderPath) {
  if (fs.existsSync(folderPath)) {
    fs.readdirSync(folderPath).forEach((file) => {
      const curPath = path.join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(folderPath);
  }
}
function cleanDistDirectories() {
  console.log('Cleaning distribution directories...');
  deleteFolderRecursive(distDirName);
  deleteFolderRecursive(backendDistDir);
  deleteFolderRecursive(releaseDir);
  deleteFolderRecursive(dataDir);
  console.log('Clean-up completed.');
}
cleanDistDirectories();
