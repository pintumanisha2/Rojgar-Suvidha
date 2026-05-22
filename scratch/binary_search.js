const ts = require('typescript');
const fs = require('fs');

const originalPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx';
const tempPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.temp.tsx';

const code = fs.readFileSync(originalPath, 'utf8');

// The lines where tabs start and end (approximate bounds)
const tabs = [
  { name: "applications", start: 1013, end: 1097 },
  { name: "mock-interview", start: 1100, end: 1291 },
  { name: "ats-optimizer", start: 1294, end: 1476 },
  { name: "profile", start: 1479, end: 2121 },
  { name: "messages", start: 2124, end: 2240 }
];

function testTabDisabling(tabToDisable) {
  const lines = code.split('\n');
  const startIndex = tabToDisable.start - 1;
  const endIndex = tabToDisable.end - 1;

  // Replace lines belonging to the tab with a dummy div
  const modifiedLines = [...lines];
  modifiedLines[startIndex] = `{activeTab === "${tabToDisable.name}" && ( <div>Disabled</div> )}`;
  for (let i = startIndex + 1; i <= endIndex; i++) {
    modifiedLines[i] = '';
  }

  fs.writeFileSync(tempPath, modifiedLines.join('\n'), 'utf8');

  const program = ts.createProgram([tempPath], {
    jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.Latest,
    moduleResolution: ts.ModuleResolutionKind.NodeJs
  });

  const diagnostics = ts.getPreEmitDiagnostics(program);
  const syntaxErrors = diagnostics.filter(d => d.file && d.file.fileName === tempPath);
  
  const hasTargetError = syntaxErrors.some(d => {
    const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    return msg.includes("expected") || msg.includes("Expression expected");
  });

  console.log(`Disabling tab "${tabToDisable.name}": ${hasTargetError ? "STILL HAS ERROR" : "NO ERROR! (Culprit found!)"}`);
  if (!hasTargetError) {
    console.log("Syntax errors after disabling:");
    syntaxErrors.forEach(d => {
      const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      console.log(`  (${line + 1},${character + 1}): ${msg}`);
    });
  }
}

console.log("Starting diagnostic binary search...");
for (const tab of tabs) {
  testTabDisabling(tab);
}

// Cleanup temp file
if (fs.existsSync(tempPath)) {
  fs.unlinkSync(tempPath);
}
