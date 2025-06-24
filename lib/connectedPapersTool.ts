import fetch from 'node-fetch';

export async function fetchConnectedPapers(seedPaperId: string) {
  const apiUrl = `https://www.connectedpapers.com/api/graph/${seedPaperId}`;

  const response = await fetch(apiUrl);
  if (!response.ok) {
    throw new Error('Failed to fetch connected papers');
  }

  const data = await response.json();
  return data;
}
