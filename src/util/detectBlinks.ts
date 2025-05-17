import { isBlinkUrl, normalizeBlinkUrl } from './blinkUtils';

// Known Solana Blink URLs
const KNOWN_SOLANA_BLINKS = [
  'dial.to',
  // 'jupiter.exchange',
  // 'swap.wao.gg',
  // 'app.meteora.ag',
  // 'orca.so',
  // 'raydium.io',
  // 'drift.trade',
  // 'mango.markets',
  // 'tensor.trade',
  // 'magiceden.io',
  // 'phantom.app',
  // 'dialect.to',
  // 'solana.fm',
];

// Check if a URL is a Solana Blink
export function isSolanaBlink(url: string): boolean {
  try {
    console.log('isSolanaBlink', url);
    // Check for action parameters
    if (url.includes('solana-action:') || url.includes('action=solana')) {
      return true;
    }
    
    // Check if it's a solana: protocol link
    if (url.startsWith('solana:')) {
      return true;
    }
    
    // Check known domains
    const hostname = new URL(url).hostname;
    return KNOWN_SOLANA_BLINKS.some(domain => hostname.includes(domain));
  } catch (error) {
    // Try to check if this is a direct JSON payload that looks like a Solana Action
    if (typeof url === 'string') {
      const lowerUrl = url.toLowerCase();
      return (
        (lowerUrl.includes('"icon"') && lowerUrl.includes('"actions"')) ||
        lowerUrl.includes('solana') ||
        lowerUrl.includes('token') ||
        lowerUrl.includes('wallet')
      );
    }
    return false;
  }
}

// Detect Blink URLs in message text
export function detectBlinks(text: string) {
  // Regular expression to find URLs in text
  const urlRegex = /(https?:\/\/[^\s]+|solana:[^\s]+)/g;
  const blinkUrls: string[] = [];
  
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const url = match[0];
    
    // Check if this is a valid Blink URL
    if (isBlinkUrl(url)) {
      blinkUrls.push(url);
    }
  }
  
  return blinkUrls.map(url => ({
    originalUrl: url,
    url: normalizeBlinkUrl(url),
    isSolana: isSolanaBlink(url),
  }));
}

// // Detect Solana deep links that should be opened with a Solana wallet
// export function detectSolanaDeepLinks(text: string) {
//   // Look for solana: protocol links
//   const solanaRegex = /(solana:[^\s]+|https?:\/\/[^\s]+\?.*action=solana|https?:\/\/[^\s]+\/solana)/g;
//   const deepLinks: string[] = [];
  
//   let match;
//   while ((match = solanaRegex.exec(text)) !== null) {
//     deepLinks.push(match[0]);
//   }
  
//   return deepLinks;
// }