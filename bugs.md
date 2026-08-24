## Auth stuff
- Refresh tokens are not rotated
- No rate limiting on email_challenge
- logging out doesn't revoke access token which will continue to be valid until 1hr expiry
- /login does not have any rate limiting
- password minimum strength requirements
