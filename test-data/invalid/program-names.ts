/** Curated invalid program names for validation specs — stable, not generated. */
export const INVALID_PROGRAM_NAMES = {
  empty: '',
  whitespaceOnly: '   ',
  tooLong: 'x'.repeat(256),
} as const;
