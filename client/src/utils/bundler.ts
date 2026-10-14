import { ProjectFile } from '../types';

/**
 * Transforms JavaScript code to safely support ES module `export` and `import`
 * syntax in browser sandbox environments.
 */
export function transformModuleCode(code: string): string {
  let transformed = code;

  // 1. Transform imports:
  // import { a, b as c } from './utils.js' -> const { a, b: c } = __codeforge_require__('./utils.js');
  transformed = transformed.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]([^'"]+)['"];?/g,
    (_, specifiers, mod) => {
      const mapped = specifiers
        .split(',')
        .map((s: string) => {
          const parts = s.trim().split(/\s+as\s+/);
          return parts.length === 2 ? `${parts[0].trim()}: ${parts[1].trim()}` : parts[0].trim();
        })
        .join(', ');
      return `const { ${mapped} } = __codeforge_require__('${mod}');`;
    }
  );

  // import * as name from './utils.js' -> const name = __codeforge_require__('./utils.js');
  transformed = transformed.replace(
    /import\s+\*\s+as\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+)['"];?/g,
    (_, name, mod) => `const ${name} = __codeforge_require__('${mod}');`
  );

  // import name from './utils.js' -> const name = __codeforge_require__('${mod}').default ?? __codeforge_require__('${mod}');
  transformed = transformed.replace(
    /import\s+([a-zA-Z0-9_$]+)\s+from\s+['"]([^'"]+)['"];?/g,
    (_, name, mod) =>
      `const ${name} = __codeforge_require__('${mod}').default !== undefined ? __codeforge_require__('${mod}').default : __codeforge_require__('${mod}');`
  );

  // import './utils.js' -> __codeforge_require__('./utils.js');
  transformed = transformed.replace(
    /import\s+['"]([^'"]+)['"];?/g,
    (_, mod) => `__codeforge_require__('${mod}');`
  );

  // 2. Transform exports:
  // export default function name(...) { ... }
  transformed = transformed.replace(
    /export\s+default\s+function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)\s*\{/g,
    (_, name, args) =>
      `function ${name}(${args}) { /* export default */ }; exports.default = ${name}; window['${name}'] = ${name}; function ${name}(${args}) {`
  );

  // export default class name ...
  transformed = transformed.replace(
    /export\s+default\s+class\s+([a-zA-Z0-9_$]+)/g,
    (_, name) => `class ${name}; exports.default = ${name}; window['${name}'] = ${name}; class ${name}`
  );

  // export default expression;
  transformed = transformed.replace(
    /export\s+default\s+([^;]+);?/g,
    (_, expr) => `exports.default = (${expr});`
  );

  // export function name(...) { ... }
  transformed = transformed.replace(
    /export\s+function\s+([a-zA-Z0-9_$]+)\s*\(([^)]*)\)/g,
    (_, name, args) => `function ${name}(${args})`
  );

  // Find all named function exports and attach to exports & window
  const fnMatches = Array.from(code.matchAll(/export\s+function\s+([a-zA-Z0-9_$]+)/g));
  let postAttachments = '';
  for (const m of fnMatches) {
    const fnName = m[1];
    postAttachments += `\ntry { exports['${fnName}'] = ${fnName}; window['${fnName}'] = ${fnName}; } catch (_) {}`;
  }

  // export const/let/var x = ...;
  transformed = transformed.replace(
    /export\s+(const|let|var)\s+([a-zA-Z0-9_$]+)\s*=/g,
    (_, decl, name) => `${decl} ${name} =`
  );

  const varMatches = Array.from(code.matchAll(/export\s+(?:const|let|var)\s+([a-zA-Z0-9_$]+)/g));
  for (const m of varMatches) {
    const varName = m[1];
    postAttachments += `\ntry { exports['${varName}'] = ${varName}; window['${varName}'] = ${varName}; } catch (_) {}`;
  }

  // export class Name ...
  transformed = transformed.replace(
    /export\s+class\s+([a-zA-Z0-9_$]+)/g,
    (_, name) => `class ${name}`
  );

  const classMatches = Array.from(code.matchAll(/export\s+class\s+([a-zA-Z0-9_$]+)/g));
  for (const m of classMatches) {
    const className = m[1];
    postAttachments += `\ntry { exports['${className}'] = ${className}; window['${className}'] = ${className}; } catch (_) {}`;
  }

  // export { a, b as c };
  transformed = transformed.replace(
    /export\s+\{\s*([^}]+)\s*\};?/g,
    (_, list) => {
      const items = list.split(',').map((s: string) => {
        const parts = s.trim().split(/\s+as\s+/);
        const local = parts[0].trim();
        const exported = parts.length === 2 ? parts[1].trim() : local;
        return `try { exports['${exported}'] = ${local}; window['${exported}'] = ${local}; } catch (_) {}`;
      });
      return items.join('\n');
    }
  );

  return transformed + postAttachments;
}

export function compileProjectHtml(files: ProjectFile[]): string {
  const htmlFile = files.find((f) => f.name.endsWith('.html')) || files.find((f) => f.file_type === 'html');
  const cssFiles = files.filter((f) => f.name.endsWith('.css') || f.file_type === 'css');
  const jsFiles = files.filter(
    (f) => (f.name.endsWith('.js') || f.file_type === 'javascript') && !f.name.endsWith('.html')
  );

  let htmlContent = htmlFile ? htmlFile.content : '<!DOCTYPE html><html><head></head><body></body></html>';

  const cssContent = cssFiles.map((f) => `/* ${f.name} */\n${f.content}`).join('\n\n');

  // Build module definitions
  let modulesInit = `
    window.__codeforge_modules__ = window.__codeforge_modules__ || {};
    window.__codeforge_require__ = function(name) {
      if (!name) return {};
      const clean = name.replace(/^\\.\\//, '').replace(/^\\//, '').replace(/\\.js$/, '');
      if (window.__codeforge_modules__[clean]) return window.__codeforge_modules__[clean];
      if (window.__codeforge_modules__[name]) return window.__codeforge_modules__[name];
      if (window.__codeforge_modules__[name + '.js']) return window.__codeforge_modules__[name + '.js'];
      return window[name] || {};
    };
  `;

  // Process each JS file into a module function
  let jsModulesExecution = '';
  for (const file of jsFiles) {
    const baseName = file.name;
    const cleanName = baseName.replace(/\.js$/, '');
    const transformedCode = transformModuleCode(file.content);

    jsModulesExecution += `
      // Module: ${file.name}
      (function() {
        const exports = {};
        window.__codeforge_modules__['${baseName}'] = exports;
        window.__codeforge_modules__['${cleanName}'] = exports;
        try {
          ${transformedCode}
        } catch (err) {
          console.error('[Runtime Error in ${file.name}]: ' + (err.message || err), err.stack);
        }
      })();
    `;
  }

  // Console capture script
  const consoleCaptureScript = `
    <script>
      (function() {
        function serialize(arg) {
          try {
            if (arg === null) return 'null';
            if (arg === undefined) return 'undefined';
            if (typeof arg === 'function') return arg.toString();
            if (arg instanceof Error) return arg.name + ': ' + arg.message;
            if (typeof arg === 'object') return JSON.stringify(arg);
            return String(arg);
          } catch (e) {
            return String(arg);
          }
        }

        function sendLog(level, args, stack) {
          try {
            const formattedArgs = Array.from(args).map(serialize);
            window.parent.postMessage({
              type: 'CODEFORGE_CONSOLE',
              level: level,
              args: formattedArgs,
              timestamp: new Date().toLocaleTimeString(),
              stack: stack || null
            }, '*');
          } catch (err) {}
        }

        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        console.log = function() {
          sendLog('log', arguments);
          originalLog.apply(console, arguments);
        };
        console.warn = function() {
          sendLog('warn', arguments);
          originalWarn.apply(console, arguments);
        };
        console.error = function() {
          sendLog('error', arguments);
          originalError.apply(console, arguments);
        };
        console.info = function() {
          sendLog('info', arguments);
          originalInfo.apply(console, arguments);
        };

        window.onerror = function(message, source, lineno, colno, error) {
          const errorMsg = message + (lineno ? ' (Line ' + lineno + ':' + colno + ')' : '');
          sendLog('error', [errorMsg], error ? error.stack : null);
          return false;
        };

        window.addEventListener('unhandledrejection', function(event) {
          const reason = event.reason;
          const errorMsg = 'Unhandled Promise Rejection: ' + (reason ? (reason.message || reason) : 'Unknown');
          sendLog('error', [errorMsg], reason && reason.stack ? reason.stack : null);
        });
      })();
    </script>
  `;

  // Inject CSS
  const styles = `<style>\n${cssContent}\n</style>`;

  // Inject JS
  const scripts = `<script>\n${modulesInit}\n${jsModulesExecution}\n</script>`;

  // Strip existing local css/js script and link references
  let fullHtml = htmlContent;
  fullHtml = fullHtml.replace(/<link\s+[^>]*href=["'](?:style\.css|[^"']+\.css)["'][^>]*>/gi, '');
  fullHtml = fullHtml.replace(/<script\s+[^>]*src=["'](?:script\.js|[^"']+\.js)["'][^>]*><\/script>/gi, '');

  if (fullHtml.includes('</head>')) {
    fullHtml = fullHtml.replace('</head>', `${styles}\n${consoleCaptureScript}\n</head>`);
  } else {
    fullHtml = `${styles}\n${consoleCaptureScript}\n${fullHtml}`;
  }

  if (fullHtml.includes('</body>')) {
    fullHtml = fullHtml.replace('</body>', `${scripts}\n</body>`);
  } else {
    fullHtml = `${fullHtml}\n${scripts}`;
  }

  return fullHtml;
}
