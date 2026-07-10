# Meridian Retail Routing Explanation

## Overview

The Meridian Retail platform consists of multiple services running as separate containers:

- Frontend
- Authentication Service
- Catalog Service
- Orders Service
- PostgreSQL Database

Instead of exposing different ports directly to users, Nginx acts as a reverse proxy and routes requests to the appropriate service.

Architecture:

```text
Client Request
      ↓
Domain (dubem-retail.chickenkiller.com)
      ↓
Nginx Reverse Proxy
      ↓
--------------------------------
| Frontend Service            |
| Authentication Service      |
| Catalog Service             |
| Orders Service              |
--------------------------------
```

## What proxy_pass does

The `proxy_pass` directive forwards incoming requests from Nginx to another service running internally.

Example:

```nginx
location /api/catalog/ {
    proxy_pass http://127.0.0.1:8002;
}
```

This means:

1. User requests:

```
http://dubem-retail.chickenkiller.com/api/catalog/products
```

2. Nginx receives the request.

3. Nginx forwards it internally to:

```
http://127.0.0.1:8002/products
```

4. Catalog service processes the request.

5. Response returns through Nginx back to the user.

Users never see internal ports.

---

## Why each location block exists

### Frontend

```nginx
location /
```

Purpose:

Routes general website requests to the frontend application.

Examples:

- Homepage
- Product pages
- Static assets

Without it:

Users would receive errors when opening the main website.

---

### Authentication Service

```nginx
location /api/auth/
```

Purpose:

Routes authentication-related requests.

Examples:

- Signup
- Login
- User authentication

Without it:

Signup and login requests would fail.

---

### Catalog Service

```nginx
location /api/catalog/
```

Purpose:

Routes product-related requests.

Examples:

- Product listing
- Product details

Without it:

Users could not browse products.

---

### Orders Service

```nginx
location /api/orders/
```

Purpose:

Routes order-related requests.

Examples:

- Place order
- View order history

Without it:

Customers would not be able to create orders.

---

## What would happen if a location block was removed

If a location block is removed, Nginx would not know where to send that request.

Example:

Removing:

```nginx
location /api/catalog/
```

and then requesting:

```
http://dubem-retail.chickenkiller.com/api/catalog/products
```

would likely return:

```
404 Not Found
```

or

```
502 Bad Gateway
```

depending on the remaining configuration.

The catalog service would still exist and run in Docker, but users would no longer be able to access it through the domain.

## Conclusion

Reverse proxy routing allows multiple services to appear as a single application to users.

Instead of exposing multiple ports:

- :8001
- :8002
- :8003

users interact through one domain while Nginx handles internal routing.
