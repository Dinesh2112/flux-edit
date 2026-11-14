/**
 * FluxEdit Tailwind CSS Engine
 * Provides bidirectional mapping between visual inspector values and Tailwind CSS utility tokens.
 * Surgically replaces matching utility classes while preserving custom class names and responsive prefixes.
 */

const TAILWIND_SPACING_MAP = [
  { px: 0, token: '0' },
  { px: 4, token: '1' },
  { px: 8, token: '2' },
  { px: 12, token: '3' },
  { px: 16, token: '4' },
  { px: 20, token: '5' },
  { px: 24, token: '6' },
  { px: 28, token: '7' },
  { px: 32, token: '8' },
  { px: 36, token: '9' },
  { px: 40, token: '10' },
  { px: 44, token: '11' },
  { px: 48, token: '12' },
  { px: 56, token: '14' },
  { px: 64, token: '16' },
  { px: 80, token: '20' },
  { px: 96, token: '24' },
  { px: 112, token: '28' },
  { px: 128, token: '32' },
];

const TAILWIND_RADIUS_MAP = [
  { px: 0, token: 'none' },
  { px: 2, token: 'sm' },
  { px: 4, token: 'DEFAULT' },
  { px: 6, token: 'md' },
  { px: 8, token: 'lg' },
  { px: 12, token: 'xl' },
  { px: 16, token: '2xl' },
  { px: 24, token: '3xl' },
  { px: 999, token: 'full' },
];

export function pxToSpacingToken(px) {
  const num = parseInt(px, 10);
  if (!Number.isFinite(num) || num <= 0) return '0';
  let closest = TAILWIND_SPACING_MAP[0];
  let minDiff = Math.abs(num - closest.px);

  for (const entry of TAILWIND_SPACING_MAP) {
    const diff = Math.abs(num - entry.px);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  // If exact or within 2px, use standard token; otherwise use Tailwind arbitrary value [Xpx]
  return minDiff <= 2 ? closest.token : `[${num}px]`;
}

export function pxToRadiusToken(px) {
  const num = parseInt(px, 10);
  if (!Number.isFinite(num) || num <= 0) return 'none';
  if (num >= 90) return 'full';

  let closest = TAILWIND_RADIUS_MAP[0];
  let minDiff = Math.abs(num - closest.px);

  for (const entry of TAILWIND_RADIUS_MAP) {
    const diff = Math.abs(num - entry.px);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  if (minDiff <= 2) {
    return closest.token === 'DEFAULT' ? '' : closest.token;
  }
  return `[${num}px]`;
}

/**
 * Detects whether a className string contains Tailwind utility classes.
 */
export function hasTailwindTokens(classString) {
  if (typeof classString !== 'string' || !classString.trim()) return false;
  const twPattern =
    /(^|\s)(flex|grid|block|hidden|p-\d+|px-\d+|py-\d+|m-\d+|mx-\d+|my-\d+|rounded(-\S+)?|text-\w+|bg-\w+|gap-\d+|justify-\w+|items-\w+)/;
  return twPattern.test(classString);
}

/**
 * Replaces or injects Tailwind utility tokens for given visual style updates.
 */
export function patchTailwindClasses(currentClassString, styleUpdates) {
  let tokens = (currentClassString || '').trim().split(/\s+/).filter(Boolean);

  const replaceOrAdd = (regex, newToken) => {
    const idx = tokens.findIndex((t) => regex.test(t));
    if (idx !== -1) {
      if (newToken) tokens[idx] = newToken;
      else tokens.splice(idx, 1);
    } else if (newToken) {
      tokens.push(newToken);
    }
  };

  for (const [key, val] of Object.entries(styleUpdates)) {
    if (key === 'padding') {
      const token = pxToSpacingToken(val);
      replaceOrAdd(/^p-\S+$/, token === '0' ? 'p-0' : `p-${token}`);
    } else if (key === 'marginTop') {
      const token = pxToSpacingToken(val);
      replaceOrAdd(/^mt-\S+$/, token === '0' ? 'mt-0' : `mt-${token}`);
    } else if (key === 'marginLeft') {
      if (val === 'auto') {
        replaceOrAdd(/^ml-\S+$/, 'ml-auto');
      } else {
        const token = pxToSpacingToken(val);
        replaceOrAdd(/^ml-\S+$/, token === '0' ? 'ml-0' : `ml-${token}`);
      }
    } else if (key === 'marginRight') {
      if (val === 'auto') {
        replaceOrAdd(/^mr-\S+$/, 'mr-auto');
      } else {
        const token = pxToSpacingToken(val);
        replaceOrAdd(/^mr-\S+$/, token === '0' ? 'mr-0' : `mr-${token}`);
      }
    } else if (key === 'gap') {
      const token = pxToSpacingToken(val);
      replaceOrAdd(/^gap-\S+$/, token === '0' ? 'gap-0' : `gap-${token}`);
    } else if (key === 'borderRadius') {
      const token = pxToRadiusToken(val);
      if (token === 'none') {
        replaceOrAdd(/^rounded(-\S+)?$/, 'rounded-none');
      } else if (!token) {
        replaceOrAdd(/^rounded(-\S+)?$/, 'rounded');
      } else {
        replaceOrAdd(/^rounded(-\S+)?$/, `rounded-${token}`);
      }
    } else if (key === 'borderTopLeftRadius') {
      const token = pxToRadiusToken(val);
      replaceOrAdd(/^rounded-tl(-\S+)?$/, token === 'none' ? 'rounded-tl-none' : !token ? 'rounded-tl' : `rounded-tl-${token}`);
    } else if (key === 'borderTopRightRadius') {
      const token = pxToRadiusToken(val);
      replaceOrAdd(/^rounded-tr(-\S+)?$/, token === 'none' ? 'rounded-tr-none' : !token ? 'rounded-tr' : `rounded-tr-${token}`);
    } else if (key === 'borderBottomRightRadius') {
      const token = pxToRadiusToken(val);
      replaceOrAdd(/^rounded-br(-\S+)?$/, token === 'none' ? 'rounded-br-none' : !token ? 'rounded-br' : `rounded-br-${token}`);
    } else if (key === 'borderBottomLeftRadius') {
      const token = pxToRadiusToken(val);
      replaceOrAdd(/^rounded-bl(-\S+)?$/, token === 'none' ? 'rounded-bl-none' : !token ? 'rounded-bl' : `rounded-bl-${token}`);
    } else if (key === 'display') {
      if (['flex', 'grid', 'block'].includes(val)) {
        replaceOrAdd(/^(flex|grid|block|inline-block|hidden)$/, val);
      }
    } else if (key === 'flexDirection') {
      if (val === 'row') replaceOrAdd(/^flex-(row|col)$/, 'flex-row');
      else if (val === 'column') replaceOrAdd(/^flex-(row|col)$/, 'flex-col');
    } else if (key === 'justifyContent') {
      const map = {
        'flex-start': 'justify-start',
        center: 'justify-center',
        'flex-end': 'justify-end',
        'space-between': 'justify-between',
      };
      if (map[val]) replaceOrAdd(/^justify-\S+$/, map[val]);
    }
  }

  return tokens.join(' ');
}

