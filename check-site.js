import puppeteer from 'puppeteer';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.toString()));
    page.on('requestfailed', req => console.log('FAILED:', req.url(), req.failure().errorText));

    await page.goto('https://edibrata.github.io/E-Brata/', { waitUntil: 'networkidle0', timeout: 30000 });
    console.log('HTML:', await page.content());
    
    await browser.close();
  } catch (e) {
    console.error(e);
  }
})();
