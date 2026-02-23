/// <reference types="vitest" />
export default {
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
}
