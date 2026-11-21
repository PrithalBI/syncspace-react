function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseInline(text) {
  return text
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
    );
}

export function renderMarkdown(markdown = '') {
  if (!markdown.trim()) {
    return '<p class="text-slate-400 italic">Nothing to preview yet. Start writing in Markdown!</p>';
  }

  const escaped = escapeHtml(markdown);
  const codeBlocks = [];

  // Extract fenced code blocks first so their contents aren't transformed
  const withPlaceholders = escaped.replace(/```([\s\S]*?)```/g, (_, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
    return `__CODE_BLOCK_${index}__`;
  });

  const lines = withPlaceholders.split('\n');
  const html = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      closeLists();
      continue;
    }

    if (/^__CODE_BLOCK_\d+__$/.test(line)) {
      closeLists();
      html.push(line);
      continue;
    }

    if (/^---+$/.test(line)) {
      closeLists();
      html.push('<hr />');
      continue;
    }

    if (line.startsWith('### ')) {
      closeLists();
      html.push(`<h3>${parseInline(line.slice(4))}</h3>`);
      continue;
    }

    if (line.startsWith('## ')) {
      closeLists();
      html.push(`<h2>${parseInline(line.slice(3))}</h2>`);
      continue;
    }

    if (line.startsWith('# ')) {
      closeLists();
      html.push(`<h1>${parseInline(line.slice(2))}</h1>`);
      continue;
    }

    if (line.startsWith('&gt; ')) {
      closeLists();
      html.push(`<blockquote>${parseInline(line.slice(5))}</blockquote>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (inOl) {
        html.push('</ol>');
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${parseInline(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (inUl) {
        html.push('</ul>');
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${parseInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    closeLists();
    html.push(`<p>${parseInline(line)}</p>`);
  }

  closeLists();

  let output = html.join('\n');
  codeBlocks.forEach((block, i) => {
    output = output.replace(`__CODE_BLOCK_${i}__`, block);
  });

  return output;
}
