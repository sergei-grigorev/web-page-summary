import { scrapeUrl } from '../src/modules/scraper';

async function testScraper() {
  try {
    console.log('Testing scraper module...');
    
    // Test with a valid URL
    const result = await scrapeUrl('https://example.com');
    console.log('Scraping successful!');
    console.log(`Title: ${result.title}`);
    console.log(`URL: ${result.url}`);
    console.log(`Metadata keys: ${Object.keys(result.metadata || {}).join(', ')}`);
    console.log(`HTML length: ${result.html.length} characters`);
    
    // Test with an invalid URL (should throw an error)
    try {
      console.log('\nTesting with invalid URL...');
      await scrapeUrl('invalid-url');
      console.log('Error: This should have failed!');
    } catch (error) {
      console.log('Expected error caught:', (error as Error).message);
    }
    
  } catch (error) {
    console.error('Test failed:', (error as Error).message);
  }
}

testScraper();
