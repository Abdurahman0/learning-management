# Google Authentication - Frontend Integration Guide

This document describes how the frontend application can integrate with the "Login with Google" APIs. The backend currently supports two different integration flows. You can choose the one that best fits your frontend architecture.

---

## The Two Available Auth Flows

### Flow 1: OAuth 2.0 Redirect Flow (Recommended for Web without Google SDK)
In this flow, the frontend relies mostly on backend redirects to handle Google authentication securely. The frontend redirects the user to Google, and after a successful login, the backend will redirect the user back to the frontend with a short-lived temporary code, which the frontend exchanges for the actual JWT tokens.

### Flow 2: Direct ID Token Flow (Recommended if using Google Identity SDK)
In this flow, the frontend integrates the Google SDK (like `@react-oauth/google`) to authenticate the user directly on the client side. Once Google provides an `id_token`, the frontend sends it to the backend to get the JWT tokens.

---

## 1. OAuth 2.0 Redirect Flow

This flow requires interacting with three main steps, starting from the user clicking a "Login with Google" button.

### Step 1: Get the Google Authorization URL
Fetch the Google login URL from the backend and redirect the user to it.

**Endpoint:** `GET /api/auth/google/url/`

**Query Parameters:**
- `next` (optional): The frontend path to redirect the user to after the authentication is complete (e.g., `/dashboard`).

**Example Request:**
```http
GET /api/auth/google/url/?next=/dashboard HTTP/1.1
```

**Example Response (200 OK):**
```json
{
  "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "redirect_uri": "http://localhost:8000/api/auth/google/callback/"
}
```
*Action:* Redirect the user's browser to the `authorization_url`.

### Step 2: Handle the Callback Redirect
After the user logs in via Google, Google redirects them back to the backend. The backend processes the Google callback securely and then redirects the browser **back to your frontend** using the `next` path you provided, appending a temporary `code`.

**Example User redirection by Backend:**
`https://your-frontend.com/dashboard/?code=temporary-google-login-code`

*Action:* The frontend should parse the URL query parameters upon loading and extract the `code`.

### Step 3: Exchange the Temporary Code for JWT Tokens
Once the frontend extracts the `code` from the URL, exchange it for the final Django Rest Framework access and refresh JWT tokens.

**Endpoint:** `POST /api/auth/google/exchange/`

**Request Body:**
```json
{
  "code": "temporary-google-login-code"
}
```

**Example Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

*(Rate Limit: 20 requests per 15 minutes per IP)*

---

## 2. Direct ID Token Flow

If you are using Google's Client Javascript SDK (e.g., the One-Button login), you can use this simpler alternative.

### Step 1: Obtain the `id_token` on the frontend
Use your Google Auth library to trigger the login popup/button. On successful login, the library will provide you with a Google ID Token (`id_token`).

### Step 2: Send the `id_token` to the Backend
Send this token to the backend to authenticate the user and receive your JWT tokens.

**Endpoint:** `POST /api/auth/google/`

**Request Body:**
```json
{
  "id_token": "your-google-id-token-here"
}
```

**Example Response (200 OK):**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

*(Rate Limit: 10 requests per 15 minutes per IP)*

---

## Error Handling Responses
For any of the endpoints above, an error (like an invalid code, expired token, or unregistered email setup if constrained) will return a standard HTTP 400 with a detail payload:
```json
{
  "detail": "Descriptive error message here."
}
```
Rate limiting (429 Too Many Requests) will return:
```json
{
  "detail": "Too many requests. Please try again later."
}
```
