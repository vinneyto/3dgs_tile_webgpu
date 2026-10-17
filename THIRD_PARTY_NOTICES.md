# Third-party notices

Spark — https://github.com/sparkjsdev/spark

Vendored Rust sources originate from commit `f5368253780bed4d863c96b1fdea9dd3d614d131`. The client ellipsoid/disk ray intersection is adapted from Spark's Rust raycast implementation.

The MIT License

Copyright © 2025 WORLD LABS TECHNOLOGIES, INC.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

## Native desktop experiment

The native LOD traversal in `apps/native/crates/spark-lod` is adapted from Spark's Rust traversal at `a403b6d17f1b45d714e47834188570e14d152651`, under the MIT notice above.

Forward WGSL routines in `apps/native/crates/brush-renderer/src/shaders` are adapted from Brush v0.3.0 (`3edecbb2fe79d3e2c87eeab85b15e0b1dd10d486`), Copyright Brush contributors, under Apache-2.0. Original sources and the full license are retained in `apps/native/third_party/brush`; modifications are listed in `apps/native/UPSTREAM.md`. Bevy is used as an MIT OR Apache-2.0 Cargo dependency.
