import {pipe} from 'effect'
import { SourceCodeTree } from './fetchSourceCodeTree.js'
import { Array as A } from 'effect'

const INDENT_STRING = '   '
const BRANCH_STRING = '|- '

export const ppSourceCodeTree = (tree: SourceCodeTree, level = 0): string => {
  const indent = INDENT_STRING.repeat(level)
  const branch = level === 0 ? '' : BRANCH_STRING

  if (tree.type === 'FILE') {
    return `${indent}${branch}${tree.path}\n`
  }

  if (tree.type === 'DIRECTORY') {
    const dirLine = `${indent}${branch}${tree.path}\n`
    const childrenLines = pipe(
      tree.children,
      A.sort<SourceCodeTree>((a, b) => {
        // Sort directories before files, then alphabetically
        if (a.type === 'DIRECTORY' && b.type === 'FILE') return -1
        if (a.type === 'FILE' && b.type === 'DIRECTORY') return 1
        return a.path.localeCompare(b.path) as -1 | 0 | 1
      }),
      A.map(child => ppSourceCodeTree(child, level + 1)),
      A.join('')
    )

    return dirLine + childrenLines
  }

  return `${indent}${branch}Unknown\n`
}
