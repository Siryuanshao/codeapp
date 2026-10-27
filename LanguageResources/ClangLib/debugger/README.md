# C/C++ debugger runtime

`engine.js` and `engine_bg.wasm` are from debugger-sh 0.3.15 (MIT; see
`LICENSE.debugger-sh`). The bundle is configured to load its assets from the
app's local WASM server.

The app compiles the user's file with its existing Clang. debugger-sh normally
invokes its own browser-based Clang; `adapter.wasm`, built from `adapter.cpp`,
instead passes the already compiled WASM binary to the debugger. This keeps
the compiler and headers consistent with ordinary local execution and avoids
bundling a second toolchain. `empty.tar.gz` supplies the unused sysroot that
the upstream engine otherwise expects to download.
