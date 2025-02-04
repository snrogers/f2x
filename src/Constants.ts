// TODO: Figure out a way to just check if
//       a file is plain text instead of
//       whitelisting extensions
export const ALLOWED_EXTENSIONS = [
  '.astro',
  '.cfg',
  '.conf',
  '.css',
  '.csv',
  '.gitignore',
  '.htm',
  '.html',
  '.html.in', // Template file for generating HTML. Added for Zig docs
  '.ini',
  '.j2',      // Jinja2 template
  '.js',
  '.json',
  '.jsx',
  '.lua',
  '.markdown',
  '.md',
  '.mjs',
  '.php',
  '.properties',
  '.py',
  '.rb',
  '.rs',
  '.scss',
  '.sh',
  '.sql',
  '.svg',
  '.tex',
  '.tf',      // Terraform
  '.tfvars',  // Terraform
  '.toml',
  '.ts',
  '.tsx',
  '.txt',
  '.yaml',
  '.yml',
  '.zig',
  '.zon',
  'Dockerfile', // Not really an extension, but 🤷
  'dockerfile', // Not really an extension, but 🤷
]
