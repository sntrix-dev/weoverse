// Converts one section of the design's compiled DS bundle (js/ds/_ds_bundle.js) back into TSX.
// Used once in M01 to port the design system; kept for traceability and for porting any DS
// component later. Needs: npm i -D @babel/parser@7 @babel/traverse@7 @babel/generator@7 @babel/types@7
// usage: node scripts/ds2tsx.mjs <bundle> components/<group>/<Name>.jsx <out.tsx> [import-map.json]
import fs from 'node:fs';
import { parse } from '@babel/parser';
import traverseMod from '@babel/traverse';
import generateMod from '@babel/generator';
import * as t from '@babel/types';
import prettier from 'prettier';
const traverse = traverseMod.default;
const generate = generateMod.default;

const [, , bundlePath, section, outFile, importMapJson] = process.argv;
const importMap = importMapJson ? JSON.parse(fs.readFileSync(importMapJson, 'utf8')) : {};
const src = fs.readFileSync(bundlePath, 'utf8');
const start = src.indexOf(`// ${section}\ntry { (() => {`);
if (start < 0) throw new Error('section not found ' + section);
const bodyStart = src.indexOf('try { (() => {', start) + 'try { (() => {'.length;
const end = src.indexOf(`})(); } catch (e) { __ds_ns.__errors.push({ path: "${section}"`, bodyStart);
let code = src.slice(bodyStart, end).replace(/\/\*#__PURE__\*\//g, '');

const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });
const exportsSet = new Set();
const dsImports = new Set();
const reactImports = new Set();

const isCE = (n) =>
  t.isCallExpression(n) &&
  t.isMemberExpression(n.callee) &&
  t.isIdentifier(n.callee.object, { name: 'React' }) &&
  t.isIdentifier(n.callee.property, { name: 'createElement' });
const isExtends = (n) => t.isCallExpression(n) && t.isIdentifier(n.callee, { name: '_extends' });

function jsxName(node) {
  if (t.isStringLiteral(node)) return t.jsxIdentifier(node.value);
  if (t.isIdentifier(node)) return t.jsxIdentifier(node.name);
  if (t.isMemberExpression(node) && !node.computed) {
    const obj = jsxName(node.object);
    if (!obj) return null;
    return t.jsxMemberExpression(obj, t.jsxIdentifier(node.property.name));
  }
  return null;
}
function propsToAttrs(p) {
  if (!p || t.isNullLiteral(p)) return [];
  if (isExtends(p)) return p.arguments.flatMap(propsToAttrs);
  if (t.isObjectExpression(p)) {
    return p.properties.map((prop) => {
      if (t.isSpreadElement(prop)) return t.jsxSpreadAttribute(prop.argument);
      if (t.isObjectProperty(prop) && !prop.computed) {
        const key = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
        let v = prop.value;
        // JSX attribute strings do not process escapes, so non-ASCII text stays an expression
        if (t.isStringLiteral(v) && !/["\\\n]/.test(v.value) && !/[^\x20-\x7E]/.test(v.value))
          return t.jsxAttribute(t.jsxIdentifier(String(key)), t.stringLiteral(v.value));
        if (t.isBooleanLiteral(v, { value: true })) return t.jsxAttribute(t.jsxIdentifier(String(key)), null);
        return t.jsxAttribute(t.jsxIdentifier(String(key)), t.jsxExpressionContainer(v));
      }
      return t.jsxSpreadAttribute(t.objectExpression([prop]));
    });
  }
  return [t.jsxSpreadAttribute(p)];
}
function childToJsx(c) {
  if (t.isJSXElement(c) || t.isJSXFragment(c)) return c;
  if (
    t.isStringLiteral(c) &&
    /^[^{}<>]*$/.test(c.value) &&
    c.value.trim() === c.value &&
    c.value.length &&
    !c.value.includes('\n')
  )
    return t.jsxText(c.value);
  return t.jsxExpressionContainer(c);
}

traverse(ast, {
  CallExpression: {
    exit(path) {
      const n = path.node;
      if (!isCE(n)) return;
      const [type, props, ...children] = n.arguments;
      const kids = children.map(childToJsx);
      if (
        t.isMemberExpression(type) &&
        t.isIdentifier(type.object, { name: 'React' }) &&
        t.isIdentifier(type.property, { name: 'Fragment' }) &&
        (!props || t.isNullLiteral(props))
      ) {
        path.replaceWith(t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), kids));
        return;
      }
      const name = jsxName(type);
      if (!name) return; // dynamic type (e.g. variable Tag computed) stays createElement
      if (t.isJSXIdentifier(name) && /^[a-z]/.test(name.name) && !t.isStringLiteral(type)) {
        // lower-case variable used as a component: alias it
        return;
      }
      const attrs = propsToAttrs(props);
      const selfClosing = kids.length === 0;
      path.replaceWith(
        t.jsxElement(
          t.jsxOpeningElement(name, attrs, selfClosing),
          selfClosing ? null : t.jsxClosingElement(name),
          kids,
          selfClosing,
        ),
      );
    },
  },
});
// second pass: __ds_scope.X -> X, React.useX -> useX, drop _extends + Object.assign(__ds_scope)
traverse(ast, {
  MemberExpression(path) {
    const n = path.node;
    if (t.isIdentifier(n.object, { name: '__ds_scope' }) && t.isIdentifier(n.property)) {
      dsImports.add(n.property.name);
      path.replaceWith(t.identifier(n.property.name));
    } else if (
      t.isIdentifier(n.object, { name: 'React' }) &&
      t.isIdentifier(n.property) &&
      n.property.name !== 'createElement'
    ) {
      reactImports.add(n.property.name);
      path.replaceWith(t.identifier(n.property.name));
    }
  },
  JSXMemberExpression(path) {
    const n = path.node;
    if (t.isJSXIdentifier(n.object, { name: '__ds_scope' })) {
      dsImports.add(n.property.name);
      path.replaceWith(t.jsxIdentifier(n.property.name));
    } else if (t.isJSXIdentifier(n.object, { name: 'React' })) {
      reactImports.add(n.property.name);
      path.replaceWith(t.jsxIdentifier(n.property.name));
    }
  },
  FunctionDeclaration(path) {
    if (path.node.id?.name === '_extends') path.remove();
  },
  ExpressionStatement(path) {
    const e = path.node.expression;
    if (
      t.isCallExpression(e) &&
      t.isMemberExpression(e.callee) &&
      t.isIdentifier(e.callee.object, { name: 'Object' }) &&
      t.isIdentifier(e.arguments[0], { name: '__ds_scope' })
    ) {
      e.arguments[1].properties.forEach((p) => exportsSet.add(p.key.name));
      path.remove();
    }
  },
});
// leftover _extends calls (outside JSX props) -> object spread
traverse(ast, {
  CallExpression(path) {
    if (isExtends(path.node))
      path.replaceWith(
        t.objectExpression(
          path.node.arguments
            .map((a) => (t.isObjectExpression(a) ? a.properties : [t.spreadElement(a)]))
            .flat(),
        ),
      );
  },
});
// export declarations
ast.program.body = ast.program.body.map((st) => {
  const name = t.isFunctionDeclaration(st)
    ? st.id?.name
    : t.isVariableDeclaration(st) && st.declarations.length === 1
      ? st.declarations[0].id.name
      : null;
  if (name && exportsSet.has(name)) {
    const ex = t.exportNamedDeclaration(st, []);
    ex.leadingComments = st.leadingComments;
    st.leadingComments = null;
    return ex;
  }
  return st;
});
const uses = generate(ast).code.includes('createElement(');
let out = generate(ast, { retainLines: false, comments: true }).code;
out = out.replace(/React\.createElement\(/g, 'createElement(');
if (uses) reactImports.add('createElement');
const head = [];
head.push(`// design: js/ds/_ds_bundle.js ${section} — converted from the compiled bundle (tools/ds2tsx).`);
if (reactImports.size) head.push(`import { ${[...reactImports].sort().join(', ')} } from 'react';`);
const own = new Set(exportsSet);
const byFile = {};
for (const d of dsImports) {
  if (own.has(d)) continue;
  const f = importMap[d] || `./${d}`;
  (byFile[f] ||= []).push(d);
}
for (const [f, names] of Object.entries(byFile))
  head.push(`import { ${names.sort().join(', ')} } from '${f}';`);
out = head.join('\n') + '\n\n' + out;
const pretty = await prettier.format(out, {
  parser: 'babel-ts',
  singleQuote: true,
  printWidth: 110,
  trailingComma: 'all',
});
fs.writeFileSync(outFile, pretty);
console.log(
  `${section} -> ${outFile}  exports=[${[...exportsSet]}] ds=[${[...dsImports]}] react=[${[...reactImports]}]`,
);
