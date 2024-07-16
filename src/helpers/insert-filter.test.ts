import { capitalizeFirstLetter } from '../helpers/insert-filter';
import {test, expect} from 'vitest';

test('capitalizeFirstLetter should capitalize the first letter of a string', () => {
  const input = 'hello';
  const expectedOutput = 'Hello';
  const result = capitalizeFirstLetter(input);
  expect(result).toBe(expectedOutput);
});

test('capitalizeFirstLetter should return an empty string if input is empty', () => {
  const input = '';
  const expectedOutput = '';
  const result = capitalizeFirstLetter(input);
  expect(result).toBe(expectedOutput);
});

test('capitalizeFirstLetter should not change the string if the first letter is already capitalized', () => {
  const input = 'Hello';
  const expectedOutput = 'Hello';
  const result = capitalizeFirstLetter(input);
  expect(result).toBe(expectedOutput);
});

test('capitalizeFirstLetter should capitalize the first letter of a string with multiple words', () => {
  const input = 'hello world';
  const expectedOutput = 'Hello world';
  const result = capitalizeFirstLetter(input);
  expect(result).toBe(expectedOutput);
});