// TODO: Figure out a way to just check if
//       a file is plain text instead of
//       whitelisting extensions
export const ALLOWED_EXTENSIONS = [
  '.astro',
  '.css',
  '.js',
  '.jsx',
  '.json',
  '.html',
  '.html.in', // Something weird for zig docs
  '.md',
  '.mjs',
  '.scss',
  '.ts',
  '.tsx',
  '.yml',
  '.yaml',
  '.zig',
  '.zon'
]
