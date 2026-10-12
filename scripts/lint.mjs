import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import babel from '@babel/core';
import * as prettier from 'prettier';

// Use the Babel toolchain already installed by the Vite React plugin. No new dependencies.
const { parseSync, traverse } = babel;
const globals = new Set([
  'AbortController',
  'Array',
  'Boolean',
  'Date',
  'DOMException',
  'Error',
  'Infinity',
  'Intl',
  'JSON',
  'Map',
  'Math',
  'Number',
  'NodeFilter',
  'Object',
  'Promise',
  'Set',
  'String',
  'TextEncoder',
  'TypeError',
  'Uint8Array',
  'URL',
  'URLSearchParams',
  'clearInterval',
  'clearTimeout',
  'crypto',
  'document',
  'fetch',
  'getComputedStyle',
  'innerWidth',
  'localStorage',
  'process',
  'parseFloat',
  'setInterval',
  'setTimeout',
  'undefined',
]);
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(
    (file) =>
      /\.(?:[cm]?js|jsx|css|json|html|md)$/.test(file) && !file.endsWith('package-lock.json'),
  );
let issues = 0;
const report = (file, rule, line = 1) => {
  // Only report locations and rule names, never source snippets or literal values.
  process.stderr.write(`${file}:${line}: ${rule}\n`);
  issues += 1;
};
for (const file of files) {
  const source = await readFile(file, 'utf8');
  const options = { ...(await prettier.resolveConfig(file)), filepath: file };
  if (!(await prettier.check(source, options))) report(file, 'formatting');
  if (!/\.(?:[cm]?js|jsx)$/.test(file)) continue;
  let ast;
  try {
    ast = parseSync(source, {
      babelrc: false,
      configFile: false,
      sourceType: 'module',
      parserOpts: { plugins: ['jsx'] },
    });
  } catch {
    report(file, 'syntax');
    continue;
  }
  for (const comment of ast.comments || [])
    if (/\b(?:TODO|FIXME)\b/.test(comment.value))
      report(file, 'unfinished-comment', comment.loc.start.line);
  const seen = new Set();
  traverse(ast, {
    Scope(path) {
      for (const binding of Object.values(path.scope.bindings)) {
        if (seen.has(binding)) continue;
        seen.add(binding);
        if (!binding.referenced && !binding.identifier.name.startsWith('_'))
          report(file, 'unused-binding', binding.identifier.loc.start.line);
      }
    },
    ReferencedIdentifier(path) {
      const name = path.node.name;
      if (!path.scope.hasBinding(name) && !globals.has(name))
        report(file, 'undefined-name', path.node.loc.start.line);
    },
    DebuggerStatement(path) {
      report(file, 'debugger-statement', path.node.loc.start.line);
    },
    MemberExpression(path) {
      if (path.node.object.name === 'console')
        report(file, 'console-call', path.node.loc.start.line);
    },
    JSXOpeningElement(path) {
      if (
        path.node.name.name === 'img' &&
        !path.node.attributes.some((attr) => attr.name?.name === 'alt')
      )
        report(file, 'image-alt-required', path.node.loc.start.line);
    },
  });
}
if (issues) process.exitCode = 1;
else
  process.stdout.write(
    `Lint passed: ${files.length} tracked files; formatting, syntax, unused bindings, undefined names, console/debugger, comments, and image alt checks.\n`,
  );
