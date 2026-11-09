param([string]$OutputDirectory = (Join-Path $PSScriptRoot '../public/art/signs'))
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$culture = [Globalization.CultureInfo]::InvariantCulture
$font = New-Object Drawing.FontFamily('Palatino Linotype')
function Number([double]$Value) { $Value.ToString('0.##', $culture) }
function Lettering([string]$Text, [double]$CenterY) {
    $path = New-Object Drawing.Drawing2D.GraphicsPath
    try {
        $path.AddString($Text, $font, [int][Drawing.FontStyle]::Bold, 100, [Drawing.PointF]::Empty, [Drawing.StringFormat]::GenericTypographic)
        $bounds = $path.GetBounds()
        $scale = [Math]::Min(1, 1110 / $bounds.Width)
        $translateX = 800 - ($bounds.X + $bounds.Width / 2) * $scale
        $translateY = $CenterY - ($bounds.Y + $bounds.Height / 2) * $scale
        $points = $path.PathPoints; $types = $path.PathTypes
        $d = [Text.StringBuilder]::new()
        for ($i = 0; $i -lt $points.Length; $i++) {
            $kind = $types[$i] -band 7
            if ($kind -eq 0 -or $kind -eq 1) {
                $command = if ($kind -eq 0) { 'M' } else { 'L' }
                [void]$d.Append("$command$(Number $points[$i].X),$(Number $points[$i].Y) ")
            } elseif ($kind -eq 3) {
                [void]$d.Append("C$(Number $points[$i].X),$(Number $points[$i].Y) $(Number $points[$i+1].X),$(Number $points[$i+1].Y) $(Number $points[$i+2].X),$(Number $points[$i+2].Y) ")
                $i += 2
            }
            if (($types[$i] -band 128) -ne 0) { [void]$d.Append('Z ') }
        }
        return "<path d=`"$d`" transform=`"translate($(Number $translateX) $(Number $translateY)) scale($(Number $scale))`"/>"
    } finally { $path.Dispose() }
}
$signs = @(
    @{ Id = 'tea'; Title = 'Trà đình Vọng Sơn'; Lines = @('Thưởng thức chén trà,', 'tâm an vạn sự') },
    @{ Id = 'library'; Title = 'Tàng Kinh Các'; Lines = @('Đọc sách mở trí,', 'tĩnh tâm dưỡng đức') },
    @{ Id = 'dining'; Title = 'Nhà ăn Hương Thiền'; Lines = @('Dùng bữa chánh niệm,', 'nuôi dưỡng thân tâm') }
)
[void][IO.Directory]::CreateDirectory([IO.Path]::GetFullPath($OutputDirectory))
foreach ($sign in $signs) {
    $title = [Security.SecurityElement]::Escape($sign.Title)
    $description = [Security.SecurityElement]::Escape(($sign.Lines -join ' '))
    $letters = (Lettering $sign.Lines[0] 144) + (Lettering $sign.Lines[1] 263)
    # The shared relief pattern is drawn as vectors, without sampling the reference photograph.
    $svg = @"
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400" viewBox="0 0 1600 400" role="img" aria-labelledby="title desc">
<title id="title">$title</title><desc id="desc">$description. Hoành phi nền son, chữ vàng, khung gỗ và hoa sen.</desc>
<defs>
 <linearGradient id="wood" x2="0" y2="1"><stop stop-color="#553125"/><stop offset=".5" stop-color="#28130f"/><stop offset="1" stop-color="#5c3326"/></linearGradient>
 <linearGradient id="lacquer" x2="0" y2="1"><stop stop-color="#842e26"/><stop offset=".48" stop-color="#66231e"/><stop offset="1" stop-color="#481912"/></linearGradient>
 <linearGradient id="gold" x2="0" y2="1"><stop stop-color="#fff0ae"/><stop offset=".35" stop-color="#e8c474"/><stop offset=".65" stop-color="#be883a"/><stop offset="1" stop-color="#f0d48a"/></linearGradient>
 <linearGradient id="inkGold" x2="0" y2="1"><stop stop-color="#fff0b2"/><stop offset=".58" stop-color="#efd18a"/><stop offset="1" stop-color="#d4a655"/></linearGradient>
 <pattern id="grain" width="400" height="30" patternUnits="userSpaceOnUse"><path d="M0 5Q100 0 200 5T400 5M0 21Q100 28 200 21T400 21" fill="none" stroke="#edb05b" stroke-opacity=".035" stroke-width="2"/></pattern>
 <g id="lotus" fill="none" stroke="url(#gold)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
  <path d="M0 25C-28 10-30-17 0-52C30-17 28 10 0 25ZM0 25C-47 27-67 4-61-27C-31-23-8-8 0 25ZM0 25C47 27 67 4 61-27C31-23 8-8 0 25ZM0 25C-33 49-66 35-78 9C-42 4-18 13 0 25ZM0 25C33 49 66 35 78 9C42 4 18 13 0 25ZM-48 51Q0 65 48 51"/>
  <path d="M0 27V44M-20 44Q0 56 20 44"/>
 </g>
 <g id="corner" fill="none" stroke="url(#gold)" stroke-linecap="round" stroke-width="5">
  <path d="M0 73V0H112M15 57V15H96M30 42V30H72M100 0C128 0 132 25 114 29C99 32 94 16 105 13M0 83C0 106 26 110 30 94C34 81 16 76 15 86"/>
 </g>
 <g id="lettering">$letters</g>
</defs>
<path d="M24 0H1576L1600 24V376L1576 400H24L0 376V24Z" fill="url(#wood)"/>
<path d="M34 15H1566L1585 34V366L1566 385H34L15 366V34Z" fill="url(#gold)"/>
<path d="M45 27H1555L1573 45V355L1555 373H45L27 355V45Z" fill="#49271b"/>
<path d="M57 39H1543L1561 57V343L1543 361H57L39 343V57Z" fill="url(#lacquer)" stroke="#e2bb68" stroke-width="4"/>
<rect x="42" y="42" width="1516" height="316" fill="url(#grain)"/>
<path d="M185 59H1415M185 341H1415" stroke="#c99c50" stroke-width="2"/>
<g><use href="#corner" transform="translate(65 65)"/><use href="#corner" transform="translate(1535 65) scale(-1 1)"/><use href="#corner" transform="translate(65 335) scale(1 -1)"/><use href="#corner" transform="translate(1535 335) scale(-1 -1)"/></g>
<use href="#lotus" transform="translate(145 204) scale(.86)"/><use href="#lotus" transform="translate(1455 204) scale(.86)"/>
<use href="#lettering" fill="#30130c" transform="translate(0 5)"/>
<use href="#lettering" fill="url(#inkGold)"/>
</svg>
"@
    $file = Join-Path $OutputDirectory ($sign.Id + '.svg')
    [IO.File]::WriteAllText($file, $svg, [Text.UTF8Encoding]::new($false))
    Write-Output "$($sign.Id): $((Get-Item -LiteralPath $file).Length) bytes"
}
$font.Dispose()
