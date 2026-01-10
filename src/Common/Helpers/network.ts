export async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${url} HTTP ${res.status}`);
  return (await res.json()) as Promise<T>;
}
