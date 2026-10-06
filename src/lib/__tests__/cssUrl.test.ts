import { describe, expect, it } from 'vitest';
import { cssUrl } from '../cssUrl';

describe('cssUrl (M12)', () => {
  it('quotes a plain address', () => {
    expect(cssUrl('https://cdn.test/a.jpg')).toBe('url("https://cdn.test/a.jpg")');
    expect(cssUrl('/templates/a.webp')).toBe('url("/templates/a.webp")');
    expect(cssUrl('data:image/png;base64,AAA')).toBe('url("data:image/png;base64,AAA")');
  });
  it('cannot close the url() or load another scheme', () => {
    expect(cssUrl('https://x.test/a.jpg"); background: red; x:("')).toBe(
      'url("https://x.test/a.jpg%22); background: red; x:(%22")',
    );
    expect(cssUrl('https://x.test/a\\"b\n.jpg')).toBe('url("https://x.test/a%5C%22b.jpg")');
    expect(cssUrl('javascript:alert(1)')).toBe('none');
    expect(cssUrl('data:text/html,<b>')).toBe('none');
    expect(cssUrl(null)).toBe('none');
  });
});
