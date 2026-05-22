const ts = require('typescript');
const fs = require('fs');

const originalPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.tsx';
const testPath = '/Users/pintukumar/Desktop/rojgar-suvidha/src/app/private-jobs/dashboard/page.test-fix.tsx';

let code = fs.readFileSync(originalPath, 'utf8');

// Insert the missing banner div right after the banner comment
const targetComment = '{/* Header Dashboard Banner */}';
const insertIndex = code.indexOf(targetComment) + targetComment.length;

const bannerDiv = '\n        <div className="relative overflow-hidden bg-slate-950 text-white rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-900 shadow-2xl">';
const modifiedCode = code.substring(0, insertIndex) + bannerDiv + code.substring(insertIndex);

fs.writeFileSync(testPath, modifiedCode, 'utf8');

const program = ts.createProgram([testPath], {
  jsx: ts.JsxEmit.ReactJSX,
  target: ts.ScriptTarget.Latest,
  moduleResolution: ts.ModuleResolutionKind.NodeJs
});

const diagnostics = ts.getPreEmitDiagnostics(program);
const syntaxErrors = diagnostics.filter(d => d.file && d.file.fileName === testPath);

console.log(`With fix applied: ${syntaxErrors.length > 0 ? "STILL HAS ERROR" : "NO SYNTAX ERRORS!"}`);
syntaxErrors.forEach(d => {
  const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start);
  const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
  console.log(`  (${line + 1},${character + 1}): ${msg}`);
});

if (fs.existsSync(testPath)) {
  fs.unlinkSync(testPath);
}
