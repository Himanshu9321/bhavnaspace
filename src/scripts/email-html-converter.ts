/**
 * Bhavna Space — Email HTML Normalizer & Converter
 * Converts rich text editor content into clean, semantic, inline-styled email-safe HTML.
 */

export interface EmailTemplateOptions {
  subject?: string;
  preheader?: string;
  studioName?: string;
  studioTagline?: string;
}

/**
 * Traverses and normalizes DOM nodes from a contenteditable container
 * into clean semantic HTML with email-compatible inline CSS.
 */
export function convertEditorToCleanHtml(container: HTMLElement): string {
  if (!container) return '';

  // Clone to avoid modifying the visual editor DOM
  const clone = container.cloneNode(true) as HTMLElement;

  // 1. Remove dangerous or non-content tags
  const forbidden = clone.querySelectorAll('script, style, iframe, object, embed, meta, link');
  forbidden.forEach((el) => el.remove());

  // 2. Remove event attributes (onclick, onload, etc.)
  const allElements = clone.querySelectorAll('*');
  allElements.forEach((el) => {
    Array.from(el.attributes).forEach((attr) => {
      if (attr.name.startsWith('on') || attr.name === 'data-temp') {
        el.removeAttribute(attr.name);
      }
    });
  });

  // 3. Normalize legacy inline tags
  clone.querySelectorAll('b').forEach((b) => {
    const strong = document.createElement('strong');
    strong.innerHTML = b.innerHTML;
    b.replaceWith(strong);
  });

  clone.querySelectorAll('i').forEach((i) => {
    const em = document.createElement('em');
    em.innerHTML = i.innerHTML;
    i.replaceWith(em);
  });

  clone.querySelectorAll('font').forEach((font) => {
    const span = document.createElement('span');
    span.innerHTML = font.innerHTML;
    font.replaceWith(span);
  });

  // 4. Convert plain divs (inserted by Enter key in some browsers) into paragraphs
  clone.querySelectorAll('div').forEach((div) => {
    // If div doesn't contain block children, turn into p
    const hasBlock = div.querySelector('h1, h2, h3, h4, p, ul, ol, blockquote, hr');
    if (!hasBlock) {
      const p = document.createElement('p');
      p.innerHTML = div.innerHTML.trim() || '&nbsp;';
      div.replaceWith(p);
    }
  });

  // 5. Apply email-safe inline styles to standard semantic tags
  clone.querySelectorAll('h1').forEach((h) => {
    h.setAttribute(
      'style',
      'font-family: Georgia, Times New Roman, serif; font-size: 26px; font-weight: 500; color: #2B2A26; margin: 24px 0 12px; line-height: 1.25; letter-spacing: -0.01em;'
    );
  });

  clone.querySelectorAll('h2').forEach((h) => {
    h.setAttribute(
      'style',
      'font-family: Georgia, Times New Roman, serif; font-size: 22px; font-weight: 500; color: #2B2A26; margin: 22px 0 10px; line-height: 1.3;'
    );
  });

  clone.querySelectorAll('h3').forEach((h) => {
    h.setAttribute(
      'style',
      'font-family: Georgia, Times New Roman, serif; font-size: 18px; font-weight: 500; color: #8A5420; margin: 18px 0 8px; line-height: 1.3;'
    );
  });

  clone.querySelectorAll('p').forEach((p) => {
    p.setAttribute(
      'style',
      'margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #2B2A26; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;'
    );
  });

  clone.querySelectorAll('blockquote').forEach((bq) => {
    bq.setAttribute(
      'style',
      'margin: 20px 0; padding: 14px 20px; border-left: 3px solid #DB9558; background-color: #FCF9EA; font-style: italic; color: #5E5B52; font-family: Georgia, Times New Roman, serif; font-size: 16px; line-height: 1.6;'
    );
  });

  clone.querySelectorAll('ul').forEach((ul) => {
    ul.setAttribute(
      'style',
      'margin: 0 0 16px 24px; padding: 0; color: #2B2A26; line-height: 1.7; font-size: 15px;'
    );
  });

  clone.querySelectorAll('ol').forEach((ol) => {
    ol.setAttribute(
      'style',
      'margin: 0 0 16px 24px; padding: 0; color: #2B2A26; line-height: 1.7; font-size: 15px;'
    );
  });

  clone.querySelectorAll('li').forEach((li) => {
    li.setAttribute('style', 'margin-bottom: 6px; padding-left: 4px;');
  });

  clone.querySelectorAll('a').forEach((a) => {
    a.setAttribute(
      'style',
      'color: #8A5420; text-decoration: underline; font-weight: 500;'
    );
    if (!a.getAttribute('target')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  clone.querySelectorAll('hr').forEach((hr) => {
    hr.setAttribute(
      'style',
      'border: 0; border-top: 1px solid #E3DCC4; margin: 28px 0;'
    );
  });

  clone.querySelectorAll('strong').forEach((s) => {
    s.style.fontWeight = '600';
    s.style.color = '#2B2A26';
  });

  let html = clone.innerHTML.trim();

  // If user only typed plain text without wrapping tags, wrap in paragraph
  if (!html.startsWith('<') && html.length > 0) {
    html = `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.7; color: #2B2A26; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${html}</p>`;
  }

  return html;
}

/**
 * Wraps content in the complete branded Bhavna Space editorial email layout
 */
export function wrapInBhavnaEmailTemplate(
  bodyHtml: string,
  options: EmailTemplateOptions = {}
): string {
  const subject = options.subject || 'Bhavna Space Correspondence';
  const preheader = options.preheader || '';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FCF9EA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #2B2A26; -webkit-font-smoothing: antialiased;">
  ${
    preheader
      ? `<div style="display: none; max-height: 0px; overflow: hidden;">${escapeHtml(preheader)}</div>`
      : ''
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF9EA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 620px; background-color: #FFFFFF; border: 1px solid #E3DCC4; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 20px rgba(43, 42, 38, 0.04);">
          <!-- Studio Header Banner -->
          <tr>
            <td style="padding: 34px 32px 24px; background-color: #FCF9EA; border-bottom: 1px solid #E3DCC4; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.2em; color: #8A5420; font-weight: 600;">Interiors &bull; Architecture &bull; Decor</p>
              <h1 style="margin: 0; font-size: 26px; font-weight: 400; letter-spacing: 0.02em; color: #2B2A26; font-family: Georgia, 'Times New Roman', serif;">BHAVNA SPACE</h1>
              <p style="margin: 6px 0 0; font-size: 12px; letter-spacing: 0.08em; color: #5E5B52; text-transform: uppercase;">Mumbai, Maharashtra</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px; background-color: #FFFFFF; font-size: 15px; line-height: 1.7; color: #2B2A26;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Studio Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FCF9EA; border-top: 1px solid #E3DCC4; text-align: center;">
              <p style="margin: 0 0 4px; font-size: 12px; font-weight: 500; color: #2B2A26; font-family: Georgia, serif; letter-spacing: 0.04em;">
                BHAVNA SPACE
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; color: #5E5B52; line-height: 1.5;">
                Quiet luxury meets architectural editorial.<br />
                Mumbai, Maharashtra, India
              </p>
              <p style="margin: 0; font-size: 11px; color: #8A5420;">
                <a href="https://bhavnaspace.com" style="color: #8A5420; text-decoration: underline;">bhavnaspace.com</a> &bull;
                <a href="mailto:connect@bhavnaspace.com" style="color: #8A5420; text-decoration: underline;">connect@bhavnaspace.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(val: string): string {
  return val.replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[c] ?? c);
}
