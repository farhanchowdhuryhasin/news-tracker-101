export function formatWordPressHtml(content: string): string {
  if (!content) return '';
  const trimmed = content.trim();
  // Check if content has HTML tags
  const hasHtmlTags = /<[a-z][\s\S]*>/i.test(trimmed);
  if (!hasHtmlTags) {
    // Convert plain text with newlines into professional HTML paragraphs and headings
    const paragraphs = trimmed.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    return paragraphs.map(p => {
      if (p.startsWith('# ')) {
        return `<h2 class="text-2xl font-bold text-neutral-900 mt-8 mb-4">${p.replace('# ', '')}</h2>`;
      }
      if (p.startsWith('## ')) {
        return `<h3 class="text-xl font-semibold text-neutral-900 mt-6 mb-3">${p.replace('## ', '')}</h3>`;
      }
      // Check if line looks like a short title ending with colon
      if (p.length < 80 && p.endsWith(':')) {
        return `<h3 class="text-lg font-bold text-neutral-900 mt-6 mb-2">${p}</h3>`;
      }
      return `<p class="mb-4 leading-relaxed text-neutral-700 text-base sm:text-lg">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');
  }
  return trimmed;
}
