$ErrorActionPreference = 'Stop'
$base = 'http://localhost:4000/api'
$out = @()
$login = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -Body '{"email":"admin@hotelkesari.com","password":"Admin@123"}' -ContentType 'application/json'
$h = @{ Authorization = "Bearer $($login.token)" }
$endpoints = @(
  '/auth/me',
  '/dashboard',
  '/reports',
  '/issues/complaints',
  '/issues/maintenance',
  '/reviews',
  '/reviews/analytics',
  '/revenue',
  '/revenue/analytics',
  '/bookings',
  '/bookings/analytics',
  '/performance',
  '/notifications',
  '/notifications/unread-count',
  '/users',
  '/ai/insights'
)
foreach ($e in $endpoints) {
  try {
    $r = Invoke-WebRequest -Uri "$base$e" -Headers $h -UseBasicParsing
    $out += "OK   $($r.StatusCode)  $e"
  } catch {
    $code = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 'ERR' }
    $out += "FAIL $code  $e  -> $($_.Exception.Message)"
  }
}
$out -join "`n" | Out-File smoke_result.txt -Encoding utf8
