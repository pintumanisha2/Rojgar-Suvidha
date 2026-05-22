const ts = require('typescript');
const fs = require('fs');

const originalPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx';
const tempPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.temp.tsx';

const code = fs.readFileSync(originalPath, 'utf8');

const tabs = [
  { name: "applications", start: 1013, end: 1097 },
  { name: "mock-interview", start: 1100, end: 1291 },
  { name: "ats-optimizer", start: 1294, end: 1476 },
  { name: "profile", start: 1479, end: 2121 },
  { name: "messages", start: 2124, end: 2240 }
];

const lines = code.split('\n');
const modifiedLines = [...lines];

// Disable all tabs
for (const tab of tabs) {
  const startIndex = tab.start - 1;
  const endIndex = tab.end - 1;
  modifiedLines[startIndex] = `{activeTab === "${tab.name}" && ( <div>Disabled</div> )}`;
  for (let i = startIndex + 1; i <= endIndex; i++) {
    modifiedLines[i] = '';
  }
}

fs.writeFileSync(tempPath, modifiedLines.join('\n'), 'utf8');

const program = ts.createProgram([tempPath], {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.Latest,
  moduleResolution: ts.ModuleResolutionKind.NodeJs
});

const diagnostics = ts.getPreEmitDiagnostics(program);
const syntaxErrors = diagnostics.filter(d => d.file && d.file.fileName === tempPath);

console.log(`Disabling ALL tabs: ${syntaxErrors.length > 0 ? "STILL HAS ERROR" : "NO ERROR!"}`);
syntaxErrors.forEach(d => {
  const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`  (${line + 1},${character + 1}): ${msg}`);
});

if (fs.existsSync(tempPath)) {
  fs.unlinkSync(tempPath);
}
