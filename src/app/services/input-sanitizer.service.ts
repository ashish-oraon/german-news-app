import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class InputSanitizerService {

  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(html: string): string {
    if (!html) return '';

    // Create a temporary element to sanitize content
    const div = document.createElement('div');
    div.textContent = html; // This automatically escapes HTML
    return div.innerHTML;
  }

  /**
   * Clean and validate URLs
   */
  sanitizeUrl(url: string): string {
    if (!url) return '';

    try {
      const urlObj = new URL(url);

      // Only allow HTTP and HTTPS protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        console.warn('🔒 Blocked potentially unsafe URL protocol:', urlObj.protocol);
        return '';
      }

      // Remove any potential XSS in URL parameters
      return urlObj.toString();
    } catch (error) {
      console.warn('🔒 Invalid URL detected and blocked:', url);
      return '';
    }
  }

  /**
   * Sanitize search queries to prevent injection attacks
   */
  sanitizeSearchQuery(query: string): string {
    if (!query) return '';

    return query
      .replace(/[<>'"]/g, '') // Remove potentially dangerous characters
      .replace(/script/gi, '') // Remove script tags (case insensitive)
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers (onclick, onload, etc.)
      .trim()
      .substring(0, 100); // Limit length to prevent buffer overflow
  }

  /**
   * Sanitize RSS feed content
   */
  sanitizeRssContent(content: string): string {
    if (!content) return '';

    return content
      .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove script tags
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '') // Remove iframe tags
      .replace(/<object[\s\S]*?<\/object>/gi, '') // Remove object tags
      .replace(/<embed[\s\S]*?<\/embed>/gi, '') // Remove embed tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
      .replace(/<[^>]+>/g, '') // Remove all HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Validate and sanitize news article data
   */
  sanitizeNewsArticle(article: any): any {
    if (!article) return null;

    return {
      ...article,
      title: this.sanitizeRssContent(article.title || ''),
      content: this.sanitizeRssContent(article.content || ''),
      description: this.sanitizeRssContent(article.description || ''),
      link: this.sanitizeUrl(article.link || ''),
      enclosure: article.enclosure ? {
        ...article.enclosure,
        link: this.sanitizeUrl(article.enclosure.link || '')
      } : null,
      author: this.sanitizeRssContent(article.author || ''),
      category: this.sanitizeRssContent(article.category || ''),
      source: article.source ? {
        ...article.source,
        name: this.sanitizeRssContent(article.source.name || ''),
        url: this.sanitizeUrl(article.source.url || ''),
        logoUrl: this.sanitizeUrl(article.source.logoUrl || '')
      } : null
    };
  }

  /**
   * Create a safe HTML string for Angular binding
   */
  createSafeHtml(html: string): SafeHtml {
    const sanitizedHtml = this.sanitizeHtml(html);
    return this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml);
  }

  /**
   * Create a safe URL for Angular binding
   */
  createSafeUrl(url: string): SafeUrl {
    const sanitizedUrl = this.sanitizeUrl(url);
    return this.sanitizer.bypassSecurityTrustUrl(sanitizedUrl);
  }

  /**
   * Check if a string contains potentially malicious content
   */
  isSafeContent(content: string): boolean {
    if (!content) return true;

    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/i,
      /expression\s*\(/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Rate limiting for API calls to prevent abuse
   */
  private lastRequestTimes: Map<string, number> = new Map();

  isRequestAllowed(identifier: string, minIntervalMs: number = 1000): boolean {
    const now = Date.now();
    const lastRequest = this.lastRequestTimes.get(identifier) || 0;

    if (now - lastRequest < minIntervalMs) {
      console.warn(`🔒 Rate limit exceeded for ${identifier}`);
      return false;
    }

    this.lastRequestTimes.set(identifier, now);
    return true;
  }
}
