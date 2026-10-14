import { describe, it, expect } from 'vitest';
import { transformModuleCode, compileProjectHtml } from '../client/src/utils/bundler';
import { ProjectFile } from '../client/src/types';

describe('Project Bundler and ES Module Transformer', () => {
  it('should transform export function into valid executable function with window attachment', () => {
    const code = `export function add(a, b) {\n  return a + b;\n}`;
    const transformed = transformModuleCode(code);
    expect(transformed).not.toContain('export function');
    expect(transformed).toContain('function add(a, b)');
    expect(transformed).toContain("window['add'] = add");
    expect(transformed).toContain("exports['add'] = add");
  });

  it('should transform export const/let/var', () => {
    const code = `export const PI = 3.14159;`;
    const transformed = transformModuleCode(code);
    expect(transformed).not.toContain('export const');
    expect(transformed).toContain('const PI = 3.14159;');
    expect(transformed).toContain("window['PI'] = PI");
  });

  it('should transform import statements into __codeforge_require__', () => {
    const code = `import { add } from './utils.js';\nconsole.log(add(2, 3));`;
    const transformed = transformModuleCode(code);
    expect(transformed).not.toContain('import { add }');
    expect(transformed).toContain("const { add } = __codeforge_require__('./utils.js');");
  });

  it('compileProjectHtml should bundle HTML, CSS, and JS files with export support', () => {
    const files: ProjectFile[] = [
      {
        name: 'index.html',
        file_type: 'html',
        content: '<h1>Hello World</h1>',
      },
      {
        name: 'style.css',
        file_type: 'css',
        content: 'h1 { color: red; }',
      },
      {
        name: 'utils.js',
        file_type: 'javascript',
        content: 'export function add(a, b) { return a + b; }',
      },
      {
        name: 'script.js',
        file_type: 'javascript',
        content: "import { add } from './utils.js'; console.log('Sum:', add(10, 20));",
      },
    ];

    const html = compileProjectHtml(files);
    expect(html).toContain('<h1>Hello World</h1>');
    expect(html).toContain('h1 { color: red; }');
    expect(html).toContain('__codeforge_modules__');
    expect(html).not.toContain('export function');
    expect(html).toContain('function add(a, b)');
  });
});
