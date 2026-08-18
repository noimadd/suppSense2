# Authentication
JWT access token that lasts for 1 hr and refresh tokens stored in Redis

## Flow 
1. Login -> ```POST /api/auth/login``` - this checks password, and that email is verified upon success returns ```accessToken, refreshToken, and sessionId```
2. Refresh -> ```POST /api/auth/refresh``` - uses the ```userId, sessionId, and refreshToken``` to create a new accessToken ```accessToken```
3. Logout -> ```POST /api/auth/logout``` - deletes session from Redis TODO(damion) -> also remove ```refreshToken``` when logging out so that the user cannot continue to access the app

## Sessions
Sessions are stored in Redis, they are mapped as ```session:<userId>:<sessionId> -> { refreshToken, email, userType }``` they have a 24 hours ttl and are refreshed on each ```/refresh``` call

## Protected Routes
Any route requiring the user to first login is 'protected'
<br>
This calls the middleware ```requireAuth``` which checks bearer, verifies the JWT, and attaches result to req.user

## Known gaps and vulnerabilities
- Refresh tokens are not rotated
- No rate limiting on email_challenge
- logging out doesn't revoke access token which will continue to be valid until 1hr expiry
- /login does not have any rate limiting
- password minimum strength requirements