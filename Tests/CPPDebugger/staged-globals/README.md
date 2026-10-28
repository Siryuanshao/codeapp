# C/C++ global-variable debugger integration

The app loads the integrated engine and frontend from
`LanguageResources/ClangLib/debugger/`. This directory keeps the source patches,
regression fixtures and results needed to review and reproduce that integration.

- `engine.patch` applies to debugger-sh `v0.3.15`, commit
  `cc250508fabb5b091075e073ceb2e14899fd8423`. It includes the Rust changes and
  the local worker-fetch and shared-memory integration needed by Code App.
- `frontend.patch` applies to Code App `debugger.js` at commit `88321dac`. The frontend
  reads the candidate engine's `codeappArrayLength` field, including for array
  typedefs and missing bounds. The app's 100-element expansion limit is kept.
- `browser.test.cjs` and `fixtures/` exercise the integrated runtime in a real browser.
  `device-probe.swift` is the test view injected into an isolated Code Test
  build; it is not part of the app.

Integrated runtime SHA-256 values:

```text
75a97e985afbb6d6e1a2e94089073fe6cd3d6f8aedadbae86934d9db149c0144  engine_bg.wasm
b4bd190a381d68eacddb491963d7022ab85fd3b363031c551ae42d2d819d5da7  engine.js
ca0a3a3f0b80bb7b61ca58b4720cad91c39c09a00be6578adbd174bfe8525522  debugger.js
```

## Rebuilding the candidate

The tested build used Rust 1.99.1 with `wasm32-unknown-unknown`,
`wasm-bindgen` 0.2.108, Binaryen `wasm-opt` 133, and Node 24.22.1. Starting
with the pinned upstream source and its `Cargo.lock`:

```sh
git apply /path/to/staged-globals/engine.patch
cargo build --locked --release --target wasm32-unknown-unknown
wasm-bindgen --target web --out-dir pkg target/wasm32-unknown-unknown/release/engine.wasm
wasm-opt -O pkg/engine_bg.wasm -o /path/to/output/engine_bg.wasm
npm ci --ignore-scripts
WASM_RELEASE=1 npm run build:ts
```

For Code App, take `dist/debugger-sh.js` and replace its two occurrences of
`https://cdn.jsdelivr.net/npm/debugger-sh@0.3.15/dist/engine_bg.wasm` with
`http://localhost:20233/debugger/engine_bg.wasm`. The integrated `engine.js`
already has this mapping. `frontend.patch` documents the frontend changes from
commit `88321dac`; it is already applied to the integrated `debugger.js`.

## Browser test

The browser test needs Node, Playwright and Chrome. Set
`DEBUGGER_SH_COMPILER_DIST` to a debugger-sh 0.3.15 `dist` directory containing
`debugger-sh.js`, its original `engine_bg.wasm`, and the upstream compiler
assets `llvm.core.wasm` and `llvm-resources.tar.gz`. These assets can be obtained
from the debugger-sh package and its documented toolchain URLs. If Playwright
is not in Node's normal module search path, set `PLAYWRIGHT_MODULE` to its
module directory. `CHROME_PATH` can select a Chrome executable.

```sh
DEBUGGER_SH_COMPILER_DIST=/path/to/debugger-sh/dist \
  node Tests/CPPDebugger/staged-globals/browser.test.cjs
```

The test serves the integrated runtime and binds only to `127.0.0.1:20233`. It checks globals and constants,
shadowed names, scalar types, typedefs, small/large and multidimensional arrays,
stepping, unknown bounds, invalid DWARF addresses, and existing local values,
structures, containers and strings. The C fixtures include DWARF 4 direct
addresses and DWARF 5 indexed addresses.
