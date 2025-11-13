
import { sanitizeHTML, sanitizeText, sanitizeURL } from '@/lib/sanitize';

describe('lib/sanitize.ts - Sanitization Utilities', () => {
  describe('sanitizeHTML', () => {
    it('should allow safe HTML tags', () => {
      const input = '<p>Hello <strong>World</strong></p>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<p>Hello <strong>World</strong></p>');
    });

    it('should allow headings', () => {
      const input = '<h1>Title</h1><h2>Subtitle</h2>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<h1>Title</h1><h2>Subtitle</h2>');
    });

    it('should allow lists', () => {
      const input = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<ul><li>Item 1</li><li>Item 2</li></ul>');
    });

    it('should allow links with safe attributes', () => {
      const input = '<a href="https://example.com" target="_blank" rel="noopener">Link</a>';
      const result = sanitizeHTML(input);
      expect(result).toContain('<a');
      expect(result).toContain('href="https://example.com"');
      expect(result).toContain('target="_blank"');
    });

    it('should remove script tags', () => {
      const input = '<p>Hello</p><script>alert("XSS")</script>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('<p>Hello</p>');
    });

    it('should remove dangerous event handlers', () => {
      const input = '<p onclick="alert(\'XSS\')">Click me</p>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('onclick');
      expect(result).toContain('<p>Click me</p>');
    });

    it('should remove iframe tags', () => {
      const input = '<iframe src="https://evil.com"></iframe>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<iframe');
    });

    it('should remove object and embed tags', () => {
      const input = '<object data="evil.swf"></object><embed src="evil.swf">';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
    });

    it('should remove disallowed attributes', () => {
      const input = '<p class="test" data-value="123" id="myid">Text</p>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('class');
      expect(result).not.toContain('data-value');
      expect(result).not.toContain('id');
    });

    it('should handle empty input', () => {
      const result = sanitizeHTML('');
      expect(result).toBe('');
    });

    it('should handle plain text without HTML', () => {
      const input = 'Just plain text';
      const result = sanitizeHTML(input);
      expect(result).toBe('Just plain text');
    });

    it('should allow code and pre tags', () => {
      const input = '<pre><code>const x = 1;</code></pre>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<pre><code>const x = 1;</code></pre>');
    });

    it('should allow blockquotes', () => {
      const input = '<blockquote>Quote text</blockquote>';
      const result = sanitizeHTML(input);
      expect(result).toBe('<blockquote>Quote text</blockquote>');
    });

    it('should remove javascript: protocol in links', () => {
      const input = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = sanitizeHTML(input);
      expect(result).not.toContain('javascript:');
    });
  });

  describe('sanitizeText', () => {
    it('should remove angle brackets', () => {
      const input = 'Hello <script>alert("XSS")</script> World';
      const result = sanitizeText(input);
      expect(result).toBe('Hello scriptalert("XSS")/script World');
    });

    it('should trim whitespace', () => {
      const input = '  Hello World  ';
      const result = sanitizeText(input);
      expect(result).toBe('Hello World');
    });

    it('should handle text with both < and >', () => {
      const input = 'a < b > c';
      const result = sanitizeText(input);
      expect(result).toBe('a  b  c');
    });

    it('should handle empty string', () => {
      const result = sanitizeText('');
      expect(result).toBe('');
    });

    it('should handle whitespace-only string', () => {
      const result = sanitizeText('   ');
      expect(result).toBe('');
    });

    it('should preserve normal text', () => {
      const input = 'This is normal text with numbers 123 and symbols !@#$%';
      const result = sanitizeText(input);
      expect(result).toBe('This is normal text with numbers 123 and symbols !@#$%');
    });

    it('should handle multiple angle brackets', () => {
      const input = '<<>>test<<>>';
      const result = sanitizeText(input);
      expect(result).toBe('test');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow valid https URLs', () => {
      const input = 'https://example.com/path?query=value';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com/path?query=value');
    });

    it('should allow valid http URLs', () => {
      const input = 'http://example.com/path';
      const result = sanitizeURL(input);
      expect(result).toBe('http://example.com/path');
    });

    it('should reject javascript: protocol', () => {
      const input = 'javascript:alert("XSS")';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject data: protocol', () => {
      const input = 'data:text/html,<script>alert("XSS")</script>';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject file: protocol', () => {
      const input = 'file:///etc/passwd';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject ftp: protocol', () => {
      const input = 'ftp://example.com/file.txt';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should handle invalid URLs', () => {
      const input = 'not a valid url';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeURL('');
      expect(result).toBe('');
    });

    it('should handle URLs with ports', () => {
      const input = 'https://example.com:8080/path';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com:8080/path');
    });

    it('should handle URLs with authentication', () => {
      const input = 'https://user:pass@example.com/path';
      const result = sanitizeURL(input);
      expect(result).toBe('https://user:pass@example.com/path');
    });

    it('should handle URLs with fragments', () => {
      const input = 'https://example.com/page#section';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com/page#section');
    });

    it('should normalize URLs', () => {
      const input = 'https://example.com//double//slash';
      const result = sanitizeURL(input);
      expect(result).toBe('https://example.com//double//slash');
    });

    it('should handle relative URLs as invalid', () => {
      const input = '/relative/path';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });

    it('should reject protocol-relative URLs', () => {
      const input = '//example.com/path';
      const result = sanitizeURL(input);
      expect(result).toBe('');
    });
  });
});
