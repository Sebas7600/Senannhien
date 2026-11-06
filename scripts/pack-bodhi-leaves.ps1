param([string]$Source='tmp/sweep-imports/La_Bo_De_Texture',[string]$Output='public/assets/sweeping',[string]$WebPEncoder='tmp/audio-tools/package/ffmpeg.exe')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -TypeDefinition @'
using System;
public static class LeafAlphaBounds {
 public static int[] Find(byte[] a,int width,int height,int stride){int x0=width,y0=height,x1=0,y1=0;for(int y=0;y<height;y++)for(int x=0;x<width;x++)if(a[y*stride+x*4+3]>32){x0=Math.Min(x0,x);y0=Math.Min(y0,y);x1=Math.Max(x1,x);y1=Math.Max(y1,y);}return new int[]{Math.Max(0,x0-3),Math.Max(0,y0-3),Math.Min(width,x1+4),Math.Min(height,y1+4)};}
}
'@
New-Item -ItemType Directory -Path $Output -Force | Out-Null
$atlas=[Drawing.Bitmap]::new(512,512,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics=[Drawing.Graphics]::FromImage($atlas)
$files=@('La_Bo_De_Vang.png','La_Bo_De_Do_Vang.png','La_Bo_De_Xanh.png','La_Bo_De_Vang.png');$entries=@()
try{
 $graphics.Clear([Drawing.Color]::Transparent);$graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
 for($i=0;$i -lt 4;$i++){
  $path=Join-Path $Source $files[$i];$image=[Drawing.Bitmap]::FromFile((Resolve-Path -LiteralPath $path).Path)
  try{$pixels=$image.LockBits([Drawing.Rectangle]::new(0,0,$image.Width,$image.Height),[Drawing.Imaging.ImageLockMode]::ReadOnly,[Drawing.Imaging.PixelFormat]::Format32bppArgb);try{$raw=[byte[]]::new($pixels.Stride*$pixels.Height);[Runtime.InteropServices.Marshal]::Copy($pixels.Scan0,$raw,0,$raw.Length);$bounds=[LeafAlphaBounds]::Find($raw,$image.Width,$image.Height,$pixels.Stride)}finally{$image.UnlockBits($pixels)};$crop=[Drawing.Rectangle]::FromLTRB($bounds[0],$bounds[1],$bounds[2],$bounds[3]);$target=[Drawing.Rectangle]::new(($i%2)*256+4,[Math]::Floor($i/2)*256+4,248,248);$graphics.DrawImage($image,$target,$crop,[Drawing.GraphicsUnit]::Pixel);if($i -lt 3){$entries+=@{file=$files[$i];sourceBytes=(Get-Item -LiteralPath $path).Length;width=$image.Width;height=$image.Height;crop=@($crop.X,$crop.Y,$crop.Width,$crop.Height);aspect=$crop.Width/[double]$crop.Height}}}finally{$image.Dispose()}
 }
 $atlasPng=Join-Path (Resolve-Path -LiteralPath $Source).Path 'atlas-intermediate.png';$atlas.Save($atlasPng,[Drawing.Imaging.ImageFormat]::Png)
 if(-not(Test-Path -LiteralPath $WebPEncoder)){throw 'Provide -WebPEncoder with the path to a local FFmpeg executable with libwebp.'}
 $atlasPath=Join-Path (Resolve-Path -LiteralPath $Output).Path 'bodhi-leaves-v1.webp'
 & $WebPEncoder -v error -y -i $atlasPng -c:v libwebp -q:v 85 -compression_level 6 -lossless 0 $atlasPath
 if($LASTEXITCODE -ne 0){throw 'WebP encoding failed.'}
 @{source='La_Bo_De_Texture (2).zip';file='bodhi-leaves-v1.webp';bytes=(Get-Item -LiteralPath $atlasPath).Length;width=512;height=512;cellSize=256;padding=4;variants=$entries;rgbaGpuBytesWithMipmaps=1398100}|ConvertTo-Json -Depth 6|Set-Content -LiteralPath (Join-Path $Output 'leaves-budget.json') -Encoding UTF8
}finally{$graphics.Dispose();$atlas.Dispose()}
Get-Content -LiteralPath (Join-Path $Output 'leaves-budget.json') -Raw
