export const LANGUAGES = [
  {
    id: 'javascript',
    label: 'JavaScript (Node.js)',
    ext: 'js',
    monaco: 'javascript',
    piston: { language: 'javascript', version: '18.15.0' },
    starter: `// JavaScript (Node.js)
function greet(name) {
  return \`Hello, \${name}! Welcome to SyncSpace Code.\`;
}

console.log(greet("Team"));
`,
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    ext: 'ts',
    monaco: 'typescript',
    piston: { language: 'typescript', version: '5.0.3' },
    starter: `// TypeScript
interface Member {
  name: string;
  role: string;
}

const member: Member = { name: "Developer", role: "Full Stack" };
console.log(\`Hello \${member.name} (\${member.role})!\`);
`,
  },
  {
    id: 'python',
    label: 'Python 3',
    ext: 'py',
    monaco: 'python',
    piston: { language: 'python', version: '3.10.0' },
    starter: `# Python 3
def fibonacci(n):
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result

print("Fibonacci:", fibonacci(10))
`,
  },
  {
    id: 'html',
    label: 'HTML (Live Preview)',
    ext: 'html',
    monaco: 'html',
    piston: null,
    webPreview: true,
    starter: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>SyncSpace Web Project</title>
</head>
<body style="font-family: system-ui, sans-serif; padding: 24px;">
  <h1>Hello from SyncSpace!</h1>
  <p>Edit HTML, CSS, and JS files together and click <strong>Live Preview</strong>.</p>
  <button id="btn" style="padding: 8px 16px; border-radius: 8px; background: #4f46e5; color: white; border: none; cursor: pointer;">
    Click Me
  </button>
  <p id="out"></p>
  <script>
    let count = 0;
    document.getElementById('btn').onclick = () => {
      count++;
      document.getElementById('out').textContent = 'Clicked ' + count + ' times!';
    };
  </script>
</body>
</html>
`,
  },
  {
    id: 'css',
    label: 'CSS',
    ext: 'css',
    monaco: 'css',
    piston: null,
    webPreview: true,
    starter: `/* Shared stylesheet — automatically injected into HTML Live Preview */
body {
  background: #f8fafc;
  color: #0f172a;
}

h1 {
  color: #4f46e5;
}
`,
  },
  {
    id: 'cpp',
    label: 'C++',
    ext: 'cpp',
    monaco: 'cpp',
    piston: { language: 'c++', version: '10.2.0' },
    starter: `#include <iostream>
#include <vector>
using namespace std;

int main() {
    vector<int> nums = {1, 2, 3, 4, 5};
    int sum = 0;
    for (int n : nums) sum += n;
    cout << "Sum = " << sum << endl;
    return 0;
}
`,
  },
  {
    id: 'c',
    label: 'C',
    ext: 'c',
    monaco: 'c',
    piston: { language: 'c', version: '10.2.0' },
    starter: `#include <stdio.h>

int main() {
    printf("Hello from C in SyncSpace!\n");
    return 0;
}
`,
  },
  {
    id: 'java',
    label: 'Java',
    ext: 'java',
    monaco: 'java',
    piston: { language: 'java', version: '15.0.2' },
    starter: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java in SyncSpace!");
    }
}
`,
  },
  {
    id: 'csharp',
    label: 'C#',
    ext: 'cs',
    monaco: 'csharp',
    piston: { language: 'csharp', version: '6.12.0' },
    starter: `using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello from C# in SyncSpace!");
    }
}
`,
  },
  {
    id: 'go',
    label: 'Go',
    ext: 'go',
    monaco: 'go',
    piston: { language: 'go', version: '1.16.2' },
    starter: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go in SyncSpace!")
}
`,
  },
  {
    id: 'rust',
    label: 'Rust',
    ext: 'rs',
    monaco: 'rust',
    piston: { language: 'rust', version: '1.68.2' },
    starter: `fn main() {
    println!("Hello from Rust in SyncSpace!");
}
`,
  },
  {
    id: 'php',
    label: 'PHP',
    ext: 'php',
    monaco: 'php',
    piston: { language: 'php', version: '8.2.3' },
    starter: `<?php
echo "Hello from PHP in SyncSpace!\n";
?>
`,
  },
  {
    id: 'ruby',
    label: 'Ruby',
    ext: 'rb',
    monaco: 'ruby',
    piston: { language: 'ruby', version: '3.0.1' },
    starter: `puts "Hello from Ruby in SyncSpace!"
`,
  },
  {
    id: 'kotlin',
    label: 'Kotlin',
    ext: 'kt',
    monaco: 'kotlin',
    piston: { language: 'kotlin', version: '1.8.20' },
    starter: `fun main() {
    println("Hello from Kotlin in SyncSpace!")
}
`,
  },
  {
    id: 'swift',
    label: 'Swift',
    ext: 'swift',
    monaco: 'swift',
    piston: { language: 'swift', version: '5.3.3' },
    starter: `print("Hello from Swift in SyncSpace!")
`,
  },
  {
    id: 'dart',
    label: 'Dart',
    ext: 'dart',
    monaco: 'dart',
    piston: { language: 'dart', version: '2.19.6' },
    starter: `void main() {
  print('Hello from Dart in SyncSpace!');
}
`,
  },
  {
    id: 'sql',
    label: 'SQL (SQLite)',
    ext: 'sql',
    monaco: 'sql',
    piston: { language: 'sqlite3', version: '3.36.0' },
    starter: `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);
INSERT INTO users (name, role) VALUES ('Alice', 'Admin'), ('Bob', 'Developer');
SELECT * FROM users;
`,
  },
  {
    id: 'bash',
    label: 'Bash / Shell',
    ext: 'sh',
    monaco: 'shell',
    piston: { language: 'bash', version: '5.2.0' },
    starter: `#!/usr/bin/env bash
echo "Hello from Bash in SyncSpace!"
date
`,
  },
  {
    id: 'json',
    label: 'JSON',
    ext: 'json',
    monaco: 'json',
    piston: null,
    starter: `{
  "project": "SyncSpace",
  "collaborative": true
}
`,
  },
  {
    id: 'markdown',
    label: 'Markdown',
    ext: 'md',
    monaco: 'markdown',
    piston: null,
    starter: `# Project Notes

Collaborate on code and docs in one place.
`,
  },
];

export function getLanguageById(id) {
  return LANGUAGES.find((l) => l.id === id) || LANGUAGES[0];
}

export function detectLanguageFromFilename(filename = '') {
  const ext = filename.split('.').pop()?.toLowerCase();
  const match = LANGUAGES.find((l) => l.ext === ext);
  return match ? match.id : 'javascript';
}

export async function executeCode({ languageId, filename, content, stdin = '' }) {
  const lang = getLanguageById(languageId);
  if (!lang.piston) {
    return {
      ok: false,
      stdout: '',
      stderr: `${lang.label} is not directly executable via the terminal runner. Use Live Preview for HTML/CSS/JS.`,
      exitCode: 1,
      durationMs: 0,
    };
  }

  const startedAt = performance.now();
  try {
    const response = await fetch('https://emkc.org/api/v2/piston/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: lang.piston.language,
        version: lang.piston.version,
        files: [{ name: filename || `main.${lang.ext}`, content }],
        stdin,
      }),
    });

    if (!response.ok) {
      throw new Error(`Runner returned HTTP ${response.status}`);
    }

    const data = await response.json();
    const durationMs = Math.round(performance.now() - startedAt);
    const compileStderr = data.compile?.stderr || '';
    const runStdout = data.run?.stdout || '';
    const runStderr = data.run?.stderr || '';
    const combinedStderr = [compileStderr, runStderr].filter(Boolean).join('\n');
    const exitCode = data.compile?.code ? data.compile.code : data.run?.code ?? 0;

    return {
      ok: exitCode === 0 && !combinedStderr,
      stdout: runStdout,
      stderr: combinedStderr,
      exitCode,
      durationMs,
    };
  } catch (err) {
    // Fallback local sandbox for JavaScript if remote runner is unreachable
    if (languageId === 'javascript') {
      const logs = [];
      const errors = [];
      try {
        const fakeConsole = {
          log: (...args) => logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
          error: (...args) => errors.push(args.join(' ')),
          warn: (...args) => logs.push(args.join(' ')),
        };
        const fn = new Function('console', content);
        fn(fakeConsole);
        return {
          ok: errors.length === 0,
          stdout: logs.join('\n'),
          stderr: errors.join('\n'),
          exitCode: errors.length === 0 ? 0 : 1,
          durationMs: Math.round(performance.now() - startedAt),
        };
      } catch (jsErr) {
        return {
          ok: false,
          stdout: logs.join('\n'),
          stderr: String(jsErr),
          exitCode: 1,
          durationMs: Math.round(performance.now() - startedAt),
        };
      }
    }

    return {
      ok: false,
      stdout: '',
      stderr: `Execution service error: ${err.message || 'Could not reach compiler API.'}`,
      exitCode: 1,
      durationMs: Math.round(performance.now() - startedAt),
    };
  }
}

export function buildWebPreviewHtml(files = []) {
  const htmlFile =
    files.find((f) => f.name.toLowerCase() === 'index.html') ||
    files.find((f) => f.language === 'html' || f.name.toLowerCase().endsWith('.html'));

  const cssContent = files
    .filter((f) => f.language === 'css' || f.name.toLowerCase().endsWith('.css'))
    .map((f) => f.content || '')
    .join('\n');

  const jsContent = files
    .filter((f) => f.language === 'javascript' || f.name.toLowerCase().endsWith('.js'))
    .map((f) => f.content || '')
    .join('\n');

  const baseHtml =
    htmlFile?.content ||
    `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family: system-ui, sans-serif; padding: 20px;">
  <h2>Live Web Preview</h2>
  <p>Create an <code>index.html</code> file to customize this preview.</p>
</body>
</html>`;

  const styleTag = cssContent ? `<style>${cssContent}</style>` : '';
  const scriptTag = jsContent ? `<script>${jsContent}<\/script>` : '';

  let output = baseHtml;
  if (output.includes('</head>')) {
    output = output.replace('</head>', `${styleTag}</head>`);
  } else {
    output = `${styleTag}${output}`;
  }

  if (output.includes('</body>')) {
    output = output.replace('</body>', `${scriptTag}</body>`);
  } else {
    output = `${output}${scriptTag}`;
  }

  return output;
}
