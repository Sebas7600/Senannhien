param([Parameter(Mandatory=$true)][string]$InputImage,[string]$OutputPath=(Join-Path $PSScriptRoot '../public/assets/textures/cushion/lien-thuy-albedo.jpg'))
Add-Type -AssemblyName System.Drawing
$inputBitmap=[System.Drawing.Image]::FromFile((Resolve-Path -LiteralPath $InputImage).Path)
$atlas=New-Object System.Drawing.Bitmap(1024,1024)
$graphics=[System.Drawing.Graphics]::FromImage($atlas)
$graphics.Clear([System.Drawing.Color]::FromArgb(183,157,104))
$graphics.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
# Top panel occupies the upper-left 768². Bottom strip is a separate body weave.
$graphics.DrawImage($inputBitmap,0,0,768,768)
$tones=@('#bca36d','#c6af7c','#b49a63','#d0b985','#aa905e')
$brushes=@($tones | ForEach-Object {New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($_))})
$highlight=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90,238,215,163),1)
$shadow=New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(65,89,69,36),1)
for($row=0;$row -lt 28;$row++){for($col=0;$col -lt 128;$col++){
  $x=$col*8;$y=800+$row*8
  $horizontal=(($row+$col)%4 -lt 2)
  $graphics.FillRectangle($brushes[($row*7+$col*11)%5],$x,$y,8,8)
  if($horizontal){$graphics.DrawLine($highlight,$x,$y+2,$x+8,$y+2);$graphics.DrawLine($shadow,$x,$y+7,$x+8,$y+7)}
  else{$graphics.DrawLine($highlight,$x+2,$y,$x+2,$y+8);$graphics.DrawLine($shadow,$x+7,$y,$x+7,$y+8)}
}}
$codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object {$_.MimeType -eq 'image/jpeg'}
$parameters=New-Object System.Drawing.Imaging.EncoderParameters(1)
$parameters.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality,([long]88))
$resolvedOutput=[System.IO.Path]::GetFullPath($OutputPath)
$atlas.Save($resolvedOutput,$codec,$parameters)
$brushes | ForEach-Object {$_.Dispose()}
$highlight.Dispose();$shadow.Dispose();$graphics.Dispose();$atlas.Dispose();$inputBitmap.Dispose();$parameters.Dispose()
Get-Item -LiteralPath $resolvedOutput | Select-Object Name,Length
