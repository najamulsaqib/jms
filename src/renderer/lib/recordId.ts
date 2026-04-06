import Sqids from 'sqids';

// A fixed alphabet shuffle + min length makes IDs unguessable without brute force.
// The alphabet and minLength can be changed, but doing so invalidates all existing URLs.
const sqids = new Sqids({
  alphabet: 'k3mT9xQpLvHjWdBsY5RzAfCgE2nKoMuSr8wXtJiV4yq7eG6DhFbP1cZa0NlUIO',
  minLength: 8,
});

export function encodeRecordId(id: number): string {
  return sqids.encode([id]);
}

export function decodeRecordId(slug: string): number | null {
  try {
    const ids = sqids.decode(slug);
    return ids.length === 1 ? ids[0] : null;
  } catch {
    return null;
  }
}
