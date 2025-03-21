# Security

We use various security measures to protect our users' data and ensure the integrity of our platform.

## Threat Model

![Threat Model](/assets/threat-model.png)

Since most of the infrastructure is hosted on fly.io,
services can communicate internally with each other without the chance of interception or tampering.

## General Mitigated Risks

Fly.io has a thorough security policy and gets regular security audits as can be seen here: https://fly.io/security

Similarly, Vercel also gets frequently penetration tested and even provides an application level firewall
as well as bot protection: https://vercel.com/security

### Browser Security

- **Cross-Site Scripting (XSS)**: We use Content Security Policy (CSP) to prevent XSS attacks.
React also sanitizes most inputs for us as long as dangerouslySetInnerHTML is avoided.
- **Cross-Site Request Forgery (CSRF)**: We use a separate URL to host the backend, which only allows requests from our frontend.
Furthermore, all API actions are required to only use application/json body, which prevents any potential XHR based attacks.

### Server Security

- **Denial of Service**: We use Cloudflare's as well as Vercel's DDoS protection to mitigate denial of service attacks.
- **SQL Injection**: Prisma uses prevents SQL injection as long as model based queries are used.
- **Command Injection**: We use input validation and sanitization to prevent command injection attacks.
- **Rate Limiting**: We currently employ rate limiting on our auth endpoints (3 requests per 10 seconds)

### Browser to Server Security

- **Cross-Site Scripting (XSS)**: We use Content Security Policy (CSP) to prevent XSS attacks.
React also sanitizes most inputs for us as long as dangerouslySetInnerHTML is avoided.
- **Cross-Site Request Forgery (CSRF)**: We use a separate URL to host the backend, which only allows requests from our frontend.
Furthermore, all API actions are required to only use application/json body, which prevents any potential XHR based attacks.
- **SSL Certificate Security**: We use Cloudflare encrypted SSL certificates to ensure secure communication between services.

### Deployment Security

- **Code Security**: We use code review and static analysis tools to ensure secure code.
- **Secret Leakage**: We use GitGuardian to prevent leaking of secrets in the codebase.
