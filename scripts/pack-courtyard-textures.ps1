param([string]$Source='public/assets/courtyard',[string]$Output='tmp/temple-imports/web-textures')
Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Path $Output -Force | Out-Null
$jpeg=[Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -EQ 'image/jpeg'
foreach($file in Get-ChildItem -LiteralPath $Source -File | Where-Object Extension -In '.jpg','.png'){
  $image=[Drawing.Image]::FromFile($file.FullName)
  try{
    $target=Join-Path $Output $file.Name
    if([Math]::Max($image.Width,$image.Height) -le 1024){Copy-Item -LiteralPath $file.FullName -Destination $target -Force;continue}
    $ratio=1024/[Math]::Max($image.Width,$image.Height)
    $bitmap=[Drawing.Bitmap]::new([int]($image.Width*$ratio),[int]($image.Height*$ratio))
    $graphics=[Drawing.Graphics]::FromImage($bitmap)
    try{
      $graphics.InterpolationMode=[Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.DrawImage($image,0,0,$bitmap.Width,$bitmap.Height)
      if($file.Extension -eq '.png'){$bitmap.Save($target,[Drawing.Imaging.ImageFormat]::Png)}
      else{$quality=[Drawing.Imaging.EncoderParameters]::new(1);try{$quality.Param[0]=[Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality,[long]88);$bitmap.Save($target,$jpeg,$quality)}finally{$quality.Dispose()}}
    }finally{$graphics.Dispose();$bitmap.Dispose()}
  }finally{$image.Dispose()}
}
