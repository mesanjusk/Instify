const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src');
const OUTPUT_PATH = path.join(SRC_DIR, 'styles', 'utilityTokens.js');
const GENERATED_HEADER = '// AUTO-GENERATED. Run `npm run sync:tokens` to rebuild.';
const NEWLINE = String.fromCharCode(10);
const BACKSLASH = String.fromCharCode(92);
const WHITESPACE = new Set([
  ' ',
  String.fromCharCode(9),
  String.fromCharCode(10),
  String.fromCharCode(11),
  String.fromCharCode(12),
  String.fromCharCode(13),
]);

const splitTokens = (value) => {
  const tokens = [];
  let current = '';
  const flush = () => {
    const trimmed = current.trim();
    if (trimmed) {
      tokens.push(trimmed);
    }
    current = '';
  };
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (WHITESPACE.has(char)) {
      flush();
    } else {
      current += char;
    }
  }
  flush();
  return tokens;
};

const collectStrings = (node) => {
  if (!node) return [];
  switch (node.type) {
    case 'StringLiteral':
      return [node.value];
    case 'TemplateLiteral':
      if (node.expressions.length === 0) {
        return [node.quasis.map((q) => q.value.cooked).join('')];
      }
      return [];
    case 'ConditionalExpression':
      return [...collectStrings(node.consequent), ...collectStrings(node.alternate)];
    case 'LogicalExpression':
      return [...collectStrings(node.left), ...collectStrings(node.right)];
    case 'BinaryExpression':
      if (node.operator === '+') {
        const leftValues = collectStrings(node.left);
        const rightValues = collectStrings(node.right);
        const combined = [];
        leftValues.forEach((left) => {
          rightValues.forEach((right) => {
            combined.push(`${left}${right}`);
          });
        });
        return combined;
      }
      return [];
    case 'ArrayExpression':
      return node.elements.flatMap((element) => collectStrings(element));
    default:
      return [];
  }
};

const addTokensFromString = (value, set) => {
  if (!value || typeof value !== 'string') return;
  splitTokens(value).forEach((token) => set.add(token));
};

const fallbackExtractTokens = (code, set, file) => {
  const doubleQuoted = /className\s*=\s*"([^"]*)"/g;
  const singleQuoted = /className\s*=\s*'([^']*)'/g;
  const expression = /className\s*=\s*\{([^}]*)\}/g;
  let match;
  while ((match = doubleQuoted.exec(code))) {
    addTokensFromString(match[1], set);
  }
  while ((match = singleQuoted.exec(code))) {
    addTokensFromString(match[1], set);
  }
  while ((match = expression.exec(code))) {
    const inner = match[1];
    const quoted = /"([^"]*)"|'([^']*)'/g;
    let innerMatch;
    while ((innerMatch = quoted.exec(inner))) {
      addTokensFromString(innerMatch[1] || innerMatch[2], set);
    }
  }
  console.warn(`[utility-tokens] Parsed ${file} with fallback extractor.`);
};
const listSourceFiles = () => {
  const results = [];
  const walk = (dir) => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    entries.forEach((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === 'dist') return;
        walk(fullPath);
        return;
      }
      const lower = entry.name.toLowerCase();
      if (
        lower.endsWith('.js') ||
        lower.endsWith('.jsx') ||
        lower.endsWith('.ts') ||
        lower.endsWith('.tsx')
      ) {
        results.push(fullPath);
      }
    });
  };
  walk(SRC_DIR);
  return results;
};

const escapeToken = (token) => token.split("'").join(BACKSLASH + "'");

async function main() {
  const files = listSourceFiles().filter((file) => !file.endsWith('utilityTokens.js'));
  const tokens = new Set();

  files.forEach((file) => {
    const code = fs.readFileSync(file, 'utf8');
    let ast;
    try {
      ast = parser.parse(code, {
        sourceType: 'module',
        plugins: ['jsx', 'classProperties', 'optionalChaining', 'nullishCoalescingOperator', 'objectRestSpread'],
      });
    } catch (err) {
      fallbackExtractTokens(code, tokens, file);
      return;
    }
    traverse(ast, {
      JSXAttribute(pathAttr) {
        if (pathAttr.node.name.name !== 'className') return;
        const valueNode = pathAttr.node.value;
        if (!valueNode) return;
        if (valueNode.type === 'StringLiteral') {
          addTokensFromString(valueNode.value, tokens);
          return;
        }
        if (valueNode.type === 'JSXExpressionContainer') {
          collectStrings(valueNode.expression).forEach((str) => addTokensFromString(str, tokens));
        }
      },
    });
  });

  const sortedTokens = Array.from(tokens).sort();
  const tokenBody = sortedTokens.map((token) => `  '${escapeToken(token)}',`).join(NEWLINE);
  const fileContents = `${GENERATED_HEADER}${NEWLINE}export const utilityTokens = [${NEWLINE}${tokenBody}${NEWLINE}];${NEWLINE}`;
  fs.writeFileSync(OUTPUT_PATH, fileContents);
  console.log(`Generated ${sortedTokens.length} utility tokens.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
