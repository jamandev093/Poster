# Poster Post-Deploy Smoke Checks

Run these checks after production deployment or rollback.

## Backend public checks

- GET https://api.getpostar.com/api/v1/health
- GET https://api.getpostar.com/api/v1/public/business-identity

## Website checks

- https://getpostar.com
- https://getpostar.com/privacy
- https://getpostar.com/terms
- https://getpostar.com/copyright
- https://getpostar.com/advertisers
- https://getpostar.com/publishers

## Client checks

- https://client.getpostar.com/login
- https://client.getpostar.com/signup
- https://client.getpostar.com/wallet
- https://client.getpostar.com/payments

## Admin checks

- https://admin.getpostar.com/login
- https://admin.getpostar.com/system-status

## Copyright checks

- https://copyright.getpostar.com
- https://copyright.getpostar.com/request
- https://copyright.getpostar.com/status
- https://copyright.getpostar.com/find
- https://copyright.getpostar.com/bulk-removal

## CORS checks

- Client origin can call Backend.
- Admin origin can call Backend.
- Copyright origin can call Backend.
- Website can fetch public business identity.

## Payment checks

- Razorpay Checkout public key is present in Client only.
- Razorpay webhook URL points to production Backend.
- Razorpay secret values are not exposed in frontend bundles or public env files.
