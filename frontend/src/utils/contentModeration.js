/**
 * Client-side mirror of backend sensitive-content checks for faster UX.
 * Server remains the source of truth.
 */
const SENSITIVE_WORDS = [
  'porn', 'porno', 'xxx', 'nude', 'nudes', 'naked', 'sex', 'sexual', 'sexy',
  'fuck', 'fucker', 'fucking', 'fucked', 'fck',
  'shit', 'bullshit', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'hentai', 'onlyfans',
  'nigger', 'nigga', 'faggot', 'retard', 'retarded', 'kill yourself', 'kys',
  'rape', 'rapist', 'molest', 'pedo', 'pedophile',
  'cocaine', 'heroin', 'methamphetamine',
];

export function checkSensitiveContent(text) {
  const value = String(text || '').trim();
  if (!value) return { blocked: false, matches: [] };

  const lower = ` ${value.toLowerCase()} `;
  const matches = SENSITIVE_WORDS.filter((word) => {
    const pattern = new RegExp(
      `(?:^|[^a-z0-9])${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+')}(?:[^a-z0-9]|$)`,
      'i'
    );
    return pattern.test(lower) || pattern.test(value);
  });

  if (!matches.length) return { blocked: false, matches: [] };

  return {
    blocked: true,
    matches,
    message:
      'This was blocked because it contains sensitive or inappropriate language. Please revise and try again.',
  };
}

export function assertCleanText(text) {
  const result = checkSensitiveContent(text);
  if (result.blocked) {
    const err = new Error(result.message);
    err.code = 'SENSITIVE_CONTENT';
    throw err;
  }
  return true;
}
