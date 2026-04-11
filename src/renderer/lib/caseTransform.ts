type AnyRecord = Record<string, unknown>;

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

/** Convert a camelCase identifier to Title Case (e.g. exportedFieldCount -> Exported Field Count). */
export function camelToTitleCase(str: string): string {
  if (!str) return '';

  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

/** Convert all keys of an object from snake_case → camelCase. */
export function toCamelCase(obj: AnyRecord): AnyRecord {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [snakeToCamel(k), v]),
  );
}

/** Convert all keys of an object from camelCase → snake_case. */
export function toSnakeCase(obj: AnyRecord): AnyRecord {
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [camelToSnake(k), v]),
  );
}
