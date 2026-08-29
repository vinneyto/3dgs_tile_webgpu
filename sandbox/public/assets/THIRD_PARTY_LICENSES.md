# Third-party demo asset

`dolphins-colored-3dgs.ply` is a deterministic Gaussian-splat derivative of
[`dolphins_colored.ply`](https://github.com/mrdoob/three.js/blob/dev/examples/models/ply/ascii/dolphins_colored.ply)
from the Three.js repository. The source mesh is redistributed under the Three.js MIT license.

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the “Software”), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions
of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED
TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
IN THE SOFTWARE.

The conversion samples 60,000 surface points deterministically, converts vertex RGB to canonical degree-0 SH,
and assigns thin, surface-aligned Gaussian covariances. It can be reproduced with:

```bash
python scripts/generate_dolphins_3dgs.py \
  dolphins_colored.ply \
  sandbox/public/assets/dolphins-colored-3dgs.ply
```
