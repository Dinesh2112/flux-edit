import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import MagicString from 'magic-string';
import { hasTailwindTokens, patchTailwindClasses } from './tailwind-patcher.js';

const traverse = traverseModule.default || traverseModule;

const PARSER_OPTS = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript'],
};

export function parseAst(code) {
  return parse(code, PARSER_OPTS);
}

export function parseLoc(loc) {
  const lastColon = loc.lastIndexOf(':');
  const secondLastColon = loc.lastIndexOf(':', lastColon - 1);
  if (lastColon === -1 || secondLastColon === -1) {
    throw new Error(`Invalid source location: ${loc}`);
  }
  return {
    file: loc.slice(0, secondLastColon),
    line: Number(loc.slice(secondLastColon + 1, lastColon)),
    col: Number(loc.slice(lastColon + 1)),
  };
}

function isInsideMapCallback(path) {
  let cur = path.parentPath;
  while (cur) {
    if (
      (cur.isArrowFunctionExpression() || cur.isFunctionExpression()) &&
      cur.parentPath?.isCallExpression()
    ) {
      const callee = cur.parentPath.node.callee;
      if (
        callee?.type === 'MemberExpression' &&
        ['map', 'flatMap'].includes(callee.property?.name)
      ) {
        return true;
      }
    }
    cur = cur.parentPath;
  }
  return false;
}

function collectDiskOpeningLocs(sourceCode) {
  const ast = parseAst(sourceCode);
  const locs = [];
  traverse(ast, {
    JSXOpeningElement(path) {
      const { node } = path;
      if (node.name.type !== 'JSXIdentifier') return;
      const tagName = node.name.name;
      if (!/^[a-z]/.test(tagName)) return;
      const line = node.loc?.start?.line;
      const col = node.loc?.start?.column;
      if (line == null || col == null) return;
      locs.push({ tagName, line, col, isDynamic: isInsideMapCallback(path) });
    },
  });
  return locs;
}

/**
 * Instruments lowercase intrinsic JSX tags with `data-fe-loc` (and `data-fe-dynamic` inside .map)
 * during Vite dev compilation so the browser overlay maps DOM nodes directly to source lines.
 * Optional `sourceCode` aligns line:col to exact disk positions even if prior plugins prepended code.
 */
export function instrumentJsx(code, relPath, sourceCode = null) {
  const ast = parseAst(code);
  const s = new MagicString(code);
  const diskLocs =
    sourceCode && sourceCode !== code ? collectDiskOpeningLocs(sourceCode) : null;
  let diskCursor = 0;
  let modified = false;

  traverse(ast, {
    JSXOpeningElement(path) {
      const { node } = path;
      if (node.name.type !== 'JSXIdentifier') return;

      const tagName = node.name.name;
      // Only tag intrinsic HTML/SVG DOM elements so custom components aren't polluted
      if (!/^[a-z]/.test(tagName)) return;

      const alreadyTagged = node.attributes.some(
        (attr) => attr.type === 'JSXAttribute' && attr.name?.name === 'data-fe-loc'
      );
      if (alreadyTagged) return;

      let line = node.loc?.start?.line;
      let col = node.loc?.start?.column;
      let isDynamic = isInsideMapCallback(path);

      if (diskLocs) {
        let matchedIdx = -1;
        for (let i = diskCursor; i < diskLocs.length; i++) {
          if (diskLocs[i].tagName === tagName) {
            matchedIdx = i;
            break;
          }
        }
        if (matchedIdx !== -1) {
          line = diskLocs[matchedIdx].line;
          col = diskLocs[matchedIdx].col;
          isDynamic = diskLocs[matchedIdx].isDynamic;
          diskCursor = matchedIdx + 1;
        }
      }

      if (line == null || col == null) return;

      const locAttr = ` data-fe-loc="${relPath}:${line}:${col}"`;
      const dynAttr = isDynamic ? ' data-fe-dynamic="true"' : '';
      s.appendLeft(node.name.end, locAttr + dynAttr);
      modified = true;
    },
  });

  if (!modified) return null;
  return {
    code: s.toString(),
    map: s.generateMap({ hires: true }),
  };
}

function findElementPathAtLoc(ast, line, col) {
  let exactMatch = null;
  const lineMatches = [];

  traverse(ast, {
    JSXElement(path) {
      const start = path.node.openingElement?.loc?.start;
      if (!start) return;
      if (start.line === line && start.column === col) {
        exactMatch = path;
        path.stop();
      } else if (start.line === line) {
        lineMatches.push(path);
      }
    },
  });

  return exactMatch || (lineMatches.length === 1 ? lineMatches[0] : null);
}

function getLineIndent(code, offset) {
  const lineStart = code.lastIndexOf('\n', offset - 1) + 1;
  const slice = code.slice(lineStart, offset);
  const match = slice.match(/^(\s*)/);
  return match ? match[1] : '';
}

function escapeJsxText(text) {
  const replacements = { '{': "{'{'}", '}': "{'}'}", '<': "{'<'}", '>': "{'>'}" };
  return text.replace(/[{}\<>]/g, (ch) => replacements[ch]);
}

function buildDiffSummary(prevCode, nextCode) {
  const prevLines = prevCode.split('\n');
  const nextLines = nextCode.split('\n');
  const diffs = [];
  const maxLen = Math.max(prevLines.length, nextLines.length);

  for (let i = 0; i < maxLen; i++) {
    const a = prevLines[i];
    const b = nextLines[i];
    if (a !== b) {
      if (a !== undefined) diffs.push({ type: 'remove', line: i + 1, text: a });
      if (b !== undefined) diffs.push({ type: 'add', line: i + 1, text: b });
    }
    if (diffs.length >= 8) break;
  }
  return diffs;
}

/**
 * Applies a surgical AST mutation to `code` and returns validated updated code + new location.
 */
export function applyAstMutation(code, relPath, loc, action, payload = {}) {
  const { line, col } = parseLoc(loc);
  const ast = parseAst(code);
  const targetPath = findElementPathAtLoc(ast, line, col);

  if (!targetPath) {
    throw new Error(`Element at ${relPath}:${line}:${col} not found (file may have changed).`);
  }

  const targetNode = targetPath.node;
  const openingEl = targetNode.openingElement;
  const s = new MagicString(code);
  let summary = '';
  let expectedLoc = { line, col };

  if (action === 'editText') {
    const newText = String(payload.text ?? '');
    if (openingEl.selfClosing) {
      throw new Error('Cannot edit text on a self-closing element.');
    }

    const instanceIdx = typeof payload.instanceIndex === 'number' ? payload.instanceIndex : 0;
    let handled = false;

    // Check if the element has a JSXExpressionContainer child (e.g. {s.title} or {headline})
    const exprContainer = targetNode.children.find((c) => c.type === 'JSXExpressionContainer');

    if (exprContainer) {
      const expr = exprContainer.expression;

      // Case A: Loop item member expression (e.g. {s.title} inside steps.map((s, idx) => ...))
      if (expr && expr.type === 'MemberExpression' && expr.property?.name) {
        const propName = expr.property.name;

        let cur = targetPath.parentPath;
        while (cur) {
          if (cur.isCallExpression() && ['map', 'flatMap'].includes(cur.node.callee?.property?.name)) {
            const calleeObj = cur.node.callee.object;
            const arrayName = calleeObj?.name;
            if (arrayName) {
              const binding = cur.scope.getBinding(arrayName);
              if (binding && binding.path.isVariableDeclarator()) {
                const init = binding.path.node.init;
                if (init && init.type === 'ArrayExpression') {
                  const targetItem = init.elements[instanceIdx];
                  if (targetItem && targetItem.type === 'ObjectExpression') {
                    const prop = targetItem.properties.find(
                      (p) => p.type === 'ObjectProperty' && (p.key.name === propName || p.key.value === propName)
                    );
                    if (prop && prop.value.type === 'StringLiteral') {
                      s.overwrite(prop.value.start, prop.value.end, JSON.stringify(newText));
                      summary = `Updated ${arrayName}[${instanceIdx}].${propName} to "${newText.slice(0, 32)}"`;
                      handled = true;
                      break;
                    }
                  }
                }
              }
            }
          }
          cur = cur.parentPath;
        }
      }

      // Case B: Direct variable identifier (e.g. {headline} or {title})
      if (!handled && expr && expr.type === 'Identifier') {
        const varName = expr.name;
        const binding = targetPath.scope.getBinding(varName);
        if (binding && binding.path.isVariableDeclarator()) {
          const init = binding.path.node.init;
          if (init && init.type === 'StringLiteral') {
            s.overwrite(init.start, init.end, JSON.stringify(newText));
            summary = `Updated variable "${varName}" to "${newText.slice(0, 32)}"`;
            handled = true;
          } else if (
            init &&
            init.type === 'CallExpression' &&
            init.callee?.name === 'useState' &&
            init.arguments[0]?.type === 'StringLiteral'
          ) {
            const firstArg = init.arguments[0];
            s.overwrite(firstArg.start, firstArg.end, JSON.stringify(newText));
            summary = `Updated useState initial value for "${varName}"`;
            handled = true;
          }
        }
      }

      // Case C: StringLiteral inside JSXExpressionContainer: {"Static string"}
      if (!handled && expr && expr.type === 'StringLiteral') {
        s.overwrite(expr.start, expr.end, JSON.stringify(newText));
        summary = `Updated text expression to "${newText.slice(0, 32)}"`;
        handled = true;
      }
    }

    // Case D: Static text or direct JSX replacement
    if (!handled) {
      const safeText = escapeJsxText(newText);
      const jsxTextChild = targetNode.children.find((c) => c.type === 'JSXText' && c.value.trim().length > 0);
      if (jsxTextChild) {
        // If element has other children (like an icon in a button), replace only the text node!
        const leadingSpace = /^\s+/.test(jsxTextChild.value) ? ' ' : '';
        const trailingSpace = /\s+$/.test(jsxTextChild.value) ? ' ' : '';
        s.overwrite(jsxTextChild.start, jsxTextChild.end, `${leadingSpace}${safeText}${trailingSpace}`);
      } else if (targetNode.children.length > 0) {
        const first = targetNode.children[0];
        const last = targetNode.children[targetNode.children.length - 1];
        s.overwrite(first.start, last.end, safeText);
      } else {
        s.appendRight(openingEl.end, safeText);
      }
      summary = `Updated text to "${newText.slice(0, 32)}"`;
    }
  } else if (action === 'updateStyle') {
    const updates = payload.styles || {};
    const classAttr = openingEl.attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name?.name === 'className'
    );
    const existingClass =
      classAttr && classAttr.value?.type === 'StringLiteral' ? classAttr.value.value : '';

    const useTailwind =
      payload.mode === 'tailwind' ||
      (payload.mode !== 'style' && (hasTailwindTokens(existingClass) || Boolean(payload.preferTailwind)));

    if (useTailwind && (existingClass || payload.mode === 'tailwind')) {
      const nextClasses = patchTailwindClasses(existingClass, updates);
      if (classAttr) {
        if (!nextClasses) {
          const removeStart =
            code[classAttr.start - 1] === ' ' ? classAttr.start - 1 : classAttr.start;
          s.remove(removeStart, classAttr.end);
        } else if (classAttr.value) {
          s.overwrite(classAttr.value.start, classAttr.value.end, JSON.stringify(nextClasses));
        } else {
          s.overwrite(classAttr.start, classAttr.end, `className=${JSON.stringify(nextClasses)}`);
        }
      } else if (nextClasses) {
        s.appendLeft(openingEl.name.end, ` className=${JSON.stringify(nextClasses)}`);
      }
      summary = `Updated Tailwind classes (${Object.keys(updates).join(', ')})`;
    } else {
      const styleAttr = openingEl.attributes.find(
        (a) => a.type === 'JSXAttribute' && a.name?.name === 'style'
      );

      if (styleAttr) {
        if (
          styleAttr.value?.type !== 'JSXExpressionContainer' ||
          styleAttr.value.expression?.type !== 'ObjectExpression'
        ) {
          throw new Error('Element uses a dynamic style expression; cannot patch statically.');
        }

        const objExpr = styleAttr.value.expression;
        const mergedProps = new Map();

        for (const prop of objExpr.properties) {
          if (prop.type === 'ObjectProperty' && !prop.computed) {
            const key = prop.key.name || prop.key.value;
            mergedProps.set(key, code.slice(prop.start, prop.end));
          } else {
            // Keep spread or computed properties intact by unique key
            mergedProps.set(`__raw_${prop.start}`, code.slice(prop.start, prop.end));
          }
        }

        for (const [key, val] of Object.entries(updates)) {
          if (key === 'gradient') continue;
          if (val === '' || val === null || val === undefined) {
            mergedProps.delete(key);
          } else {
            mergedProps.set(key, `${key}: ${JSON.stringify(String(val))}`);
          }
        }

        const entries = Array.from(mergedProps.values());
        if (entries.length === 0) {
          // Remove entire style={...} attribute including leading space
          const removeStart =
            code[styleAttr.start - 1] === ' ' ? styleAttr.start - 1 : styleAttr.start;
          s.remove(removeStart, styleAttr.end);
        } else {
          const objText = `{ ${entries.join(', ')} }`;
          s.overwrite(objExpr.start, objExpr.end, objText);
        }
      } else {
        const validPairs = Object.entries(updates).filter(
          ([k, val]) => k !== 'gradient' && val !== '' && val !== null && val !== undefined
        );
        if (validPairs.length > 0) {
          const propsStr = validPairs
            .map(([k, v]) => `${k}: ${JSON.stringify(String(v))}`)
            .join(', ');
          s.appendLeft(openingEl.name.end, ` style={{ ${propsStr} }}`);
        }
      }
      summary = `Updated styles (${Object.keys(updates).join(', ')})`;
    }
  } else if (action === 'updateClassName') {
    const nextClass = String(payload.className ?? '').trim();
    const classAttr = openingEl.attributes.find(
      (a) => a.type === 'JSXAttribute' && a.name?.name === 'className'
    );

    if (classAttr) {
      if (classAttr.value && classAttr.value.type !== 'StringLiteral') {
        throw new Error('className uses a dynamic JS expression; edit class string manually.');
      }
      if (!nextClass) {
        const removeStart =
          code[classAttr.start - 1] === ' ' ? classAttr.start - 1 : classAttr.start;
        s.remove(removeStart, classAttr.end);
      } else if (classAttr.value) {
        s.overwrite(classAttr.value.start, classAttr.value.end, JSON.stringify(nextClass));
      } else {
        s.overwrite(classAttr.start, classAttr.end, `className=${JSON.stringify(nextClass)}`);
      }
    } else if (nextClass) {
      s.appendLeft(openingEl.name.end, ` className=${JSON.stringify(nextClass)}`);
    }
    summary = `Updated className`;
  } else if (action === 'moveSibling') {
    const parent = targetPath.parentPath;
    if (!parent || !parent.isJSXElement()) {
      throw new Error('Cannot reorder top-level root element.');
    }

    const siblings = parent.node.children.filter((c) => c.type === 'JSXElement');
    const srcIdx = siblings.indexOf(targetNode);
    if (srcIdx === -1) throw new Error('Element not found among parent JSX siblings.');

    let destIdx = srcIdx;
    if (payload.direction === 'prev') {
      if (srcIdx === 0) throw new Error('Element is already first in container.');
      destIdx = srcIdx - 1;
    } else if (payload.direction === 'next') {
      if (srcIdx === siblings.length - 1) throw new Error('Element is already last in container.');
      destIdx = srcIdx + 1;
    } else if (payload.targetLoc) {
      const targetParsed = parseLoc(payload.targetLoc);
      if (targetParsed.file !== relPath) {
        throw new Error(
          `Cannot drag across files (${relPath} -> ${targetParsed.file}). Move elements within the same component file.`
        );
      }

      const foundIdx = siblings.findIndex(
        (sib) =>
          sib.openingElement?.loc?.start?.line === targetParsed.line &&
          sib.openingElement?.loc?.start?.column === targetParsed.col
      );

      if (foundIdx !== -1) {
        destIdx = foundIdx;
      } else {
        // Cross-container move within the same file!
        const destPath = findElementPathAtLoc(ast, targetParsed.line, targetParsed.col);
        if (!destPath) {
          throw new Error('Drop target element not found in source file.');
        }
        const destNode = destPath.node;
        if (
          destNode === targetNode ||
          (destNode.start >= targetNode.start && destNode.end <= targetNode.end)
        ) {
          throw new Error('Cannot move an element inside itself.');
        }
        if (targetNode.start >= destNode.start && targetNode.end <= destNode.end) {
          throw new Error('Cannot drop a child onto its own parent container.');
        }

        const lineStart = code.lastIndexOf('\n', targetNode.start - 1) + 1;
        const beforeOnLine = code.slice(lineStart, targetNode.start);
        const nextCharIdx = targetNode.end;
        const isOwnLine =
          /^\s*$/.test(beforeOnLine) &&
          (code[nextCharIdx] === '\n' || code.slice(nextCharIdx, nextCharIdx + 2) === '\r\n');

        let removeStart = targetNode.start;
        let removeEnd = targetNode.end;
        if (isOwnLine) {
          const nlLen = code.slice(nextCharIdx, nextCharIdx + 2) === '\r\n' ? 2 : 1;
          removeStart = lineStart;
          removeEnd = nextCharIdx + nlLen;
        }

        const elementCode = code.slice(targetNode.start, targetNode.end);
        const destCanHaveSiblingBefore =
          destPath.parentPath?.isJSXElement() || destPath.parentPath?.isJSXFragment();
        let insertAt = destNode.start;
        let insertedText;

        if (destCanHaveSiblingBefore) {
          const destIndent = getLineIndent(code, destNode.start);
          insertedText = `${elementCode}\n${destIndent}`;
        } else if (!destNode.openingElement.selfClosing && destNode.closingElement) {
          const closeIndent = getLineIndent(code, destNode.closingElement.start);
          insertAt = destNode.closingElement.start;
          insertedText = `  ${elementCode}\n${closeIndent}`;
        } else {
          throw new Error('Cannot drop element outside root JSX wrapper.');
        }

        s.remove(removeStart, removeEnd);
        s.appendLeft(insertAt, insertedText);

        const removedLen = removeEnd - removeStart;
        const movedOffset =
          removeEnd <= insertAt ? insertAt - removedLen : insertAt;

        const nextCode = s.toString();
        const nextAst = parseAst(nextCode);
        const prefix = nextCode.slice(0, movedOffset);
        const lines = prefix.split('\n');
        const calcLine = lines.length;
        const calcCol = lines[lines.length - 1].length;
        const rechecked = findElementPathAtLoc(nextAst, calcLine, calcCol);
        const newLocCross = rechecked
          ? `${relPath}:${rechecked.node.openingElement.loc.start.line}:${rechecked.node.openingElement.loc.start.column}`
          : `${relPath}:${calcLine}:${calcCol}`;

        return {
          nextCode,
          summary: `Moved <${openingEl.name.name}> into new position`,
          newLoc: newLocCross,
          diffLines: buildDiffSummary(code, nextCode),
        };
      }
    }

    if (destIdx === srcIdx) {
      return { nextCode: code, summary: 'No position change', newLoc: loc, diffLines: [] };
    }

    // Build reordered sibling array while preserving exact whitespace/comments between slots
    const reordered = [...siblings];
    const [movedNode] = reordered.splice(srcIdx, 1);
    reordered.splice(destIdx, 0, movedNode);

    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i] !== reordered[i]) {
        s.overwrite(siblings[i].start, siblings[i].end, code.slice(reordered[i].start, reordered[i].end));
      }
    }

    // Compute exact byte offset of the moved element in nextCode
    let movedOffset = siblings[0].start;
    for (let i = 0; i < destIdx; i++) {
      movedOffset += reordered[i].end - reordered[i].start;
      movedOffset += siblings[i + 1].start - siblings[i].end;
    }

    expectedLoc = { exactOffset: movedOffset };
    summary = `Moved <${openingEl.name.name}> to position #${destIdx + 1}`;
  } else if (action === 'duplicateElement') {
    const parent = targetPath.parentPath;
    if (!parent || !parent.isJSXElement()) {
      throw new Error('Cannot duplicate root return element.');
    }
    const indent = getLineIndent(code, targetNode.start);
    const elementCode = code.slice(targetNode.start, targetNode.end);
    s.appendRight(targetNode.end, `\n${indent}${elementCode}`);
    summary = `Duplicated <${openingEl.name.name}>`;
  } else if (action === 'deleteElement') {
    const parent = targetPath.parentPath;
    if (!parent || !parent.isJSXElement()) {
      throw new Error('Cannot delete root return element.');
    }
    // Remove element and clean up preceding indent if it sits on its own line
    const lineStart = code.lastIndexOf('\n', targetNode.start - 1) + 1;
    const beforeOnLine = code.slice(lineStart, targetNode.start);
    const nextCharIdx = targetNode.end;
    const isOwnLine = /^\s*$/.test(beforeOnLine) && (code[nextCharIdx] === '\n' || code.slice(nextCharIdx, nextCharIdx + 2) === '\r\n');

    if (isOwnLine) {
      const nlLen = code.slice(nextCharIdx, nextCharIdx + 2) === '\r\n' ? 2 : 1;
      s.remove(lineStart, nextCharIdx + nlLen);
    } else {
      s.remove(targetNode.start, targetNode.end);
    }
    expectedLoc = null;
    summary = `Deleted <${openingEl.name.name}>`;
  } else {
    throw new Error(`Unknown action: ${action}`);
  }

  const nextCode = s.toString();

  // Safety gate: Validate syntax with Babel before allowing disk write
  const nextAst = parseAst(nextCode);

  let newLoc = null;
  if (expectedLoc) {
    if (typeof expectedLoc.exactOffset === 'number') {
      const prefix = nextCode.slice(0, expectedLoc.exactOffset);
      const lines = prefix.split('\n');
      const calcLine = lines.length;
      const calcCol = lines[lines.length - 1].length;
      const rechecked = findElementPathAtLoc(nextAst, calcLine, calcCol);
      if (rechecked) {
        const st = rechecked.node.openingElement.loc.start;
        newLoc = `${relPath}:${st.line}:${st.column}`;
      } else {
        newLoc = `${relPath}:${calcLine}:${calcCol}`;
      }
    } else {
      const rechecked = findElementPathAtLoc(nextAst, expectedLoc.line, expectedLoc.col);
      if (rechecked) {
        const st = rechecked.node.openingElement.loc.start;
        newLoc = `${relPath}:${st.line}:${st.column}`;
      } else {
        newLoc = loc;
      }
    }
  }

  return {
    nextCode,
    summary,
    newLoc,
    diffLines: buildDiffSummary(code, nextCode),
  };
}
