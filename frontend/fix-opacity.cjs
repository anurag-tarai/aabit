const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    const newContent = content.replace(/neutral-(\d+)\/(\d+)/g, 'neutral-$1');
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent);
      count++;
    }
  }
});
console.log(`Updated ${count} files to remove opacity modifiers on neutral colors.`);
