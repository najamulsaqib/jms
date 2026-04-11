export default function JsonHighlight({ value }: { value: unknown }) {
  const json = JSON.stringify(value, null, 2);

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
    key: 'text-sky-300',
    string: 'text-emerald-300',
    number: 'text-amber-300',
    boolean: 'text-violet-300',
    null: 'text-rose-400',
    colon: 'text-slate-400',
    bracket: 'text-slate-400',
    whitespace: 'text-slate-100',
  };

  return (
    <pre className="rounded-lg bg-slate-950 px-4 py-3 text-xs overflow-auto h-full">
      {tokens.map((token, i) => (
        <span key={i} className={colorMap[token.type] ?? 'text-slate-100'}>
          {token.text}
        </span>
      ))}
    </pre>
  );
}
