/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: ['<rootDir>', 'node_modules'],
  moduleDirectories: ['src', 'node_modules'],
  silent: false
};