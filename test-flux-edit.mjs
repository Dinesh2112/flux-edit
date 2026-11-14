import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  assertAuthorizedRequest,
  resolveSafeWorkspacePath,
  atomicWriteFileSync,
} from './packages/flux-edit/security.js';
import {
  pxToSpacingToken,
  pxToRadiusToken,
  hasTailwindTokens,
  patchTailwindClasses,
} from './packages/flux-edit/tailwind-patcher.js';
import { applyAstMutation } from './packages/flux-edit/ast-patcher.js';

let passed = 0;
let total = 0;

function it(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    console.error(`  ✗ ${name}:`, err.message);
    throw err;
  }
}

console.log('\n🔒 RUNNING FLUXEDIT SECURITY TEST SUITE...');

it('assertAuthorizedRequest should reject requests missing x-flux-client header', () => {
  assert.throws(
    () => assertAuthorizedRequest({ headers: {} }),
    (err) => err.statusCode === 403 && err.message.includes('missing required security header')
  );
});

it('assertAuthorizedRequest should reject requests from malicious cross-origin domains', () => {
  assert.throws(
    () =>
      assertAuthorizedRequest({
        headers: {
          'x-flux-client': 'true',
          origin: 'https://evil-attacker.com',
        },
      }),
    (err) => err.statusCode === 403 && err.message.includes('untrusted origin')
  );
});

it('assertAuthorizedRequest should permit legitimate localhost requests', () => {
  assert.doesNotThrow(() =>
    assertAuthorizedRequest({
      headers: {
        'x-flux-client': 'true',
        origin: 'http://localhost:5173',
      },
    })
  );
  assert.doesNotThrow(() =>
    assertAuthorizedRequest({
      headers: {
        'x-flux-client': 'true',
        origin: 'http://127.0.0.1:5173',
      },
    })
  );
});

it('resolveSafeWorkspacePath should reject path traversal (../) attacks', () => {
  assert.throws(
    () => resolveSafeWorkspacePath('../../../etc/passwd.jsx', process.cwd()),
    (err) => err.message.includes('Security violation')
  );
});

it('resolveSafeWorkspacePath should reject prohibited file extensions', () => {
  assert.throws(
    () => resolveSafeWorkspacePath('package.json', process.cwd()),
    (err) => err.message.includes('file extension ".json" is not permitted')
  );
});

it('resolveSafeWorkspacePath should reject null byte injection', () => {
  assert.throws(
    () => resolveSafeWorkspacePath('src/App.jsx\0.txt', process.cwd()),
    (err) => err.message.includes('null bytes')
  );
});

it('resolveSafeWorkspacePath should safely resolve legitimate source files', () => {
  const resolved = resolveSafeWorkspacePath('src/App.jsx', process.cwd());
  assert.ok(fs.existsSync(resolved));
});

it('atomicWriteFileSync should write file atomically and cleanly', () => {
  const testFile = path.resolve('src/.test_atomic_write.jsx');
  try {
    atomicWriteFileSync(testFile, '// test atomic write');
    assert.strictEqual(fs.readFileSync(testFile, 'utf-8'), '// test atomic write');
  } finally {
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
  }
});

console.log('\n🎨 RUNNING TAILWIND RECONCILIATION TEST SUITE...');

it('pxToSpacingToken converts pixel values accurately', () => {
  assert.strictEqual(pxToSpacingToken(0), '0');
  assert.strictEqual(pxToSpacingToken(4), '1');
  assert.strictEqual(pxToSpacingToken(8), '2');
  assert.strictEqual(pxToSpacingToken(16), '4');
  assert.strictEqual(pxToSpacingToken(24), '6');
  assert.strictEqual(pxToSpacingToken(32), '8');
});

it('pxToRadiusToken converts radius values accurately', () => {
  assert.strictEqual(pxToRadiusToken(0), 'none');
  assert.strictEqual(pxToRadiusToken(2), 'sm');
  assert.strictEqual(pxToRadiusToken(4), ''); // empty string renders as 'rounded'
  assert.strictEqual(pxToRadiusToken(6), 'md');
  assert.strictEqual(pxToRadiusToken(8), 'lg');
  assert.strictEqual(pxToRadiusToken(12), 'xl');
  assert.strictEqual(pxToRadiusToken(16), '2xl');
  assert.strictEqual(pxToRadiusToken(999), 'full');
});

it('hasTailwindTokens accurately detects Tailwind classes', () => {
  assert.strictEqual(hasTailwindTokens('flex items-center p-4 bg-white'), true);
  assert.strictEqual(hasTailwindTokens('my-custom-btn regular-class'), false);
});

it('patchTailwindClasses replaces existing padding token while preserving others', () => {
  const updated = patchTailwindClasses('font-bold p-2 text-blue-500', { padding: 16 });
  assert.strictEqual(updated, 'font-bold p-4 text-blue-500');
});

it('patchTailwindClasses replaces border radius token cleanly', () => {
  const updated = patchTailwindClasses('rounded-md border p-4', { borderRadius: 16 });
  assert.strictEqual(updated, 'rounded-2xl border p-4');
});

it('patchTailwindClasses supports individual corner radius tokens', () => {
  const corners = patchTailwindClasses('border p-4', { borderTopLeftRadius: 12, borderTopRightRadius: 12 });
  assert.strictEqual(corners, 'border p-4 rounded-tl-xl rounded-tr-xl');
});

it('pxToRadiusToken supports arbitrary values when outside standard token scale', () => {
  assert.strictEqual(pxToRadiusToken(42), '[42px]');
});

console.log('\n⚡ RUNNING AST MUTATION TEST SUITE...');

const sampleJsx = `import React from 'react';
export default function Card() {
  return (
    <div className="card-container">
      <h1 className="title">Original Title</h1>
      <button className="btn">Click Me</button>
    </div>
  );
}`;

it('applyAstMutation editText with character escaping', () => {
  const res = applyAstMutation(sampleJsx, 'Card.jsx', 'Card.jsx:5:7', 'editText', {
    text: 'Updated Title <with brackets & {braces}>',
  });
  assert.ok(res.nextCode.includes(`Updated Title {'<'}with brackets & {'{'}braces{'}'}{'>'}`));
});

it('applyAstMutation editText updates loop array items cleanly', () => {
  const loopJsx = `const steps = [
  { title: 'Step 1' },
  { title: 'Step 2' },
];
export function HowItWorks() {
  return (
    <div>
      {steps.map((s, idx) => (
        <h3 className="title">{s.title}</h3>
      ))}
    </div>
  );
}`;
  const res = applyAstMutation(loopJsx, 'HowItWorks.jsx', 'HowItWorks.jsx:9:9', 'editText', {
    text: 'Updated Step 2 Text',
    instanceIndex: 1,
  });
  assert.ok(res.nextCode.includes(`title: "Updated Step 2 Text"`));
  assert.ok(res.nextCode.includes(`title: 'Step 1'`));
});

it('applyAstMutation editText updates variable declarator when text uses identifier', () => {
  const varJsx = `export function Hero() {
  const headline = 'Original Headline';
  return <h1>{headline}</h1>;
}`;
  const res = applyAstMutation(varJsx, 'Hero.jsx', 'Hero.jsx:3:10', 'editText', {
    text: 'New Headline Text',
  });
  assert.ok(res.nextCode.includes(`const headline = "New Headline Text";`));
});

it('applyAstMutation updateClassName updates class cleanly', () => {
  const res = applyAstMutation(sampleJsx, 'Card.jsx', 'Card.jsx:6:7', 'updateClassName', {
    className: 'btn btn-primary active',
  });
  assert.ok(res.nextCode.includes('className="btn btn-primary active"'));
});

it('applyAstMutation moveSibling reorders children in AST', () => {
  const res = applyAstMutation(sampleJsx, 'Card.jsx', 'Card.jsx:6:7', 'moveSibling', {
    direction: 'prev',
  });
  // Button should now precede h1
  const btnIdx = res.nextCode.indexOf('<button');
  const h1Idx = res.nextCode.indexOf('<h1');
  assert.ok(btnIdx !== -1 && h1Idx !== -1 && btnIdx < h1Idx);
});

it('applyAstMutation duplicateElement clones element in AST', () => {
  const res = applyAstMutation(sampleJsx, 'Card.jsx', 'Card.jsx:6:7', 'duplicateElement', {});
  const matches = res.nextCode.match(/<button/g);
  assert.strictEqual(matches?.length, 2);
});

it('applyAstMutation deleteElement removes element from AST', () => {
  const res = applyAstMutation(sampleJsx, 'Card.jsx', 'Card.jsx:6:7', 'deleteElement', {});
  assert.strictEqual(res.nextCode.includes('<button'), false);
});

console.log('\n⚙️ RUNNING VITE PLUGIN & AUTO-INJECTION TEST SUITE...');

import fluxEdit from './packages/flux-edit/vite-plugin.js';

const plugin = fluxEdit();
plugin.configResolved({ root: process.cwd() });

it('transformIndexHtml automatically injects /@flux-edit/client', () => {
  const htmlResult = plugin.transformIndexHtml('<!DOCTYPE html><html><body></body></html>');
  assert.ok(Array.isArray(htmlResult));
  assert.strictEqual(htmlResult[0].attrs.src, '/@flux-edit/client');
});

it('resolveId properly resolves virtual module identifier', () => {
  const resolved = plugin.resolveId('/@flux-edit/client');
  assert.strictEqual(resolved, '\0flux-edit:client');
});

it('load generates self-mounting React DOM entry code', () => {
  const code = plugin.load('\0flux-edit:client');
  assert.ok(code.includes('mountFluxEdit'));
  assert.ok(code.includes('createRoot'));
  assert.ok(code.includes('VisualEditor'));
});

it('transform instruments JSX with data-fe-loc markers', () => {
  const sampleBtn = 'export function Button() { return <button>Click</button>; }';
  const transformed = plugin.transform(sampleBtn, path.resolve('src/Button.jsx'));
  assert.ok(transformed.code.includes('data-fe-loc="src/Button.jsx:'));
});

it('transform strictly ignores internal FluxEdit client code', () => {
  const internal = plugin.transform(
    'export function VisualEditor() { return null; }',
    path.resolve('packages/flux-edit/client/VisualEditor.jsx')
  );
  assert.strictEqual(internal, null);
});

console.log(`\n🎉 ALL ${passed}/${total} TESTS PASSED WITH 100% SUCCESS!`);
