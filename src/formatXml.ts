import * as XmlFormatter from 'xml-formatter'
import { Data, Effect } from "effect"

/** Error type for XML formatting failures */
const XmlFormatterError = Data.TaggedError('XmlFormatterError')<{
  message: string
  stack: string
  originalError?: unknown
}>

const formatXmlUnsafe = XmlFormatter.default

/** Effectified thin wrapper around xml-formatter */
export const formatXml = (...args: Parameters<typeof formatXmlUnsafe>) => Effect.sync(
  () => formatXmlUnsafe(...args),
).pipe(
  Effect.catchAllDefect((err) => {
    if (err instanceof Error) {
      return Effect.fail(new XmlFormatterError({
        message: err.message,
        stack: (err as Error).stack ?? 'STACK NOT AVAILABLE',
        originalError: err
      }))
    }

    return Effect.fail(new XmlFormatterError({
      message: (err as Error).message ?? 'UNKNOWN ERROR',
      stack: (err as Error).stack ?? 'STACK NOT AVAILABLE',
      originalError: err
    }))
  })
)
