# C/C++ debugger runtime

`engine.js` and `engine_bg.wasm` are from debugger-sh 0.3.15 (MIT; see
`LICENSE.debugger-sh`). The bundle is configured to load its assets from the
app's local WASM server. A small change to `engine.js` exposes the paused
program's shared memory so `debugger.js` can format strings and show container
sizes using the wasm32 libc++ layout shipped with Code App. Supported containers
are array, vector, deque, list, stack, queue, priority_queue, and the map/set
families, including unordered and multi variants. These layouts use the standard
allocator and, for maps and sets, standard comparators and hashes. Vector and
priority queue sizes are available for common scalar, pointer, string, vector,
and pair element types. Other layouts display `size = ?` instead of a guessed
value. Container elements are intentionally not expanded.

Array values up to 100 elements remain expandable. Larger arrays show their
length only. If the engine reports a negative array bound, the display uses
`[?]` because the true size cannot be recovered from that value alone.

The app compiles the user's file with its existing Clang. debugger-sh normally
invokes its own browser-based Clang; `adapter.wasm`, built from `adapter.cpp`,
instead passes the already compiled WASM binary to the debugger. This keeps
the compiler and headers consistent with ordinary local execution and avoids
bundling a second toolchain. `empty.tar.gz` supplies the unused sysroot that
the upstream engine otherwise expects to download.
