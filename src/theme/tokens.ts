/**
 * Modernist design tokens — the single source of truth for the app's look.
 *
 * Ported from the `Meal Planner.dc.html` prototype and `modernist.css`, with the
 * accent ramp replaced by the chosen cool periwinkle (#6a6ea8).
 *
 * Two rules the whole system depends on:
 *   - Border radius is 0 everywhere. No exceptions.
 *   - There are no shadows. Elevation is expressed by rules (borders) only.
 */
import { Platform, TextStyle } from 'react-native';

// ─── Color ─────────────────────────────────────────────────────────
export const color = {
  bg: '#f3f2f2',
  surface: '#eae9e9',
  text: '#201e1d',
  white: '#ffffff',

  // Periwinkle accent ramp
  accent: '#6a6ea8',
  accent100: '#f3f3f9',
  accent200: '#e6e6f3',
  accent300: '#cdcee7',
  accent400: '#a5a7d1',
  accent500: '#8a8cbf',
  accent600: '#5b5f95',
  accent700: '#4a4d7c',
  accent800: '#35375a',
  accent900: '#24263e',

  neutral100: '#f8f4f4',
  neutral200: '#eae7e7',
  neutral300: '#d7d3d3',
  neutral400: '#bab6b6',
  neutral500: '#9b9797',
  neutral600: '#7d7979',
  neutral700: '#605d5d',
  neutral800: '#444141',
  neutral900: '#2d2b2b',

  // Destructive actions only — the design has no error state, so this is the
  // one colour outside the ramps. Kept desaturated to sit with the periwinkle.
  danger: '#9e2b1f',
} as const;

// ─── Geometry ──────────────────────────────────────────────────────
export const space = {
  x1: 4,
  x2: 8,
  x3: 12,
  x4: 16,
  x6: 24,
  x8: 32,
} as const;

/** Screen gutter. Every full-bleed row pads to this on both sides. */
export const GUTTER = 20;

/** Top padding on every screen/overlay header, clearing the status bar. */
export const HEADER_TOP = 62;

/** 2px solid ink — the section divider that carries the whole layout. */
export const RULE = 2;
/** 1px hairline inside a group. */
export const HAIRLINE = 1;

export const radius = 0;

/** Standard row vertical padding, and the compact variant. */
export const ROW_PAD_Y = 12;
export const ROW_PAD_Y_COMPACT = 9;

// ─── Type ──────────────────────────────────────────────────────────
// Archivo is loaded by `useAppFonts`. Until it resolves we fall back to the
// platform sans — `fontFamily: undefined` means "system default" in RN.
export const font = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  extrabold: 'Archivo_800ExtraBold',
} as const;

/**
 * The monospace face used for small uppercase labels and meta text.
 * The design asks for "any grotesque mono"; each platform's default is fine.
 */
export const mono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'ui-monospace',
}) as string;

/**
 * Named type roles from the design spec. Sizes, weights and line heights are
 * final — reach for these rather than restating numbers in a StyleSheet.
 *
 * Note on letter-spacing: the design gives em values; RN wants points, so each
 * is pre-multiplied by its font size.
 */
export const type = {
  /** 30px/800 — `Monday`, `Shopping list` */
  screenTitle: {
    fontFamily: font.extrabold,
    fontSize: 30,
    lineHeight: 31.5,
    letterSpacing: -0.75,
    color: color.text,
  } as TextStyle,

  /** 26px/800 — picker header */
  overlayTitle: {
    fontFamily: font.extrabold,
    fontSize: 26,
    lineHeight: 27,
    letterSpacing: -0.65,
    color: color.text,
  } as TextStyle,

  /** 27px/800 — recipe header */
  recipeTitle: {
    fontFamily: font.extrabold,
    fontSize: 27,
    lineHeight: 28,
    letterSpacing: -0.68,
    color: color.text,
  } as TextStyle,

  /** 22px/800 — to-buy / in-cart / at-home counts */
  stat: {
    fontFamily: font.extrabold,
    fontSize: 22,
    lineHeight: 22,
    color: color.text,
  } as TextStyle,

  /** 19px/700 — meal name on the Plan tab */
  mealName: {
    fontFamily: font.bold,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: -0.29,
    color: color.text,
  } as TextStyle,

  /** 17px/700 — meal name in the picker */
  mealNameSmall: {
    fontFamily: font.bold,
    fontSize: 17,
    lineHeight: 19.5,
    letterSpacing: -0.26,
    color: color.text,
  } as TextStyle,

  /** 20px/800 — the generated build-your-own name */
  buildName: {
    fontFamily: font.extrabold,
    fontSize: 20,
    lineHeight: 23,
    letterSpacing: -0.4,
    color: color.text,
  } as TextStyle,

  /** 13.5px/1.55 — recipe intro, method steps */
  body: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 21,
    color: color.text,
  } as TextStyle,

  /** 13.5px/1.25 — shopping-list item names */
  row: {
    fontFamily: font.regular,
    fontSize: 13.5,
    lineHeight: 17,
    color: color.text,
  } as TextStyle,

  /** 13.5px/700 — shopping-list quantities */
  rowStrong: {
    fontFamily: font.bold,
    fontSize: 13.5,
    lineHeight: 17,
    color: color.text,
  } as TextStyle,

  /** 12.5px/1.35 — meal subtitles */
  secondary: {
    fontFamily: font.regular,
    fontSize: 12.5,
    lineHeight: 17,
    color: color.neutral700,
  } as TextStyle,

  /** 12px/1.5 — nudges, intro strips */
  secondarySmall: {
    fontFamily: font.regular,
    fontSize: 12,
    lineHeight: 18,
    color: color.neutral700,
  } as TextStyle,

  /** mono 10px/600, 0.16em — `BREAKFAST`, `PRODUCE` */
  label: {
    fontFamily: mono,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '600',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: color.neutral600,
  } as TextStyle,

  /** mono 10px/500, 0.06em — day counts, provenance */
  meta: {
    fontFamily: mono,
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '500',
    letterSpacing: 0.6,
    color: color.neutral600,
  } as TextStyle,

  /** 11px/600, 0.04em, uppercase, left-aligned. Never centered. */
  button: {
    fontFamily: font.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 0.44,
    textTransform: 'uppercase',
  } as TextStyle,

  /** 12px/700 — tab bar label */
  tabLabel: {
    fontFamily: font.bold,
    fontSize: 12,
    lineHeight: 13,
    letterSpacing: 0.36,
  } as TextStyle,
} as const;
