import axios, { AxiosError } from 'axios';
import { scrapeUrl, validateUrl } from '../src/modules/scraper';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the config module
jest.mock('../src/modules/config', () => ({
  getConfig: () => ({
    scraper: {
      timeout: 100,
      retries: 1,
      retryDelay: 10,
      userAgent: 'test-agent'
    }
  })
}));

// Mock the cli module to avoid progress output during tests
jest.mock('../src/modules/cli', () => ({
  showProgress: jest.fn()
}));

describe('Scraper Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(axios.isAxiosError).mockClear();
  });

  describe('validateUrl', () => {
    it('should validate and normalize valid URLs', () => {
      expect(validateUrl('https://example.com')).toBe('https://example.com/');
      expect(validateUrl('http://example.com')).toBe('http://example.com/');
    });

    it('should add https protocol to URLs without protocol', () => {
      expect(validateUrl('example.com')).toBe('https://example.com/');
      expect(validateUrl('www.example.com')).toBe('https://www.example.com/');
    });

    it('should throw error for invalid URL format', () => {
      expect(() => validateUrl('')).toThrow();
      expect(() => validateUrl(' ')).toThrow();
      expect(() => validateUrl('not a valid url with spaces')).toThrow();
    });
  });

  describe('scrapeUrl', () => {
    const mockHtml = `
      <html>
        <head>
          <title>Test Article Title</title>
          <meta name="description" content="Test description">
          <meta property="og:title" content="OG Title">
        </head>
        <body>
          <h1>Test content</h1>
          <p>This is a test article.</p>
        </body>
      </html>
    `;

    it('should successfully scrape a valid website', async () => {
      const mockResponse = {
        data: mockHtml,
        headers: {
          'content-type': 'text/html; charset=utf-8'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await scrapeUrl('https://example.com');

      expect(result).toEqual({
        html: mockHtml,
        url: 'https://example.com/',
        title: 'Test Article Title',
        metadata: {
          description: 'Test description',
          'og:title': 'OG Title'
        }
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          timeout: 100,
          headers: expect.objectContaining({
            'User-Agent': 'test-agent'
          })
        })
      );
    });

    it('should handle network connection errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'NetworkError';
      
      mockedAxios.get.mockRejectedValue(networkError);
      jest.mocked(axios.isAxiosError).mockReturnValue(false);

      await expect(scrapeUrl('https://example.com')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new AxiosError('timeout of 10000ms exceeded', 'ECONNABORTED');
      
      mockedAxios.get.mockRejectedValue(timeoutError);
      jest.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(scrapeUrl('https://example.com')).rejects.toThrow();
    });

    it('should handle DNS resolution errors', async () => {
      const dnsError = new AxiosError('getaddrinfo ENOTFOUND', 'ENOTFOUND');
      
      mockedAxios.get.mockRejectedValue(dnsError);
      jest.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(scrapeUrl('https://nonexistent-domain-12345.com')).rejects.toThrow();
    });

    it('should handle HTTP 404 errors', async () => {
      const notFoundError = new AxiosError('Request failed with status code 404', 'ERR_BAD_REQUEST');
      notFoundError.response = {
        status: 404,
        statusText: 'Not Found',
        data: {},
        headers: {},
        config: {} as any
      };
      
      mockedAxios.get.mockRejectedValue(notFoundError);
      jest.mocked(axios.isAxiosError).mockReturnValue(true);

      await expect(scrapeUrl('https://example.com/nonexistent')).rejects.toThrow();
    });

    it('should retry on failure and eventually succeed', async () => {
      const networkError = new Error('Network Error');
      const successResponse = {
        data: mockHtml,
        headers: { 'content-type': 'text/html' }
      };

      mockedAxios.get
        .mockRejectedValueOnce(networkError)
        .mockResolvedValueOnce(successResponse);
      
      jest.mocked(axios.isAxiosError).mockReturnValue(false);

      const result = await scrapeUrl('https://example.com');
      
      expect(result.title).toBe('Test Article Title');
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should fail after exceeding retry limit', async () => {
      const networkError = new Error('Network Error');
      
      mockedAxios.get.mockRejectedValue(networkError);
      jest.mocked(axios.isAxiosError).mockReturnValue(false);

      await expect(scrapeUrl('https://example.com')).rejects.toThrow();
      
      // Should be called 2 times (initial + 1 retry)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle non-HTML content type', async () => {
      const mockResponse = {
        data: '{"message": "This is JSON"}',
        headers: {
          'content-type': 'application/json'
        }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      await expect(scrapeUrl('https://api.example.com/data.json')).rejects.toThrow();
    });

    it('should extract metadata from HTML', async () => {
      const htmlWithMetadata = `
        <html>
          <head>
            <title>Article Title</title>
            <meta name="author" content="John Doe">
            <meta name="description" content="Article description">
            <meta property="og:image" content="https://example.com/image.jpg">
            <meta name="keywords" content="test, article">
          </head>
          <body>Content</body>
        </html>
      `;

      const mockResponse = {
        data: htmlWithMetadata,
        headers: { 'content-type': 'text/html' }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await scrapeUrl('https://example.com');

      expect(result.metadata).toEqual({
        author: 'John Doe',
        description: 'Article description',
        'og:image': 'https://example.com/image.jpg',
        keywords: 'test, article'
      });
    });

    it('should handle HTML without title', async () => {
      const htmlWithoutTitle = '<html><body>Content without title</body></html>';
      
      const mockResponse = {
        data: htmlWithoutTitle,
        headers: { 'content-type': 'text/html' }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const result = await scrapeUrl('https://example.com');

      expect(result.title).toBeUndefined();
      expect(result.html).toBe(htmlWithoutTitle);
    });

    it('should accept and use scraper options', async () => {
      const mockResponse = {
        data: mockHtml,
        headers: { 'content-type': 'text/html' }
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const options = {
        timeout: 5000,
        retries: 1,
        userAgent: 'custom-agent'
      };

      await scrapeUrl('https://example.com', options);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://example.com/',
        expect.objectContaining({
          timeout: 5000,
          headers: expect.objectContaining({
            'User-Agent': 'custom-agent'
          })
        })
      );
    });
  });
});