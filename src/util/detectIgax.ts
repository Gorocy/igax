// Known Igax domains
const KNOWN_IGAX_DOMAINS = [
  'igax.xyz',
  'igax-bot.onrender.com',
];

export function isIgaxDomain(url: string) {
  try {
    const stringUrl = url.startsWith('https://') ? url : `https://${url}`;
    const domain = new URL(stringUrl).hostname;
    return KNOWN_IGAX_DOMAINS.includes(domain);
  } catch (error) {
    return false;
  }
}

export function detectIgax(text: string) {
    const links = getAllLinks(text);

    const igaxLinks = links.filter((link) => isIgaxDomain(link));
    
    return igaxLinks;
}

export function getAllLinks(text: string) {
    const urlRegex = /(?:https?:\/\/)?(?:www\.)?[\w\-]+(\.[\w\-]+)+(\/[^\s]*)?/g;
    const links = text.match(urlRegex) || [];
    return links;
}

const mockBioWithLinks = `Hello 
https://igax-bot.onrender.com/api/transactions/7395315485/4Dyj9s8pE26DbuUZYCX2QE9c2cdDbYNxDA1ZtBy7RLHq 
and https://igax.xyz/api/transactions/7395315485/4Dyj9s8pE26DbuUZYCX2QE9c2cdDbYNxDA1ZtBy7RLHq`;
