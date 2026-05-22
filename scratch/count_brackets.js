const fs = require('fs');

const code = fs.readFileSync('/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx', 'utf8');

let braces = [];
let parens = [];
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
    // skip to next newline
    while (i < code.length && code[i] !== '\n') {
      i++;
    }
    continue;
  }

  if (char === '"' || char === "'" || char === '`') {
    inString = char;
    continue;
  }

  // Get line and column
  const substr = code.substring(0, i);
  const lineNum = substr.split('\n').length;
  const colNum = substr.substring(substr.lastIndexOf('\n') + 1).length + 1;

  if (char === '{') {
    braces.push({ line: lineNum, col: colNum });
  } else if (char === '}') {
    if (braces.length === 0) {
      console.log(`Unmatched closing brace '}' at Line ${lineNum}, col ${colNum}`);
    } else {
      braces.pop();
    }
  } else if (char === '(') {
    parens.push({ line: lineNum, col: colNum });
  } else if (char === ')') {
    if (parens.length === 0) {
      console.log(`Unmatched closing paren ')' at Line ${lineNum}, col ${colNum}`);
    } else {
      parens.pop();
    }
  }
}

console.log('Unclosed braces at EOF:', braces);
console.log('Unclosed parens at EOF:', parens);
