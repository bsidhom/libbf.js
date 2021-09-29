# libbf.js

This is a JavaScript/WASM wrapper around Fabrice Bellard's ultra-portable [libbf
C library](https://bellard.org/libbf/).

Code is based on libbf version 2020-01-19. This project is licensed under the
MIT License (same as libbf itself).

## Building

This project requires the Emscripten toolchain. Once you have it installed and
configured, build the core `libbf` library:

```sh
emmake make -C libbf
```

Then, assuming that was successful, build the JavaScript/WASM targets:

```sh
emmake make
```

Note that this requires the Emscripten headers to be available to CPP. The
easiest way to do this is to configure `CFLAGS` inside of `env.config` (see
`env.config.template`).

## TODO

- Basic tests
- Packaging
- Better ergonomics. Right now, the API closely matches the C API. It would be
  nice to add an immutable, fluent API on top of this, but lack of RAII makes
  this difficult.
