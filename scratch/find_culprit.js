const ts = require('typescript');
const fs = require('fs');

const filePath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx';

const program = ts.createProgram([filePath], {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.Latest,
  moduleResolution: ts.ModuleResolutionKind.NodeJs
});

const diagnostics = ts.getPreEmitDiagnostics(program);
console.log(`Found ${diagnostics.length} diagnostics.`);

diagnostics.forEach(diagnostic => {
  if (diagnostic.file && diagnostic.file.fileName === filePath) {
    const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    console.log(`Error at (${line + 1},${character + 1}): ${message}`);
  }
});
