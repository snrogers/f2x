import * as Command from "@effect/cli/Command"
import { Args, Options } from "@effect/cli"
import { Config, Effect, Option, pipe } from "effect"
import { FileSystem, Path } from '@effect/platform'

import { fetchSourceCodeTree, renderSourceCodeTreeToXml } from "./fetchSourceCodeTree.js"
import { formatXml } from "./formatXml.js"
import { ppSourceCodeTree } from "./ppSourceCodeTree.js"


/** CLI command that converts a directory structure to XML
 *  @property outFile    - Optional output file path
 *  @property sourcePath - Optional source directory path */
const command = Command.make(
  "files-to-xml",
  {
    outFile:    Options.optional(Options.text('outFile')),
    sourcePath: Args.optional(Args.directory({ exists: 'yes' })),
  },
  ({ sourcePath: sourcePathOption, outFile: outFileOption }) => Effect.gen(function * () {
    yield * Effect.log('Starting Files to XML...')

    const fs   = yield * FileSystem.FileSystem
    const path = yield * Path.Path
    const pwd  = yield * Config.string('PWD')

    const thisDirectory = path.basename(pwd)

    const sourcePath = pipe(
      sourcePathOption,
      Option.match({
        onNone: () => pwd,
        onSome: (sourcePath) => path.resolve(sourcePath)
      })
    )

    const outPath = pipe(
      outFileOption,
      Option.match({
        onNone: () => path.join(pwd, `files.${thisDirectory}.xml`),
        onSome: (outPath) => path.resolve(outPath)
      })
    )

    yield * Effect.logDebug('pwd', pwd)
    yield * Effect.logDebug('sourcePath', sourcePath)
    yield * Effect.logDebug('outPath', outPath)

    const tree = yield * fetchSourceCodeTree(sourcePath)

    yield * Effect.log('tree', ppSourceCodeTree(tree))

    const xml  = renderSourceCodeTreeToXml(tree)

    yield * fs.writeFile(outPath, Buffer.from(xml))

    const formattedXmlCustomArgs = yield * formatXml(xml, {
      indentation: '  ',
      lineSeparator: '\n',
      collapseContent: true,
      whiteSpaceAtEndOfSelfclosingTag: true,
      throwOnFailure: true,
      strictMode: true,
      forceSelfClosingEmptyTag: true
    })

    yield * fs.writeFile(outPath, Buffer.from(formattedXmlCustomArgs))

    const lineCount = formattedXmlCustomArgs.split('\n').length

    yield * Effect.logDebug(`${lineCount} lines written to ${outPath}`)
    yield * Effect.log(`Wrote ${lineCount} lines to ${outPath}`)

    return { sourcePath, outPath }
  })
)

/** Command Runner for the CLI application */
export const run = Command.run(command, {
  name: "Files to XML",
  version: "0.0.0"
})
