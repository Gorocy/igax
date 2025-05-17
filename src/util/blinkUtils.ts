/**
 * Utility functions for handling Telegram Blinks and Solana deep links
 * 
 * Solana Blinks are interactive blockchain interfaces that can be embedded in messages
 * They allow users to perform on-chain actions like token transfers, swaps, and more
 * directly from messaging platforms without switching apps.
 * 
 * A Blink consists of:
 * 1. GET API - Fetches metadata for rendering the interactive interface
 * 2. POST API - Handles the transaction execution when user takes action
 * 3. Client-side rendering - Displays the interface with buttons and forms
 */

// Check if a URL is a valid Blink URL
export function isBlinkUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Check for known Blink domains
    return (
      parsedUrl.hostname === 'dial.to' ||
      parsedUrl.hostname === 'dialect.to' //||
      // parsedUrl.hostname.includes('jupiter.exchange') ||
      // parsedUrl.hostname.includes('wao.gg') ||
      // parsedUrl.hostname.includes('meteora.ag') ||
      // parsedUrl.hostname.includes('orca.so') ||
      // parsedUrl.hostname.includes('raydium.io') ||
      // parsedUrl.hostname.includes('drift.trade') ||
      // parsedUrl.hostname.includes('mango.markets') ||
      // parsedUrl.hostname.includes('tensor.trade') ||
      // parsedUrl.hostname.includes('magiceden.io') ||
      // parsedUrl.hostname.includes('t.me') ||
      // parsedUrl.hostname.endsWith('.t.me') ||
      // // Check for query parameter that indicates it's an action URL
      // parsedUrl.searchParams.has('action')
    );
  } catch (error) {
    return false;
  }
}

// Extract the Solana action URL from a deep link
export function extractSolanaActionUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    
    // Check if this is a Solana action deep link
    if (parsedUrl.searchParams.has('action')) {
      const action = parsedUrl.searchParams.get('action');
      
      if (action?.startsWith('solana-action:')) {
        // Extract and decode the actual action URL
        return decodeURIComponent(action.replace('solana-action:', ''));
      }
    }
    
    return null;
  } catch (error) {
    console.error('Failed to parse Solana action URL:', error);
    return null;
  }
}


// Handle different types of Blink URLs and normalize them
export function normalizeBlinkUrl(url: string): string {
  // Check for Solana action URLs
  const actionUrl = extractSolanaActionUrl(url);
  if (actionUrl) {
    return actionUrl;
  }
  
  // Otherwise return the original URL
  return url;
}
