// import { getActions } from '../global';
// import { extractSolanaActionUrl, normalizeBlinkUrl } from './blinkUtils';

// export function initSolanaDeepLinkHandler() {
//   // Listen for messages from other window contexts (like service worker)
//   window.addEventListener('message', (event) => {
//     // Ensure the message is coming from our own origin
//     if (event.origin !== window.location.origin) return;
    
//     const { data } = event;
    
//     // Check if this is a Solana deep link message
//     if (data?.type === 'solana-deeplink' && data?.url) {
//       handleSolanaDeepLink(data.url);
//     }
//   });
  
//   // Check for deep links in the URL at load time
//   checkForSolanaDeepLink();
// }

// export function checkForSolanaDeepLink() {
//   const currentUrl = window.location.href;
  
//   // Check for Solana protocol links or actions
//   if (currentUrl.includes('solana:') || currentUrl.includes('solana-action:')) {
//     handleSolanaDeepLink(currentUrl);
    
//     // Clear the URL if possible
//     if (window.history && window.history.replaceState) {
//       window.history.replaceState({}, document.title, window.location.pathname);
//     }
//   }
  
//   // Check for dial.to links
//   if (currentUrl.includes('dial.to')) {
//     const url = new URL(currentUrl);
//     const actionParam = url.searchParams.get('action');
    
//     if (actionParam && actionParam.startsWith('solana-action:')) {
//       const actionUrl = extractSolanaActionUrl(currentUrl);
//       if (actionUrl) {
//         handleSolanaDeepLink(actionUrl);
        
//         // Clear the URL if possible
//         if (window.history && window.history.replaceState) {
//           window.history.replaceState({}, document.title, window.location.pathname);
//         }
//       }
//     }
//   }
// }

// export function handleSolanaDeepLink(url: string) {
//   const { openChat } = getActions();
  
//   // For Solana deep links, we'll open them in a special chat
//   // This simulates a special 'Wallet' bot chat where blinks can be displayed
//   openChat({
//     id: 'wallet-bot', // Special ID for Solana wallet features
//     shouldReplaceHistory: true,
//     blink: {
//       url: normalizeBlinkUrl(url),
//       type: 'solana',
//     },
//   });
// }

// // Register the deep link handler
// export function registerSolanaProtocolHandler() {
//   if ('registerProtocolHandler' in navigator) {
//     try {
//       // Only register with the web+ prefix as browsers require this for security
//       navigator.registerProtocolHandler(
//         'web+solana',
//         `${window.location.origin}/?solana-action=%s`,
//         'Solana Wallet'
//       );
      
//       console.log('Successfully registered web+solana protocol handler');
//     } catch (err) {
//       console.error('Failed to register protocol handler:', err);
//     }
//   }
// }