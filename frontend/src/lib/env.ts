export function getEnv() {
  const normalizeBaseUrl = (value: string) => value.replace(/\/+$/, "");

  const apiUrl = normalizeBaseUrl(
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000",
  );
  const wsUrl = normalizeBaseUrl(process.env.NEXT_PUBLIC_WS_URL || apiUrl);
  return { apiUrl, wsUrl };
}
