export type DeleteLimit = { kind: 'count'; count: number } | { kind: 'all' };

export function parseDeleteLimit(raw: string | undefined): DeleteLimit {
  const value = raw?.trim() ?? '';
  if (!value) {
    throw new Error('Set DELETE_LIMIT to a positive integer or "all"');
  }
  if (value.toLowerCase() === 'all') return { kind: 'all' };
  if (!/^[1-9]\d*$/.test(value)) {
    throw new Error(`DELETE_LIMIT must be a positive integer or "all", received "${raw}"`);
  }
  return { kind: 'count', count: Number(value) };
}

export function programIds(body: unknown): string[] {
  const data = body && typeof body === 'object' ? (body as { data?: unknown }).data : undefined;
  if (!Array.isArray(data)) {
    throw new Error('GET /api/programs response did not include a data array');
  }

  return data.map((item, index) => {
    const id = item && typeof item === 'object' ? (item as { id?: unknown }).id : undefined;
    if (typeof id !== 'string' || id.length === 0) {
      throw new Error(`Program at index ${index} did not include an id`);
    }
    return id;
  });
}

export function idsToDelete(ids: string[], limit: DeleteLimit): string[] {
  if (limit.kind === 'all') return ids.slice();
  return ids.slice(0, limit.count);
}
