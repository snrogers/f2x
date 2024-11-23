import { Array, Brand, Effect, flow, pipe } from 'effect'
import { FileSystem, Path } from '@effect/platform'
import { PlatformError } from '@effect/platform/Error'
import { Schema } from '@effect/schema'
import { ParseError } from '@effect/schema/ParseResult'

import { ALLOWED_EXTENSIONS } from './Constants.js'

// ----------------------------------------------------------------- //
// Types
// ----------------------------------------------------------------- //
export type SourceCodeTree =
  | SourceCodeDirectory
  | SourceCodeFile

export type SourceCodeDirectory =
  { type:     'DIRECTORY'
  , path:     string
  , children: readonly SourceCodeTree[]
  }
export type SourceCodeFile =
  { type:     'FILE'
  , path:     string
  , content:  string
  }

// ----------------------------------------------------------------- //
// Brands
// ----------------------------------------------------------------- //
export type SourceCodeTreeXml = string & Brand.Brand<'SourceCodeTreeXml'>
export const SourceCodeTreeXml = Brand.refined<SourceCodeTreeXml>(
  (s) => s.startsWith('<SourceCodeTree>'),
  () => Brand.error('Not a SourceCodeTreeXml')
)

// ----------------------------------------------------------------- //
// Schemas
// ----------------------------------------------------------------- //
export const SourceCodeDirectorySchema: Schema.Schema<SourceCodeDirectory> = Schema.Struct(
  { children: Schema.Array(Schema.suspend(() => SourceCodeTreeSchema as Schema.Schema<SourceCodeTree>))
  , path:     Schema.String
  , type:     Schema.Literal('DIRECTORY')
  }
)

export const SourceCodeFileSchema: Schema.Schema<SourceCodeFile> = Schema.Struct(
  { content: Schema.String
  , path:    Schema.String
  , type:    Schema.Literal('FILE')
  }
)

export const SourceCodeTreeSchema: Schema.Schema<SourceCodeTree> = Schema.Union(
  SourceCodeDirectorySchema,
  SourceCodeFileSchema
)

// ----------------------------------------------------------------- //
// Fetching
// ----------------------------------------------------------------- //
type fetchSourceCodeTree = (filepath: string) => Effect.Effect<
  SourceCodeTree,
  ParseError | PlatformError,
  FileSystem.FileSystem | Path.Path
>

export const fetchSourceCodeTree: fetchSourceCodeTree = (sourceDir) =>
  Effect.gen(function * () {
    const path = yield * Path.Path
    const fs   = yield * FileSystem.FileSystem

    // `recursive: true` is going to give us a flat list of all files.
    // FIXME: Recursively walk the directory tree so we can nest directories
    //        in the output instead of having all files at the top level.
    const nodePaths = yield * fs.readDirectory(
      sourceDir,
      { recursive: true }
    ).pipe(
        Effect.andThen(flow(
          Array.filter((filePath) =>
            !filePath.includes('node_modules')
            && !(filePath.split('/').some(subPath => subPath.startsWith('.')))
          ),
          Array.filter((filePath) =>
            ALLOWED_EXTENSIONS.some(ext => filePath.endsWith(ext))
          )
        )
      )
    )

    const children = yield * Effect.all(pipe(
      nodePaths,
      Array.map((fileNode) => Effect.gen(function * () {
        const fileNodePath = path.join (sourceDir, fileNode)
        const content = yield * fs.readFileString(fileNodePath, 'utf-8')

        return {
          content,
          path: fileNode,
          type: 'FILE' as const
        }
      }).pipe(
          Effect.catchAll((e) => Effect.succeed({
              content: `[ERROR]: ${e.message}`,
              path: fileNode,
              type: 'FILE' as const
          }))
        )
    )))

    const projectSourceTree = {
      children,
      path: sourceDir,
      type: 'DIRECTORY' as const
    }

    return projectSourceTree as SourceCodeTree
    // const result = yield * Schema.decode (SourceCodeTreeSchema) (projectSourceTree).
    // return result
  })

// ----------------------------------------------------------------- //
// XML Rendering
// ----------------------------------------------------------------- //

const escapeXml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const escapeCdata = (unsafe: string): string => {
  return unsafe
    .replace(/]]>/g, ']]]]><![CDATA[>')
}

export const renderSourceCodeTreeToXml = (tree: SourceCodeTree) => `
  <SourceCodeTree>\n
    ${renderNodeToXml(tree)}\n
  </SourceCodeTree>\n
`

const renderNodeToXml = (node: SourceCodeTree): string => {
  if (node.type === 'FILE') {
    return `
      <File path="${escapeXml(node.path)}">
        <![CDATA[
          ${escapeCdata(node.content)}
        ]]>
      </File>
    `
  }


  if (node.type === 'DIRECTORY') {
    const childrenXml = node.children
      .map(child => renderNodeToXml(child))
      .join('')

    return `
      <Directory path="${escapeXml(node.path)}">
        ${childrenXml}
      </Directory>
    `
  }

  const { type, path } = node

  return `
    <Unknown type="${escapeXml(type)}" path="${escapeXml(path)}" />
  `
}
