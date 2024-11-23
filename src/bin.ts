#!/usr/bin/env bun

import { Effect } from "effect"
import { BunContext, BunRuntime } from "@effect/platform-bun"

import { run } from "./Cli.js"

run(process.argv).pipe(
  Effect.catchAllCause((e) => Effect.gen(function * () {
    yield * Effect.logError(e)
    return yield * Effect.die(1)
  })),
  Effect.provide(BunContext.layer),
  BunRuntime.runMain({ disableErrorReporting: true })
)
