# Load Balancer, DNS, and TLS

This document captures production routing placeholders.

## Domains

- getpostar.com -> Website service
- api.getpostar.com -> Backend API service
- admin.getpostar.com -> Admin service
- client.getpostar.com -> Client service
- copyright.getpostar.com -> Copyright service

## TLS

- Use managed certificates where possible.
- Ensure all production domains resolve to HTTPS.
- Redirect HTTP to HTTPS.

## Routing checks

- GET https://api.getpostar.com/api/v1/health returns healthy service response.
- Website legal routes are reachable.
- Admin login route is reachable.
- Client login route is reachable.
- Copyright request/status/find routes are reachable.

## CORS

Backend production CORS must allow:

- https://client.getpostar.com
- https://admin.getpostar.com
- https://copyright.getpostar.com
