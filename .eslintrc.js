module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'jest'],
  extends: ['standard-with-typescript', 'plugin:jest/recommended', 'prettier'],
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    // there are a lot of these and I don't want to define them all right now. probably should fix though
    '@typescript-eslint/explicit-function-return-type': 0,
    // this is requiring me to explicitly call .toString, which I don't want to do
    '@typescript-eslint/restrict-template-expressions': 0,
    // this is handled by prettier
    '@typescript-eslint/space-before-function-paren': 0,
    // this is annoying for variables that are X | undefined
    '@typescript-eslint/strict-boolean-expressions': 0,
    // this is helpful sometimes, though I could probably change the way parsing errors are handled and remove it
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/member-delimiter-style': 0,
  },
}
