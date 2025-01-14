import { Effect, Array as A, pipe, Ref } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { FilePath, GlobPattern } from './types.js'
import { PlatformError } from '@effect/platform/Error'


// ----------------------------------------------------------------- //
// Finding .gitignore files
// ----------------------------------------------------------------- //

/** Recursively searches up the directory tree for .gitignore files
 *  Returns array of patterns from all found .gitignore files, with more
 *  specific (deeper) patterns first */
export const getGitIgnorePatterns = (startDir: string): Effect.Effect<
  Array<GlobPattern>,
  PlatformError,
  FileSystem.FileSystem | Path.Path
> => Effect.gen(function* () {
  const fs   = yield * FileSystem.FileSystem
  const path = yield * Path.Path

  const patternsRef = yield * Ref.make<GlobPattern[]>([])

  let currentDir = startDir

  while (true) {
    const gitignorePath = path.join(currentDir, '.gitignore')
    const exists        = yield * fs.exists(gitignorePath)

    if (exists) {
      const content     = yield * fs.readFileString(gitignorePath)
      const newPatterns = parseGitIgnoreContent(content)
      yield * Ref.set(
        patternsRef,
        [...newPatterns, ...(yield * Ref.get(patternsRef))] as GlobPattern[]
      )
    }

    const parentDir = path.dirname(currentDir)
    if (parentDir === currentDir) break

    currentDir = parentDir
  }

  return yield * Ref.get(patternsRef)
})

/** Parse .gitignore content into array of patterns */
const parseGitIgnoreContent = (content: string): Array<GlobPattern> => {
  return content
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#')) as GlobPattern[]
}

// ----------------------------------------------------------------- //
// Pattern Matching
// ----------------------------------------------------------------- //

/** Creates a filter function for a single glob pattern */
export const getFilterFn = (pattern: GlobPattern) => (fileName: FilePath): boolean => {
  // Handle negation patterns (starting with !)
  if (pattern.startsWith('!')) {
    return !matchesGlobPattern(pattern.slice(1) as GlobPattern, fileName)
  }
  return !matchesGlobPattern(pattern, fileName)
}

/** Checks if a filename matches a glob pattern */
const matchesGlobPattern = (pattern: GlobPattern, fileName: FilePath): boolean => {
  // Convert glob to regex
  const regexPattern = pattern
    // Escape special regex chars except * and ?
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    // Convert glob * to regex .*
    .replace(/\*/g, '.*')
    // Convert glob ? to regex .
    .replace(/\?/g, '.')
    // Handle directory-specific patterns
    .replace(/^\//, '^')
    .replace(/\/$/, '$')

  const regex = new RegExp(regexPattern)
  return regex.test(fileName)
}

// ----------------------------------------------------------------- //
// Main Filter Function
// ----------------------------------------------------------------- //

/**
 * Creates a combined filter function from an array of patterns
 */
export const createGitIgnoreFilter =
  (patterns: GlobPattern[]) => (fileName: FilePath): boolean => {
    return pipe(
      patterns,
      A.map(getFilterFn),
      A.reduce(true, (acc, fn) => acc && fn(fileName))
    )
  }

/** Main function to filter an array of file paths based on gitignore patterns */
export const filterByGitIgnore = (
  filePaths: Array<FilePath>,
  patterns: Array<GlobPattern>
): Array<FilePath> => {
  const filter = createGitIgnoreFilter(patterns)
  return filePaths.filter(filter)
}


// ----------------------------------------------------------------- //
// Public API
// ----------------------------------------------------------------- //
export const filterFilePathsByGitIgnore = (
  filePaths: FilePath[],
): Effect.Effect<FilePath[], PlatformError, FileSystem.FileSystem | Path.Path> =>
  Effect.gen(function* () {
    const path = yield * Path.Path

    const patterns = yield * getGitIgnorePatterns(path.dirname(filePaths[0]))
    return filterByGitIgnore(filePaths, patterns)
  })
