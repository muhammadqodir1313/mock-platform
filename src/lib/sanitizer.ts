/**
 * HTML Sanitizer & Security Utilities for IELTS Zone Mock Testing Platform
 * 
 * Protects against:
 * - Script execution (<script>)
 * - Inline event handler execution (onload, onerror, onclick, etc.)
 * - javascript: and vbscript: URIs
 * - Active SVG content
 * - Unsafe iframe/embed/object injection
 * 
 * Preserves standard IELTS exam stimulus formatting:
 * - Headings (h1-h6), Paragraphs (p), Lists (ul, ol, li)
 * - Tables (table, thead, tbody, tr, th, td)
 * - Semantic markup (strong, em, b, i, u, span, div, blockquote, hr, br)
 * - Safe image elements with verified http/https/asset protocols
 */

// Permitted HTML tags for IELTS stimuli and question formatting
const ALLOWED_TAGS = new Set([
  'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'P', 'BR', 'HR',
  'STRONG', 'B', 'EM', 'I', 'U', 'MARK',
  'UL', 'OL', 'LI',
  'TABLE', 'THEAD', 'TBODY', 'TFOOT', 'TR', 'TH', 'TD',
  'SPAN', 'DIV', 'BLOCKQUOTE', 'PRE', 'CODE',
  'IMG',
]);

// Permitted attributes per tag
const ALLOWED_ATTRS: Record<string, Set<string>> = {
  IMG: new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  TABLE: new Set(['border', 'cellpadding', 'cellspacing']),
  TH: new Set(['colspan', 'rowspan', 'scope', 'align']),
  TD: new Set(['colspan', 'rowspan', 'align']),
  A: new Set(['href', 'title', 'target', 'rel']),
  DEFAULT: new Set(['class', 'id', 'data-question-id', 'data-blank']),
};

/**
 * Checks whether a URL protocol is safe (http, https, asset path, or image data URI)
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim().toLowerCase();

  // Explicitly disallow script URI schemes
  if (
    trimmed.startsWith('javascript:') ||
    trimmed.startsWith('vbscript:') ||
    trimmed.startsWith('data:text/html') ||
    trimmed.startsWith('data:application/')
  ) {
    return false;
  }

  // Safe protocols
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('data:image/')
  ) {
    return true;
  }

  return false;
}

/**
 * Strips dangerous active scripts, event handlers, and unknown tags from untrusted HTML.
 */
export function sanitizeIeltsHtml(dirtyHtml: string): string {
  if (!dirtyHtml || typeof dirtyHtml !== 'string') {
    return '';
  }

  // If in environment without DOMParser (e.g. Node/SSR), strip tags via regex fallback
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return dirtyHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(["']).*?\1/gi, '')
      .replace(/javascript:/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(dirtyHtml, 'text/html');

    // Recursively clean elements
    const cleanNode = (node: Node) => {
      // Text nodes are inherently safe
      if (node.nodeType === Node.TEXT_NODE) {
        return;
      }

      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tagName = el.tagName.toUpperCase();

        // 1. Remove dangerous active tags completely (including their child nodes)
        if (
          tagName === 'SCRIPT' ||
          tagName === 'STYLE' ||
          tagName === 'IFRAME' ||
          tagName === 'OBJECT' ||
          tagName === 'EMBED' ||
          tagName === 'APPLET' ||
          tagName === 'LINK' ||
          tagName === 'META' ||
          tagName === 'BASE' ||
          tagName === 'FORM' ||
          tagName === 'INPUT' ||
          tagName === 'SVG' // Treat SVG as active content
        ) {
          el.remove();
          return;
        }

        // 2. If tag is not in whitelist, replace element with its text content
        if (!ALLOWED_TAGS.has(tagName)) {
          const textNode = doc.createTextNode(el.textContent || '');
          el.replaceWith(textNode);
          return;
        }

        // 3. Inspect attributes: remove any 'on*' event handler or unwhitelisted attribute
        const attrsToRemove: string[] = [];
        const allowedAttrsForTag = ALLOWED_ATTRS[tagName] || new Set();
        const defaultAllowed = ALLOWED_ATTRS.DEFAULT;

        for (let i = 0; i < el.attributes.length; i++) {
          const attr = el.attributes[i];
          const attrName = attr.name.toLowerCase();
          const attrVal = attr.value;

          // Strip any event handler attribute (e.g., onclick, onerror, onload, onmouseover)
          if (attrName.startsWith('on')) {
            attrsToRemove.push(attr.name);
            continue;
          }

          // Validate URLs on src/href
          if (attrName === 'src' || attrName === 'href') {
            if (!isSafeUrl(attrVal)) {
              attrsToRemove.push(attr.name);
              continue;
            }
          }

          // Check if attribute is allowed
          if (!allowedAttrsForTag.has(attrName) && !defaultAllowed.has(attrName)) {
            attrsToRemove.push(attr.name);
          }
        }

        attrsToRemove.forEach((a) => el.removeAttribute(a));

        // Recursively clean children
        Array.from(el.childNodes).forEach(cleanNode);
      }
    };

    Array.from(doc.body.childNodes).forEach(cleanNode);
    return doc.body.innerHTML;
  } catch (err) {
    console.warn('DOMParser sanitization fallback:', err);
    return dirtyHtml.replace(/<[^>]*>/g, '');
  }
}
