const fs = require('fs');

const code = fs.readFileSync('/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx', 'utf8');
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('/') && !line.includes('//') && !line.includes('/*') && !line.includes('https://') && !line.includes('http://')) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
