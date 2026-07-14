/**
 * Campus Hub content moderation — blocks posts, comments, chat, and story text
 * that contain blocked/sensitive words.
 */

const SENSITIVE_WORDS = [
  // Sexual / explicit
  'porn', 'porno', 'xxx', 'nude', 'nudes', 'naked', 'sex', 'sexual', 'sexy',
  'fuck', 'fucker', 'fucking', 'fucked', 'fck', 'f*ck', 'f**k',
  'shit', 'bullshit', 'bitch', 'asshole', 'bastard', 'dick', 'cock', 'pussy',
  'whore', 'slut', 'hentai', 'onlyfans',
  // Hate / harassment
  'nigger', 'nigga', 'faggot', 'retard', 'retarded', 'kill yourself', 'kys',
  'rape', 'rapist', 'molest', 'pedo', 'pedophile',
  // Drugs / violence (high-risk solicitation style)
  'cocaine', 'heroin', 'methamphetamine',
];

/** Build regexes that match whole-ish words / phrases (case-insensitive). */
function buildPatterns(words = SENSITIVE_WORDS) {
  return words.map((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    // Allow common leetspeak substitutions around alphabetic tokens
    const flexible = escaped
      .replace(/a/gi, '[a@4]')
      .replace(/e/gi, '[e3]')
      .replace(/i/gi, '[i1!]')
      .replace(/o/gi, '[o0]')
      .replace(/s/gi, '[s$5]')
      .replace(/u/gi, '[u]');
    return new RegExp(`(?:^|[^a-z0-9])${flexible}(?:[^a-z0-9]|$)`, 'i');
  });
}

const PATTERNS = buildPatterns();

function normalizeText(text) {
  if (text == null) return '';
  return String(text)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim();
}

/**
 * @returns {{ blocked: boolean, matches: string[], message?: string }}
 */
function checkSensitiveContent(text) {
  const value = normalizeText(text);
  if (!value) {
    return { blocked: false, matches: [] };
  }

  const matches = [];
  SENSITIVE_WORDS.forEach((word, i) => {
    if (PATTERNS[i].test(` ${value} `) || PATTERNS[i].test(value)) {
      matches.push(word);
    }
  });

  if (matches.length === 0) {
    return { blocked: false, matches: [] };
  }

  return {
    blocked: true,
    matches: [...new Set(matches)],
    message:
      'This message was blocked because it contains sensitive or inappropriate language. Please revise and try again.',
  };
}

/**
 * Express-style helper: returns true if response was sent (blocked).
 */
function rejectIfSensitive(res, text, fieldLabel = 'content') {
  const result = checkSensitiveContent(text);
  if (!result.blocked) return false;

  res.status(400).json({
    message: result.message,
    code: 'SENSITIVE_CONTENT',
    field: fieldLabel,
    matches: result.matches,
  });
  return true;
}

module.exports = {
  SENSITIVE_WORDS,
  checkSensitiveContent,
  rejectIfSensitive,
  normalizeText,
};
