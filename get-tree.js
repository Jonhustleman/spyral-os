const fs = require('fs');
const path = require('path');

const excludes = new Set(['node_modules', '.next', '.git', '.cycle']);

function walk(dir, prefix = '') {
  let items;
  try {
    items = fs.readdirSync(dir);
  } catch {
    return;
  }
  items = items.filter(f => !excludes.has(f));
  items.sort((a, b) => {
    const aIsDir = fs.statSync(path.join(dir, a)).isDirectory();
    const bIsDir = fs.statSync(path.join(dir, b)).isDirectory();
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });
  
  items.forEach((f, i) => {
    const p = path.join(dir, f);
    let stat;
    try { stat = fs.statSync(p); } catch { return; }
    const isLast = i === items.length - 1;
    const conn = isLast ? '\\--- ' : '|--- ';
    const childPrefix = prefix + (isLast ? '    ' : '|   ');
    
    if (stat.isDirectory()) {
      console.log(prefix + conn + '[' + f + ']');
      walk(p, childPrefix);
    } else {
      console.log(prefix + conn + f);
    }
  });
}

walk('C:\\spyral-os');
