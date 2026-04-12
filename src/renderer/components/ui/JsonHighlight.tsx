type ThemeColors = {
  bg: string;
  key: string;
  string: string;
  number: string;
  boolean: string;
  null: string;
  colon: string;
  bracket: string;
  whitespace: string;
};

export type JsonHighlightTheme =
  | 'dark'
  | 'midnight'
  | 'mocha'
  | 'light'
  | 'aurora';

const THEMES: Record<JsonHighlightTheme, ThemeColors> = {
  /** Dark — neon on near-black (default) */
  dark: {
    bg: 'bg-slate-950',
    key: 'text-sky-300',
    string: 'text-emerald-300',
    number: 'text-amber-300',
    boolean: 'text-violet-300',
    null: 'text-rose-400',
    colon: 'text-slate-400',
    bracket: 'text-slate-400',
    whitespace: 'text-slate-100',
  },
  /** Midnight — cool navy with cyan/teal accents */
  midnight: {
    bg: 'bg-blue-950',
    key: 'text-cyan-300',
    string: 'text-teal-300',
    number: 'text-yellow-300',
    boolean: 'text-pink-300',
    null: 'text-red-400',
    colon: 'text-blue-300',
    bracket: 'text-blue-300',
    whitespace: 'text-slate-100',
  },
  /** Mocha — warm brown/stone tones */
  mocha: {
    bg: 'bg-stone-900',
    key: 'text-orange-300',
    string: 'text-lime-300',
    number: 'text-amber-400',
    boolean: 'text-pink-400',
    null: 'text-red-400',
    colon: 'text-stone-400',
    bracket: 'text-stone-400',
    whitespace: 'text-stone-100',
  },
  /** Light — GitHub-style light background */
  light: {
    bg: 'bg-slate-50',
    key: 'text-blue-600',
    string: 'text-green-700',
    number: 'text-orange-600',
    boolean: 'text-purple-600',
    null: 'text-red-500',
    colon: 'text-slate-500',
    bracket: 'text-slate-500',
    whitespace: 'text-slate-800',
  },
  /** Aurora — deep purple with green/teal aurora accents */
  aurora: {
    bg: 'bg-purple-950',
    key: 'text-green-300',
    string: 'text-teal-200',
    number: 'text-yellow-300',
    boolean: 'text-pink-300',
    null: 'text-red-400',
    colon: 'text-purple-300',
    bracket: 'text-purple-300',
    whitespace: 'text-purple-100',
  },
};

function redactPasswords(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(redactPasswords);
  if (val !== null && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val as Record<string, unknown>).map(([k, v]) => [
        k,
        k.toLowerCase() === 'password' ? '••••••••' : redactPasswords(v),
      ]),
    );
  }
  return val;
}

export default function JsonHighlight({
  value,
  theme = 'light',
}: {
  value: unknown;
  theme?: JsonHighlightTheme;
}) {
  const colors = THEMES[theme];
  const json = JSON.stringify(redactPasswords(value), null, 2);

  // Tokenise the JSON string into typed segments
  const tokens: { type: string; text: string }[] = [];
  const regex =
    /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b)|\bnull\b|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\],])/g;
  let lastIndex = 0;

  for (const match of json.matchAll(regex)) {
    if (match.index > lastIndex) {
      tokens.push({
        type: 'whitespace',
        text: json.slice(lastIndex, match.index),
      });
    }

    const [full, strWithColon, colon, bool, num, bracket] = match;

    if (strWithColon !== undefined) {
      if (colon) {
        tokens.push({ type: 'key', text: strWithColon });
        tokens.push({ type: 'colon', text: colon });
      } else {
        tokens.push({ type: 'string', text: full });
      }
    } else if (bool !== undefined) {
      tokens.push({ type: 'boolean', text: bool });
    } else if (num !== undefined) {
      tokens.push({ type: 'number', text: num });
    } else if (bracket !== undefined) {
      tokens.push({ type: 'bracket', text: bracket });
    }

    lastIndex = (match.index ?? 0) + match[0].length;
  }

  if (lastIndex < json.length) {
    tokens.push({ type: 'whitespace', text: json.slice(lastIndex) });
  }

  const colorMap: Record<string, string> = {
    key: colors.key,
    string: colors.string,
    number: colors.number,
    boolean: colors.boolean,
    null: colors.null,
    colon: colors.colon,
    bracket: colors.bracket,
    whitespace: colors.whitespace,
  };

  return (
    <pre
      className={`rounded-lg ${colors.bg} px-4 py-3 text-xs overflow-auto h-full`}
    >
      {tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] ?? colors.whitespace}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}
