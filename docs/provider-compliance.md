# Provider Compliance

## Non-Negotiables

- No scraping of protected platforms.
- No CAPTCHA bypassing or anti-bot evasion.
- No invented live data or fake API connectivity.
- No provider marked as connected without real credentials.

## Integration Policy

- Every source must implement an explicit adapter contract.
- Every adapter must expose a health status.
- Missing credentials result in `NOT_CONFIGURED`, not a fallback to fabricated data.
- Mock and manual import sources are valid MVP paths and must remain clearly labeled.

## Planned Adapters

- `MobileProvider`
- `AutoScoutProvider`
- `MockVehicleProvider`
- future auction and transport adapters

