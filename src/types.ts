import { Brand } from "effect"

export type GlobPattern = string & Brand.Brand<'GlobPattern'>
export type FilePath    = string & Brand.Brand<'FilePath'>
