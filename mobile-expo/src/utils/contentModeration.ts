const SENSITIVE_WORDS = [
  'porn', 'porno', 'xxx', 'nude', 'nudes', 'naked', 'sex', 'sexual', 'sexy',
  'fuck', 'fucker', 'fucking', 'fucked', 'fck',
  'shit', 'bullshit', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'hentai', 'onlyfans',
  'nigger', 'nigga', 'faggot', 'retard', 'retarded', 'kill yourself', 'kys',
  'rape', 'rapist', 'molest', 'pedo', 'pedophile',
  'cocaine', 'heroin', 'methamphetamine',
];

export function checkSensitiveContent(text: string) {
  const value = String(text || '').trim();
  if (!value) {
    return { blocked: false as const, matches: [] as string[], message: undefined as string | undefined };
  }

  const matches = SENSITIVE_WORDS.filter((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const pattern = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'i');
    return pattern.test(` ${value} `) || pattern.test(value);
  });

  if (!matches.length) {
    return { blocked: false as const, matches: [] as string[], message: undefined };
  }

  return {
    blocked: true as const,
    matches,
    message:
      'This was blocked because it contains sensitive or inappropriate language. Please revise and try again.',
  };
}
