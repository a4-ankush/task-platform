export function getEnv() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL || apiUrl;
  return { apiUrl, wsUrl };
}
