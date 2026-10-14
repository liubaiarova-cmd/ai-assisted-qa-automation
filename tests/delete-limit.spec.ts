import { expect, test } from '@playwright/test';
import { idsToDelete, parseDeleteLimit, programIds } from './support/delete-limit';

const programs = {
  data: [{ id: 'program-1' }, { id: 'program-2' }, { id: 'program-3' }],
};

test('a missing DELETE_LIMIT does not select any programs', () => {
  expect(() => parseDeleteLimit(undefined)).toThrow(/DELETE_LIMIT/);
});

test('DELETE_LIMIT selects that many ids from the start of the list', () => {
  expect(idsToDelete(programIds(programs), parseDeleteLimit('2'))).toEqual(['program-1', 'program-2']);
});

test('DELETE_LIMIT=all selects every id from the list', () => {
  expect(idsToDelete(programIds(programs), parseDeleteLimit('all'))).toEqual([
    'program-1',
    'program-2',
    'program-3',
  ]);
});

test('a zero or non-numeric DELETE_LIMIT does not select any programs', () => {
  expect(() => parseDeleteLimit('0')).toThrow(/DELETE_LIMIT/);
  expect(() => parseDeleteLimit('abc')).toThrow(/DELETE_LIMIT/);
});
