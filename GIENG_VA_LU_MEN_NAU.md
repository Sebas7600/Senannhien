# Giếng đá và bốn lu men nâu

Replaces the procedural well and jars at their existing quest stations with the user-supplied Gieng_Da.zip and Chum_Nuoc_Men_Nau.zip artwork. Pickup, delivery, four-load capacity, automatic water consumption and merit rewards retain their existing behavior.

The well keeps its irregular mossy stone courses, carved arch, pulley and tied rope. The central hanging rope is separated from the static artwork so its length follows the rising bucket. A small dark floor hides the terrain inside the well. The four jars retain the supplied glazed ceramic body and original UVs; each is normalized uniformly to 1.12 m high, within its existing collision footprint, with a different rotation.

## Runtime budget

| Resource | High | Low |
| --- | ---: | ---: |
| Compressed geometry | 279,456 bytes | 253,172 bytes |
| Shared textures | 154,340 bytes | 154,340 bytes |
| Total new download | 433,796 bytes | 407,512 bytes |
| Placed station triangles, including all four jars, water, rope and bucket | 14,076 | 9,337 |
| Draw calls for all stations | 7 | 7 |

Nine shared WebP maps use three 512px color maps and six 256px normal/roughness maps: approximately 6 MiB of GPU memory including mipmaps. All four jars use one instanced draw and one geometry copy. Both LODs load the same cached textures through useTexture; maps are not duplicated in the GLBs. Color maps use sRGB, data maps use linear sampling, and all retain glTF's unflipped UV convention. The high setting adds a restrained clearcoat to the ceramic; low disables it.

Water levels are fitted against radial sections of both geometry LODs, with clearance inside each jar's inner wall. Instanced bounds refresh only when layouts or discrete water levels change. The drawing animation changes the bucket/rope transforms and skips work while idle. The carried yoke and buckets remain 814 triangles with no new textures.

## Reproduction

1. Extract the supplied archives under tmp/water-imports, preserving their folders.
2. Run npm run prepare:water. The script accepts an alternate extracted root and FFmpeg executable as positional arguments. Its default encoder is the existing local tmp/audio-tools/package/ffmpeg.exe.
3. Run npm run audit:water, npm run test:client and npm run build.

The pipeline writes versioned runtime assets, src/waterAssetLayout.ts and public/assets/water-task/asset-budget.json. The report includes input hashes, actual byte counts and triangle counts. Original Maya files and source images remain outside the runtime asset directory.

Automated verification decodes both LODs with the game's Meshopt decoder, checks finite normals/UVs, bounds and budgets, and raycasts the inner jar wall at every playable fill level. Browser visual verification remains unavailable while local browser use is disabled in Work settings.
