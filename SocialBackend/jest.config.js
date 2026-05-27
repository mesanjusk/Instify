module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['controllers/**/*.js', 'routers/**/*.js', '!**/node_modules/**'],
  coverageDirectory: 'coverage',
};
