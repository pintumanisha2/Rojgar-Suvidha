const fs = require('fs');

const code = fs.readFileSync('/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx', 'utf8');

const stack = [];
let inString = null;
let inComment = false;

for (let i = 0; i < code.length; i++) {
  const char = code[i];
  const nextChar = code[i + 1];

  if (inComment) {
    if (char === '*' && nextChar === '/') {
      inComment = false;
      i++;
    }
    continue;
  }

  if (inString) {
    if (char === '\\') {
      i++;
      continue;
    }
    if (char === inString) {
      inString = null;
    }
    continue;
  }

  if (char === '/' && nextChar === '*') {
    inComment = true;
    i++;
    continue;
  }

  if (char === '/' && nextChar === '/') {
    while (i < code.length && code[i] !== '\n') {
      i++;
    }
    continue;
  }

  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  const substr = code.substring(0, i);
  const lineNum = substr.split('\n').length;
  const colNum = substr.substring(substr.lastIndexOf('\n') + 1).length + 1;

  if (char === '{' || char === '(' || char === '[') {
    stack.push({ char, line: lineNum, col: colNum });
  } else if (char === '}' || char === ')' || char === ']') {
    if (stack.length === 0) {
      console.log(`Error: Unmatched closing '${char}' at Line ${lineNum}, col ${colNum}`);
    } else {
      const top = stack.pop();
      const match = (top.char === '{' && char === '}') ||
                    (top.char === '(' && char === ')') ||
                    (top.char === '[' && char === ']');
      if (!match) {
        console.log(`Nesting Mismatch: Opened '${top.char}' at Line ${top.line}, col ${top.col} but closed with '${char}' at Line ${lineNum}, col ${colNum}`);
        // Put it back to keep tracking or stop
        break;
      }
    }
  }
}

console.log('Nesting scan complete. Remaining stack size:', stack.length);
if (stack.length > 0) {
  console.log('Top of remaining stack:', stack.slice(-5));
}
