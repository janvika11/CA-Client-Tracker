# Phase 2: Auth + CRUD APIs Documentation

Complete API reference for all authentication and CRUD endpoints.

## 🔐 Authentication

### Base URL: `http://localhost:5000/api`

All authenticated endpoints require a valid JWT token in the `authToken` httpOnly cookie.

---

## Auth Endpoints

### 1. Login
```
POST /auth/login
```

**Request Body:**
```json
{
  "email": "demo@ca.com",
  "password": "demo1234"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Demo CA",
      "email": "demo@ca.com",
      "role": "owner",
      "firmDetails": {
        "firmName": "Demo CA Practice",
        "address": "123 Business Street, Mumbai",
        "logo": "https://via.placeholder.com/150"
      }
    }
  }
}
```

**Cookie Set:**
- `authToken`: JWT token (httpOnly, expires in 7 days)

---

### 2. Logout
```
POST /auth/logout
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Effect:** Clears `authToken` cookie

---

### 3. Get Current User
```
GET /auth/me
```

**Required:** Authentication via cookie

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "507f1f77bcf86cd799439011",
      "name": "Demo CA",
      "email": "demo@ca.com",
      "role": "owner",
      "firmDetails": { /* firm details */ }
    }
  }
}
```

---

## Services CRUD

### 1. List Services
```
GET /services?page=1&limit=20&search=&category=&status=active
```

**Query Parameters:**
- `page` (default: 1) - Page number
- `limit` (default: 20, max: 100) - Items per page
- `search` - Search by name or code
- `category` - Filter by category (GST, TDS, Income Tax, ROC, Audit, Advisory, Other)
- `status` - Filter by 'active' or 'inactive'
- `sortBy` (default: -createdAt) - Sort field with - for descending

**Response (200):**
```json
{
  "success": true,
  "data": {
    "services": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "GST Monthly Filing",
        "code": "GST-MF",
        "category": "GST",
        "defaultPrice": 2500,
        "billingCycle": "monthly",
        "description": "Monthly GST return filing",
        "isActive": true,
        "firmId": "507f1f77bcf86cd799439012",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "pages": 1
    }
  }
}
```

---

### 2. Get Single Service
```
GET /services/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "service": { /* service object */ }
  }
}
```

---

### 3. Create Service
```
POST /services
```

**Request Body:**
```json
{
  "name": "GST Monthly Filing",
  "code": "GST-MF",
  "category": "GST",
  "defaultPrice": 2500,
  "billingCycle": "monthly",
  "description": "Monthly GST return filing and compliance",
  "isActive": true
}
```

**Validation:**
- `name`: min 3 chars
- `code`: uppercase alphanumeric with hyphens
- `category`: one of [GST, TDS, Income Tax, ROC, Audit, Advisory, Other]
- `defaultPrice`: positive number
- `billingCycle`: one of [monthly, quarterly, half_yearly, annual, one_time]

**Response (201):**
```json
{
  "success": true,
  "message": "Service created successfully",
  "data": { "service": { /* created service */ } }
}
```

---

### 4. Update Service
```
PUT /services/:id
```

**Request Body:** (All fields optional)
```json
{
  "name": "GST Monthly + Quarterly",
  "defaultPrice": 3500,
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Service updated successfully",
  "data": { "service": { /* updated service */ } }
}
```

---

### 5. Delete Service
```
DELETE /services/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Service deleted successfully"
}
```

---

## Clients CRUD

### 1. List Clients
```
GET /clients?page=1&limit=20&search=&status=&city=
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)
- `search` - Search by name, email, PAN, GSTIN
- `status` - Filter: active, inactive, onboarding
- `city` - Filter by city
- `sortBy` (default: -createdAt)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clients": [
      {
        "_id": "507f1f77bcf86cd799439013",
        "name": "Acme Manufacturing Ltd",
        "firmName": "Acme Manufacturing Ltd",
        "contactPerson": "Rajesh Kumar",
        "email": "rajesh@acme.com",
        "phone": "+91-9876543210",
        "whatsapp": "+919876543210",
        "gstin": "27AABCT1234H1Z0",
        "pan": "AAAPL5055K",
        "address": "456 Industrial Area, Pune",
        "city": "Pune",
        "state": "Maharashtra",
        "pincode": "411001",
        "status": "active",
        "tags": ["manufacturing", "large"],
        "clientSince": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": { /* pagination data */ }
  }
}
```

---

### 2. Get Single Client
```
GET /clients/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": { "client": { /* client object */ } }
}
```

---

### 3. Create Client
```
POST /clients
```

**Request Body:**
```json
{
  "name": "TechStart Pvt Ltd",
  "firmName": "TechStart Pvt Ltd",
  "contactPerson": "Priya Singh",
  "email": "priya@techstart.com",
  "phone": "+91-9876543211",
  "whatsapp": "+919876543211",
  "gstin": "27AABCS1234H1Z0",
  "pan": "BBBPL5055K",
  "address": "789 Tech Park, Bangalore",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "status": "active",
  "tags": ["IT", "startup"]
}
```

**Validation:**
- `name`: required, min 2 chars
- `email`: valid email format, unique per firm
- `pan`: optional, regex pattern, unique per firm
- `gstin`: optional, 15-char Indian GSTIN pattern
- `whatsapp`: optional, 10+ digits
- `pincode`: optional, exactly 6 digits
- `status`: active, inactive, or onboarding

**Response (201):**
```json
{
  "success": true,
  "message": "Client created successfully",
  "data": { "client": { /* created client */ } }
}
```

---

### 4. Update Client
```
PUT /clients/:id
```

**Request Body:** (All fields optional)
```json
{
  "status": "active",
  "city": "Mumbai",
  "tags": ["IT", "startup", "high-growth"]
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client updated successfully",
  "data": { "client": { /* updated client */ } }
}
```

---

### 5. Delete Client
```
DELETE /clients/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client deleted successfully"
}
```

---

## Client Services CRUD

### 1. List Client Services
```
GET /client-services?page=1&limit=20&search=&sortBy=-createdAt
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clientServices": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "clientId": {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Acme Manufacturing Ltd",
          "email": "rajesh@acme.com"
        },
        "serviceId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "GST Monthly Filing",
          "code": "GST-MF",
          "category": "GST"
        },
        "customPrice": 2700,
        "billingCycle": "monthly",
        "startDate": "2024-01-15T00:00:00.000Z",
        "endDate": null,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "updatedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": { /* pagination data */ }
  }
}
```

---

### 2. Get Single Client Service
```
GET /client-services/:id
```

**Response (200):**
```json
{
  "success": true,
  "data": { "clientService": { /* client service object with populated fields */ } }
}
```

---

### 3. Create Client Service
```
POST /client-services
```

**Request Body:**
```json
{
  "clientId": "507f1f77bcf86cd799439013",
  "serviceId": "507f1f77bcf86cd799439011",
  "customPrice": 2700,
  "billingCycle": "monthly",
  "startDate": "2024-01-15",
  "isActive": true
}
```

**Validation:**
- `clientId`: valid MongoDB ID, must exist in firm
- `serviceId`: valid MongoDB ID, must exist in firm
- `customPrice`: optional, positive number
- `billingCycle`: optional override
- `startDate`: required, valid date
- `endDate`: optional, valid date

**Response (201):**
```json
{
  "success": true,
  "message": "Client service created successfully",
  "data": { "clientService": { /* created with populated fields */ } }
}
```

---

### 4. Update Client Service
```
PUT /client-services/:id
```

**Request Body:** (All fields optional)
```json
{
  "customPrice": 3000,
  "isActive": false,
  "endDate": "2024-12-31"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client service updated successfully",
  "data": { "clientService": { /* updated service */ } }
}
```

---

### 5. Delete Client Service
```
DELETE /client-services/:id
```

**Response (200):**
```json
{
  "success": true,
  "message": "Client service deleted successfully"
}
```

---

### 6. Get All Services for a Client
```
GET /client-services/client/:clientId
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "clientId": "507f1f77bcf86cd799439013",
    "services": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "serviceId": {
          "_id": "507f1f77bcf86cd799439011",
          "name": "GST Monthly Filing",
          "code": "GST-MF",
          "category": "GST",
          "defaultPrice": 2500
        },
        "customPrice": 2700,
        "billingCycle": "monthly"
      }
    ]
  }
}
```

---

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email"
    }
  ]
}
```

### Authentication Error (401)
```json
{
  "success": false,
  "message": "Authentication required"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Service not found"
}
```

### Rate Limit (429)
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Internal Server Error"
}
```

---

## Security Features

✅ **Helmet.js** - Sets security HTTP headers
✅ **CORS** - Configured for localhost:5173
✅ **Rate Limiting** - 100 requests per 15 minutes
✅ **JWT** - Secure token in httpOnly cookies
✅ **Password Hashing** - bcryptjs with 10 salt rounds
✅ **Input Validation** - Zod schema validation
✅ **Cookie Security** - HttpOnly, Secure in production, Strict SameSite

---

## Pagination Example

**Request:**
```
GET /clients?page=2&limit=10&search=tech&status=active
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clients": [ /* 10 items */ ],
    "pagination": {
      "page": 2,
      "limit": 10,
      "total": 45,
      "pages": 5
    }
  }
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@ca.com",
    "password": "demo1234"
  }' \
  -c cookies.txt
```

### List Services (with auth)
```bash
curl -X GET 'http://localhost:5000/api/services?page=1&limit=10' \
  -b cookies.txt
```

### Create Client
```bash
curl -X POST http://localhost:5000/api/clients \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "New Client",
    "email": "client@example.com",
    "pan": "AAAPL5055K"
  }'
```

---

## Next Steps

1. Test all endpoints with Postman or cURL
2. Implement billing and payment CRUD
3. Add reports and analytics endpoints
4. Build React components to consume these APIs
5. Add webhook support for payment notifications

