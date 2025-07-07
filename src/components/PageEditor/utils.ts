export const extractDomainFromUrl = (url: string) => {
  const match = url.match(/https?:\/\/([^\/]+)/);
  if (!match) throw new Error('Invalid URL');
  return { domain: match[1] };
};