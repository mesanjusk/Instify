import { alpha } from '@mui/material/styles';
import { utilityTokens } from './utilityTokens';

const spacingScale = {
  '0': 0,
  '0.5': 2,
  '1': 4,
  '1.5': 6,
  '2': 8,
  '2.5': 10,
  '3': 12,
  '3.5': 14,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '11': 44,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  '36': 144,
  '40': 160,
  '44': 176,
  '48': 192,
  '52': 208,
  '56': 224,
  '60': 240,
  '64': 256,
  '72': 288,
  '80': 320,
  '96': 384,
};

const maxWidthScale = {
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '7xl': '80rem',
  '8xl': '90rem',
};

const percentMap = {
  '1/2': '50%',
  '1/3': '33.3333%',
  '2/3': '66.6667%',
  '1/4': '25%',
  '3/4': '75%',
};

const colorPalette = {
  black: '#000000',
  white: '#ffffff',
  gray: {
    50: '#f4f9f6',
    100: '#e8f5e9',
    200: '#d0e8d0',
    300: '#a8d5b5',
    400: '#888888',
    500: '#555555',
    600: '#444444',
    700: '#333333',
    800: '#1a1a1a',
    900: '#0a1a0f',
  },
  blue: {
    100: '#e8f5e9',
    200: '#d0e8d0',
    500: '#25a066',
    600: '#1a7a4a',
    700: '#25a066',
    800: '#1b5e20',
  },
  green: {
    100: '#e8f5e9',
    300: '#34c97e',
    500: '#25a066',
    600: '#1a7a4a',
    700: '#1b5e20',
    900: '#0a1a0f',
  },
  red: {
    500: '#c62828',
    600: '#b71c1c',
    700: '#8e0000',
  },
  orange: {
    100: '#fff8e1',
    500: '#d4a017',
    700: '#b8860b',
  },
  yellow: {
    100: '#fff8e1',
    500: '#f0c040',
    600: '#d4a017',
    800: '#b8860b',
  },
  purple: {
    600: '#d4a017',
    700: '#b8860b',
  },
  pink: {
    600: '#c62828',
  },
};

const breakpoints = {
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
};

const escapeClassName = (token) =>
  token
    .replace(/\\/g, '\\\\')
    .replace(/\./g, '\\\.')
    .replace(/\//g, '\\/')
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/%/g, '\\%');

const getSpacingValue = (value) => {
  if (value === 'auto') {
    return 'auto';
  }
  if (value === 'px') {
    return '1px';
  }
  if (spacingScale[value]) {
    return `${spacingScale[value]}px`;
  }
  if (value.includes('/')) {
    return percentMap[value] || value;
  }
  if (/^\d+$/.test(value)) {
    return `${Number(value) * 4}px`;
  }
  return value;
};

const getColorValue = (value, theme) => {
  if (value.startsWith('#')) {
    return value;
  }
  if (value === 'theme') {
    return theme.palette.primary.main;
  }
  if (value === 'secondary') {
    return theme.palette.secondary.main;
  }
  if (value === 'black' || value === 'white') {
    return colorPalette[value];
  }
  const [family, shade] = value.split('-');
  if (colorPalette[family]) {
    const paletteValue = colorPalette[family];
    if (typeof paletteValue === 'string') {
      return paletteValue;
    }
    if (paletteValue[shade]) {
      return paletteValue[shade];
    }
  }
  return theme.palette.grey[500];
};

const mergeStyles = (target, styles) => {
  if (!styles) return target;
  return { ...target, ...styles };
};

const boxShadowMap = {
  shadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  'shadow-sm': '0 1px 2px rgba(0,0,0,0.05)',
  'shadow-md': '0 4px 6px rgba(0,0,0,0.1)',
  'shadow-lg': '0 10px 15px rgba(0,0,0,0.15)',
  'shadow-xl': '0 20px 25px rgba(0,0,0,0.2)',
};

const borderRadiusMap = {
  rounded: '0.25rem',
  'rounded-md': '0.375rem',
  'rounded-lg': '0.5rem',
  'rounded-xl': '0.75rem',
  'rounded-2xl': '1rem',
  'rounded-full': '999px',
  'rounded-0': 0,
};

const fontSizeMap = {
  'text-xs': '0.75rem',
  'text-sm': '0.875rem',
  'text-base': '1rem',
  'text-lg': '1.125rem',
  'text-xl': '1.25rem',
  'text-2xl': '1.5rem',
  'text-3xl': '1.875rem',
  'text-4xl': '2.25rem',
};

const fontWeightMap = {
  'font-medium': 500,
  'font-semibold': 600,
  'font-bold': 700,
};

const zIndexMap = {
  'z-40': 40,
  'z-50': 50,
};

const animationTokens = {
  'animate-spin': {
    animation: 'mui-spin 1s linear infinite',
    keyframes: {
      '@keyframes mui-spin': {
        to: { transform: 'rotate(360deg)' },
      },
    },
  },
  'animate-pulse': {
    animation: 'mui-pulse 1.5s ease-in-out infinite',
    keyframes: {
      '@keyframes mui-pulse': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.5 },
      },
    },
  },
  'animate-fadeIn': {
    animation: 'mui-fade-in 0.3s ease-in forwards',
    keyframes: {
      '@keyframes mui-fade-in': {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    },
  },
};

const simpleClassMap = {
  flex: { display: 'flex' },
  grid: { display: 'grid' },
  block: { display: 'block' },
  inline: { display: 'inline' },
  'inline-block': { display: 'inline-block' },
  'inline-flex': { display: 'inline-flex' },
  hidden: { display: 'none' },
  'flex-1': { flex: 1 },
  'flex-shrink-0': { flexShrink: 0 },
  'flex-row': { flexDirection: 'row' },
  'flex-col': { flexDirection: 'column' },
  'flex-wrap': { flexWrap: 'wrap' },
  'flex-nowrap': { flexWrap: 'nowrap' },
  'items-center': { alignItems: 'center' },
  'items-start': { alignItems: 'flex-start' },
  'items-end': { alignItems: 'flex-end' },
  'justify-between': { justifyContent: 'space-between' },
  'justify-center': { justifyContent: 'center' },
  'justify-start': { justifyContent: 'flex-start' },
  'justify-end': { justifyContent: 'flex-end' },
  'justify-around': { justifyContent: 'space-around' },
  'justify-content-center': { justifyContent: 'center' },
  'align-items-center': { alignItems: 'center' },
  'text-left': { textAlign: 'left' },
  'text-center': { textAlign: 'center' },
  'text-right': { textAlign: 'right' },
  uppercase: { textTransform: 'uppercase' },
  capitalize: { textTransform: 'capitalize' },
  underline: { textDecoration: 'underline' },
  truncate: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  'leading-tight': { lineHeight: 1.25 },
  'tracking-wider': { letterSpacing: '0.05em' },
  'min-h-screen': { minHeight: '100vh' },
  'min-w-0': { minWidth: 0 },
  'min-w-full': { minWidth: '100%' },
  'overflow-auto': { overflow: 'auto' },
  'overflow-hidden': { overflow: 'hidden' },
  'overflow-x-auto': { overflowX: 'auto' },
  'overflow-y-auto': { overflowY: 'auto' },
  'h-full': { height: '100%' },
  'w-full': { width: '100%' },
  'vh-100': { height: '100vh' },
  'h-screen': { height: '100vh' },
  'fixed': { position: 'fixed' },
  'absolute': { position: 'absolute' },
  'relative': { position: 'relative' },
  'sticky': { position: 'sticky' },
  'cursor-pointer': { cursor: 'pointer' },
  transition: { transition: 'all 0.2s ease' },
  'text-theme': (theme) => ({ color: theme.palette.primary.main }),
  'bg-theme': (theme) => ({ backgroundColor: theme.palette.primary.main, color: theme.palette.primary.contrastText }),
  'bg-secondary': (theme) => ({ backgroundColor: theme.palette.secondary.main, color: theme.palette.secondary.contrastText }),
  'text-white-500': { color: '#ffffff' },
  'btn': (theme) => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0.5rem 1rem',
    borderRadius: '999px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease, opacity 0.2s ease',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
  }),
  'btn-success': { backgroundColor: '#16a34a', color: '#ffffff' },
  'form-control': {
    width: '100%',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    padding: '0.5rem 0.75rem',
  },
  'd-flex': { display: 'flex' },
  'vh-100': { height: '100vh' },
  'table-auto': { tableLayout: 'auto' },
  'border-collapse': { borderCollapse: 'collapse' },
  'print:bg-white': { backgroundColor: '#ffffff' },
};

const directionalSpacing = (token) => {
  const match = token.match(/^(p|m)([trblxy])?-([^\s]+)/);
  if (!match) return null;
  const [, type, direction, raw] = match;
  const value = getSpacingValue(raw);
  const property = type === 'p' ? 'padding' : 'margin';
  if (!direction) {
    return { [property]: value };
  }
  const map = {
    x: [`${property}Left`, `${property}Right`],
    y: [`${property}Top`, `${property}Bottom`],
    t: [`${property}Top`],
    b: [`${property}Bottom`],
    l: [`${property}Left`],
    r: [`${property}Right`],
  };
  const targets = map[direction];
  if (!targets) return null;
  return targets.reduce((acc, key) => ({ ...acc, [key]: value }), {});
};

const sizeClass = (token) => {
  const match = token.match(/^(w|h)-(.*)$/);
  if (!match) return null;
  const [, axis, raw] = match;
  if (raw === 'full') {
    return { [axis === 'w' ? 'width' : 'height']: '100%' };
  }
  if (raw === 'screen' && axis === 'h') {
    return { height: '100vh' };
  }
  if (percentMap[raw]) {
    return { [axis === 'w' ? 'width' : 'height']: percentMap[raw] };
  }
  const value = getSpacingValue(raw);
  if (!value) return null;
  return { [axis === 'w' ? 'width' : 'height']: value };
};

const insetClass = (token) => {
  const match = token.match(/^(top|right|bottom|left)-(.+)$/);
  if (!match) return null;
  const [, position, raw] = match;
  if (raw === '1/2') {
    return { [position]: '50%' };
  }
  if (raw === '0') {
    return { [position]: 0 };
  }
  return { [position]: getSpacingValue(raw) };
};

const translateClass = (token) => {
  if (token === '-translate-y-1/2') {
    return { transform: 'translateY(-50%)' };
  }
  return null;
};

const gapClass = (token) => {
  const match = token.match(/^gap-(\d+)/);
  if (!match) return null;
  const [, raw] = match;
  const value = getSpacingValue(raw);
  return { gap: value };
};

const spaceBetweenClass = (token) => {
  const match = token.match(/^space-(x|y)-(\d+)/);
  if (!match) return null;
  const [, axis, raw] = match;
  const value = getSpacingValue(raw);
  const property = axis === 'x' ? 'marginLeft' : 'marginTop';
  return {
    '& > * + *': {
      [property]: value,
    },
  };
};

const maxSizeClass = (token) => {
  if (token.startsWith('max-w-')) {
    const key = token.replace('max-w-', '');
    if (maxWidthScale[key]) {
      return { maxWidth: maxWidthScale[key] };
    }
  }
  if (token.startsWith('max-h-')) {
    const raw = token.replace('max-h-', '');
    if (raw === 'screen') {
      return { maxHeight: '100vh' };
    }
    if (raw.startsWith('[')) {
      return { maxHeight: raw.slice(1, -1) };
    }
    const value = getSpacingValue(raw);
    if (value) {
      return { maxHeight: value };
    }
  }
  return null;
};

const minSizeClass = (token) => {
  if (token === 'min-h-screen') {
    return { minHeight: '100vh' };
  }
  return null;
};

const borderClass = (token, theme) => {
  if (token === 'border') {
    return { border: `1px solid ${theme.palette.divider}` };
  }
  if (token === 'border-b') {
    return { borderBottom: `1px solid ${theme.palette.divider}` };
  }
  if (token === 'border-t') {
    return { borderTop: `1px solid ${theme.palette.divider}` };
  }
  if (token === 'border-b-2') {
    return { borderBottom: '2px solid currentColor' };
  }
  if (token === 'border-t-2') {
    return { borderTop: '2px solid currentColor' };
  }
  if (token.startsWith('border-')) {
    const color = token.replace('border-', '');
    return { borderColor: getColorValue(color, theme) };
  }
  return null;
};

const colorClass = (token, theme) => {
  if (token.startsWith('bg-') && !token.startsWith('bg-opacity')) {
    const raw = token.replace('bg-', '');
    if (raw.startsWith('[')) {
      return { backgroundColor: raw.slice(1, -1) };
    }
    return { backgroundColor: getColorValue(raw, theme) };
  }
  if (token.startsWith('text-')) {
    const raw = token.replace('text-', '');
    return { color: getColorValue(raw, theme) };
  }
  if (token.startsWith('hover:bg-')) {
    const raw = token.replace('hover:bg-', '');
    return { backgroundColor: getColorValue(raw, theme) };
  }
  if (token.startsWith('hover:text-')) {
    const raw = token.replace('hover:text-', '');
    return { color: getColorValue(raw, theme) };
  }
  return null;
};

const opacityClass = (base, token) => {
  const target = token || base;
  if (target === 'bg-opacity-40') {
    return { opacity: 0.4 };
  }
  if (target === 'bg-opacity-50') {
    return { opacity: 0.5 };
  }
  if (target === 'opacity-90') {
    return { opacity: 0.9 };
  }
  return null;
};

const radiusClass = (token) => {
  if (borderRadiusMap[token] !== undefined) {
    return { borderRadius: borderRadiusMap[token] };
  }
  return null;
};

const shadowClass = (token) => {
  if (boxShadowMap[token]) {
    return { boxShadow: boxShadowMap[token] };
  }
  return null;
};

const fontSizeClass = (token) => {
  if (fontSizeMap[token]) {
    return { fontSize: fontSizeMap[token] };
  }
  return null;
};

const fontWeightClass = (token) => {
  if (fontWeightMap[token]) {
    return { fontWeight: fontWeightMap[token] };
  }
  return null;
};

const zIndexClass = (token) => {
  if (zIndexMap[token]) {
    return { zIndex: zIndexMap[token] };
  }
  if (token.startsWith('z-[')) {
    const value = Number(token.slice(3, -1));
    if (!Number.isNaN(value)) {
      return { zIndex: value };
    }
  }
  return null;
};

const miscClass = (token) => {
  switch (token) {
    case 'w-100':
      return { width: '100%' };
    case 'w-90':
      return { width: '90%' };
    case 'mx-auto':
      return { marginLeft: 'auto', marginRight: 'auto' };
    case 'mt-auto':
      return { marginTop: 'auto' };
    case 'ml-auto':
      return { marginLeft: 'auto' };
    case 'mr-auto':
      return { marginRight: 'auto' };
    case 'space-y-0':
      return { '& > * + *': { marginTop: 0 } };
    case 'text-black':
      return { color: '#000000' };
    default:
      return null;
  }
};

const focusClass = (base, hasFocus, theme) => {
  if (!hasFocus) return null;
  if (base === 'outline-none') {
    return { outline: 'none' };
  }
  if (base === 'ring-2') {
    return { outlineWidth: '2px', outlineStyle: 'solid', outlineColor: 'inherit' };
  }
  if (base === 'ring-green-300') {
    return { outlineColor: getColorValue('green-300', theme) };
  }
  return null;
};

const ringClass = (base, hasHover, theme) => {
  if (!hasHover) return null;
  if (base === 'ring') {
    return { boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.4)}` };
  }
  if (base.startsWith('ring-')) {
    const colorKey = base.replace('ring-', '');
    return { boxShadow: `0 0 0 2px ${alpha(getColorValue(colorKey, theme), 0.6)}` };
  }
  return null;
};

const gridClass = (token) => {
  if (token.startsWith('grid-cols-')) {
    const count = Number(token.replace('grid-cols-', ''));
    if (!Number.isNaN(count)) {
      return { gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` };
    }
  }
  return null;
};

const baseToken = (token) => token.split(':').pop();

const pseudoSelector = (prefixes) => {
  if (prefixes.includes('hover')) {
    return ':hover';
  }
  if (prefixes.includes('focus')) {
    return ':focus';
  }
  return '';
};

const mediaQueryForPrefixes = (prefixes) => {
  const media = prefixes.find((p) => ['sm', 'md', 'lg', 'xl', 'print'].includes(p));
  if (!media) return null;
  if (media === 'print') {
    return '@media print';
  }
  return `@media (min-width: ${breakpoints[media]}px)`;
};

const buildStylesForToken = (token, theme) => {
  const prefixes = token.split(':').slice(0, -1);
  const base = baseToken(token);
  const hasHover = prefixes.includes('hover');
  const hasFocus = prefixes.includes('focus');
  const pseudo = hasHover ? ':hover' : hasFocus ? ':focus' : '';
  const mediaPrefix = prefixes.find((p) => ['sm', 'md', 'lg', 'xl', 'print'].includes(p));
  const media = mediaPrefix ? (mediaPrefix === 'print' ? '@media print' : `@media (min-width: ${breakpoints[mediaPrefix]}px)`) : null;

  const direct = simpleClassMap[base];
  let styles = typeof direct === 'function' ? direct(theme) : direct;

  styles = mergeStyles(styles, directionalSpacing(base));
  styles = mergeStyles(styles, gapClass(base));
  styles = mergeStyles(styles, spaceBetweenClass(base));
  styles = mergeStyles(styles, sizeClass(base));
  styles = mergeStyles(styles, insetClass(base));
  styles = mergeStyles(styles, translateClass(base));
  styles = mergeStyles(styles, maxSizeClass(base));
  styles = mergeStyles(styles, minSizeClass(base));
  styles = mergeStyles(styles, borderClass(base, theme));
  styles = mergeStyles(styles, colorClass(base, theme));
  styles = mergeStyles(styles, opacityClass(base, token));
  styles = mergeStyles(styles, radiusClass(base));
  styles = mergeStyles(styles, shadowClass(base));
  styles = mergeStyles(styles, fontSizeClass(base));
  styles = mergeStyles(styles, fontWeightClass(base));
  styles = mergeStyles(styles, zIndexClass(base));
  styles = mergeStyles(styles, miscClass(base));
  styles = mergeStyles(styles, focusClass(base, hasFocus, theme));
  styles = mergeStyles(styles, ringClass(base, hasHover, theme));
  styles = mergeStyles(styles, gridClass(base));
  const animationDef = animationTokens[base];
  if (animationDef) {
    styles = mergeStyles(styles, { animation: animationDef.animation });
  }

  if (!styles && token.includes('bg-')) {
    styles = colorClass(token, theme);
  }
  if (!styles && token.includes('text-')) {
    styles = colorClass(token, theme);
  }
  if (!styles) {
    return null;
  }

  return {
    selector: `.${escapeClassName(token)}${pseudo}`,
    media,
    styles,
    keyframes: animationDef?.keyframes,
  };
};

export const utilityStyles = (theme) => {
  const styles = {};
  const mediaBuckets = {};
  const globalKeyframes = {};

  utilityTokens.forEach((token) => {
    const definition = buildStylesForToken(token, theme);
    if (!definition) {
      return;
    }
    if (definition.media) {
      mediaBuckets[definition.media] = mediaBuckets[definition.media] || {};
      mediaBuckets[definition.media][definition.selector] = {
        ...(mediaBuckets[definition.media][definition.selector] || {}),
        ...definition.styles,
      };
    } else {
      styles[definition.selector] = {
        ...(styles[definition.selector] || {}),
        ...definition.styles,
      };
    }
    if (definition.keyframes) {
      Object.assign(globalKeyframes, definition.keyframes);
    }
  });

  Object.entries(mediaBuckets).forEach(([query, rules]) => {
    styles[query] = { ...(styles[query] || {}), ...rules };
  });

  Object.assign(styles, globalKeyframes);

  return styles;
};
