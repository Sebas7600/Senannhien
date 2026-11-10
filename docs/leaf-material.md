# Fallen leaf edge colour

Revision 5 uses a straight-sRGB photo atlas, an opaque alpha-tested material and an opaque main canvas. The same 512² WebP and eight-triangle instanced leaf meshes are retained. There are no extra texture downloads, draw calls, physics bodies or per-frame allocations.

The earlier fixes corrected manual RGB/alpha division but retained alpha-to-coverage. In the installed Three.js renderer, `alphaToCoverage=true` excludes the `OPAQUE` shader define even when the material is not transparent. Its fragment can therefore write fractional framebuffer alpha around the cutout. A transparent canvas can expose the light CSS page when the browser composites those pixels; changing the texture alone does not close that path. This is the remaining failure mechanism identified from the local renderer source, rather than a new white border in the photo itself.

The leaf material now has `alphaToCoverage=false`, `transparent=false`, normal blending and full opacity. The standard opaque fragment forces surviving pixels to alpha 1, and the alpha test discards the outside pixels before they write depth. Main-world Canvas context options explicitly set `alpha=false` and `premultipliedAlpha=false`, so page background cannot leak through any framebuffer sample. High quality retains normal MSAA, while low quality keeps its existing non-MSAA setting. The tradeoff is a hard texture cutout rather than coverage antialiasing at the leaf silhouette.

Regression tests start from stale texture flags, verify straight-sRGB decoding and the material's opaque combination against the installed renderer's actual `OPAQUE` condition and output chunk, and retain all existing atlas, leaf simulation, sweep and broom tests. Automated checks validate this render configuration; visual confirmation on the user's GPU is pending browser access.

Primary reference: https://threejs.org/manual/pages/tips.html explains the renderer/material premultiplied-alpha distinction and opaque canvas setup. The repository's pinned Three.js source is the authority for the exact shader conditions tested here.
