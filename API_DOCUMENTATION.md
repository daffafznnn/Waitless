# Waitless API Documentation

Comprehensive documentation for Waitless Queue Management System API endpoints.

## 📋 Table of Contents

1. [Base Information](#base-information)
2. [Authentication](#authentication)
3. [Queue Management](#queue-management)
4. [Admin Operations](#admin-operations)
5. [Location Management](#location-management)
6. [System Endpoints](#system-endpoints)
7. [Error Handling](#error-handling)
8. [Response Formats](#response-formats)
9. [Authentication & Authorization](#authentication--authorization-1)
10. [Example Usage](#example-usage)

---

## Base Information

### API Base URL
```
http://localhost:3001/api
```

### Content Type
```
Content-Type: application/json
```

### Authentication
Most endpoints require JWT token in one of these formats:
- **Cookie**: `wlx_token` (HttpOnly cookie)
- **Header**: `Authorization: Bearer <token>`

---

## Authentication

### Register New User
Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "phone": "+628123456789",
  "role": "VISITOR"
}
```

**Request Fields:**
- `email` (string, required): Valid email address
- `password` (string, required): Minimum 8 characters
- `name` (string, required): User's full name
- `phone` (string, optional): Phone number
- `role` (string, optional): User role (`VISITOR`, `ADMIN`, `OWNER`). Default: `VISITOR`

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+628123456789",
      "role": "VISITOR",
      "created_at": "2024-12-11T08:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

---

### Login
Authenticate user and get access token.

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "role": "VISITOR"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

### Get User Profile
Get current authenticated user's profile.

**Endpoint:** `GET /api/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe",
      "phone": "+628123456789",
      "role": "VISITOR",
      "created_at": "2024-12-11T08:00:00.000Z",
      "updated_at": "2024-12-11T08:00:00.000Z"
    }
  }
}
```

---

### Update Profile
Update current user's profile information.

**Endpoint:** `PUT /api/auth/profile`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "John Smith",
  "phone": "+628123456790"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Smith",
      "phone": "+628123456790",
      "role": "VISITOR"
    }
  }
}
```

---

### Change Password
Change current user's password.

**Endpoint:** `POST /api/auth/change-password`

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "message": "Password changed successfully"
  }
}
```

---

### Refresh Token
Get new access token using refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "token": "new_access_token_here",
    "refreshToken": "new_refresh_token_here"
  }
}
```

---

### Logout
Logout current user and invalidate token.

**Endpoint:** `POST /api/auth/logout`

**Headers:** `Authorization: Bearer <token>`

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

## Queue Management

### Issue New Ticket
Create a new queue ticket for a specific counter.

**Endpoint:** `POST /api/queue/issue`

**Request Body:**
```json
{
  "locationId": 1,
  "counterId": 1,
  "userId": 1,
  "dateFor": "2024-12-11"
}
```

**Request Fields:**
- `locationId` (number, required): Location ID
- `counterId` (number, required): Counter ID
- `userId` (number, optional): User ID (if not provided, uses authenticated user)
- `dateFor` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "location_id": 1,
      "counter_id": 1,
      "user_id": 1,
      "date_for": "2024-12-11",
      "sequence": 5,
      "queue_number": "A005",
      "status": "WAITING",
      "created_at": "2024-12-11T10:30:00.000Z",
      "counter": {
        "id": 1,
        "name": "Loket 1",
        "prefix": "A"
      },
      "location": {
        "id": 1,
        "name": "inParfume Bandung"
      }
    }
  }
}
```

---

### Call Next Ticket
Call the next waiting ticket for a counter.

**Endpoint:** `POST /api/queue/call-next`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "counterId": 1
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "CALLING",
      "called_at": "2024-12-11T10:35:00.000Z",
      "user": {
        "id": 1,
        "name": "John Doe"
      }
    },
    "queueNumber": "A005",
    "message": "Ticket A005 has been called"
  }
}
```

**No Tickets Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": null,
    "message": "No waiting tickets available"
  }
}
```

---

### Start Serving Ticket
Mark a called ticket as being served.

**Endpoint:** `POST /api/queue/start-serving`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "ticketId": 123
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "SERVING",
      "started_at": "2024-12-11T10:36:00.000Z"
    }
  }
}
```

---

### Hold Ticket
Put a ticket on hold with reason.

**Endpoint:** `POST /api/queue/hold`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "ticketId": 123,
  "reason": "Customer needs additional documents"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "HOLD",
      "hold_reason": "Customer needs additional documents"
    }
  }
}
```

---

### Resume Ticket
Resume a held ticket.

**Endpoint:** `POST /api/queue/resume`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "ticketId": 123
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "WAITING",
      "hold_reason": null
    }
  }
}
```

---

### Mark Ticket Done
Mark a ticket as completed.

**Endpoint:** `POST /api/queue/done`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "ticketId": 123
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "DONE",
      "finished_at": "2024-12-11T10:45:00.000Z"
    }
  }
}
```

---

### Cancel Ticket
Cancel a ticket with reason.

**Endpoint:** `POST /api/queue/cancel`

**Request Body:**
```json
{
  "ticketId": 123,
  "reason": "Customer left"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "CANCELLED",
      "hold_reason": "Customer left"
    }
  }
}
```

---

### Get Queue Status
Get current queue status for a counter.

**Endpoint:** `GET /api/queue/status/{counterId}?date=2024-12-11`

**URL Parameters:**
- `counterId` (number): Counter ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "status": {
      "total": 25,
      "waiting": 8,
      "calling": 1,
      "serving": 1,
      "hold": 2,
      "done": 12,
      "cancelled": 1,
      "current": {
        "id": 124,
        "queue_number": "A006",
        "status": "SERVING",
        "user": {
          "id": 2,
          "name": "Jane Smith"
        }
      },
      "nextWaiting": {
        "id": 125,
        "queue_number": "A007",
        "status": "WAITING",
        "user": {
          "id": 3,
          "name": "Bob Johnson"
        }
      }
    }
  }
}
```

---

### Get Today's Tickets
Get list of today's tickets for a location.

**Endpoint:** `GET /api/queue/today/{locationId}?page=1&limit=50&date=2024-12-11`

**URL Parameters:**
- `locationId` (number): Location ID

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50, max: 100)
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "tickets": [
      {
        "id": 123,
        "queue_number": "A005",
        "status": "DONE",
        "sequence": 5,
        "created_at": "2024-12-11T10:30:00.000Z",
        "called_at": "2024-12-11T10:35:00.000Z",
        "finished_at": "2024-12-11T10:45:00.000Z",
        "counter": {
          "id": 1,
          "name": "Loket 1",
          "prefix": "A"
        },
        "user": {
          "id": 1,
          "name": "John Doe",
          "phone": "+628123456789"
        }
      }
    ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 50,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Ticket by Queue Number
Find a ticket by its queue number.

**Endpoint:** `GET /api/queue/ticket/{queueNumber}`

**URL Parameters:**
- `queueNumber` (string): Queue number (e.g., "A005")

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "ticket": {
      "id": 123,
      "queue_number": "A005",
      "status": "WAITING",
      "sequence": 5,
      "date_for": "2024-12-11",
      "created_at": "2024-12-11T10:30:00.000Z",
      "counter": {
        "id": 1,
        "name": "Loket 1",
        "prefix": "A",
        "location": {
          "id": 1,
          "name": "inParfume Bandung"
        }
      },
      "user": {
        "id": 1,
        "name": "John Doe",
        "phone": "+628123456789"
      }
    }
  }
}
```

---

### Get User Tickets
Get tickets for the authenticated user.

**Endpoint:** `GET /api/queue/user/tickets?date=2024-12-11`

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "tickets": [
      {
        "id": 123,
        "queue_number": "A005",
        "status": "WAITING",
        "sequence": 5,
        "date_for": "2024-12-11",
        "created_at": "2024-12-11T10:30:00.000Z",
        "counter": {
          "id": 1,
          "name": "Loket 1",
          "prefix": "A",
          "location": {
            "id": 1,
            "name": "inParfume Bandung"
          }
        }
      }
    ]
  }
}
```

---

### Get Estimated Wait Time
Get estimated wait time for a ticket.

**Endpoint:** `GET /api/queue/estimate/{ticketId}`

**URL Parameters:**
- `ticketId` (number): Ticket ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "estimate": {
      "estimatedMinutes": 25,
      "position": 6,
      "message": "Estimated wait time: 25 minutes (6th in queue)"
    }
  }
}
```

---

## Admin Operations

### Create Counter
Create a new counter for a location.

**Endpoint:** `POST /api/admin/counters`

**Headers:** `Authorization: Bearer <admin-token>`

**Request Body:**
```json
{
  "locationId": 1,
  "name": "Loket 4",
  "description": "Counter for VIP services",
  "prefix": "D",
  "openTime": "08:00:00",
  "closeTime": "17:00:00",
  "capacityPerDay": 50
}
```

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "counter": {
      "id": 4,
      "location_id": 1,
      "name": "Loket 4",
      "description": "Counter for VIP services",
      "prefix": "D",
      "open_time": "08:00:00",
      "close_time": "17:00:00",
      "capacity_per_day": 50,
      "is_active": true,
      "created_at": "2024-12-11T08:00:00.000Z"
    }
  }
}
```

---

### Update Counter
Update an existing counter.

**Endpoint:** `PUT /api/admin/counters/{counterId}`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `counterId` (number): Counter ID

**Request Body:**
```json
{
  "name": "Loket 4 - VIP",
  "description": "Updated counter for VIP services",
  "capacityPerDay": 60,
  "isActive": true
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "counter": {
      "id": 4,
      "name": "Loket 4 - VIP",
      "description": "Updated counter for VIP services",
      "capacity_per_day": 60,
      "is_active": true,
      "updated_at": "2024-12-11T09:00:00.000Z"
    }
  }
}
```

---

### Delete Counter
Delete a counter.

**Endpoint:** `DELETE /api/admin/counters/{counterId}`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `counterId` (number): Counter ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "message": "Counter deleted successfully"
  }
}
```

---

### Get Location Counters
Get all counters for a specific location.

**Endpoint:** `GET /api/admin/locations/{locationId}/counters`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `locationId` (number): Location ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "counters": [
      {
        "id": 1,
        "name": "Loket 1",
        "description": "Counter untuk layanan umum",
        "prefix": "A",
        "open_time": "08:00:00",
        "close_time": "17:00:00",
        "capacity_per_day": 100,
        "is_active": true
      },
      {
        "id": 2,
        "name": "Loket 2",
        "description": "Counter untuk layanan prioritas",
        "prefix": "B",
        "open_time": "08:00:00",
        "close_time": "17:00:00",
        "capacity_per_day": 80,
        "is_active": true
      }
    ]
  }
}
```

---

### Get Counters with Status
Get counters with their current status for a location.

**Endpoint:** `GET /api/admin/locations/{locationId}/counters/status?date=2024-12-11`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `locationId` (number): Location ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "counters": [
      {
        "id": 1,
        "name": "Loket 1",
        "prefix": "A",
        "capacity_per_day": 100,
        "capacityStatus": {
          "capacity": 100,
          "issued": 25,
          "available": 75,
          "isAtCapacity": false
        },
        "queueStatus": {
          "waiting": 8,
          "serving": 1,
          "done": 16
        }
      }
    ]
  }
}
```

---

### Get Queue Status (Admin)
Get detailed queue status for a counter.

**Endpoint:** `GET /api/admin/counters/{counterId}/queue?date=2024-12-11`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `counterId` (number): Counter ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "status": {
      "counter": {
        "id": 1,
        "name": "Loket 1",
        "prefix": "A"
      },
      "date": "2024-12-11",
      "statistics": {
        "total": 25,
        "waiting": 8,
        "calling": 1,
        "serving": 1,
        "hold": 2,
        "done": 12,
        "cancelled": 1
      },
      "currentTicket": {
        "id": 124,
        "queue_number": "A006",
        "status": "SERVING"
      },
      "recentActivity": [
        {
          "id": 123,
          "queue_number": "A005",
          "status": "DONE",
          "finished_at": "2024-12-11T10:45:00.000Z"
        }
      ]
    }
  }
}
```

---

### Get Location Activity
Get activity log for a location.

**Endpoint:** `GET /api/admin/locations/{locationId}/activity?date=2024-12-11&page=1&limit=50`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `locationId` (number): Location ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 50)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "activity": [
      {
        "id": 456,
        "ticket_id": 123,
        "actor_id": 2,
        "event_type": "DONE",
        "note": "Service completed",
        "created_at": "2024-12-11T10:45:00.000Z",
        "ticket": {
          "queue_number": "A005"
        },
        "actor": {
          "name": "Admin User"
        }
      }
    ],
    "pagination": {
      "total": 150,
      "page": 1,
      "limit": 50,
      "pages": 3,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Get Counter Activity
Get activity log for a specific counter.

**Endpoint:** `GET /api/admin/counters/{counterId}/activity?date=2024-12-11&page=1&limit=50`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `counterId` (number): Counter ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)
- `page` (number, optional): Page number (default: 1)  
- `limit` (number, optional): Items per page (default: 50)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "activity": [
      {
        "id": 456,
        "ticket_id": 123,
        "actor_id": 2,
        "event_type": "CALLED",
        "note": null,
        "created_at": "2024-12-11T10:35:00.000Z",
        "ticket": {
          "queue_number": "A005"
        },
        "actor": {
          "name": "Admin User"
        }
      }
    ],
    "pagination": {
      "total": 75,
      "page": 1,
      "limit": 50,
      "pages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

### Get Daily Summary
Get daily summary statistics for a location.

**Endpoint:** `GET /api/admin/locations/{locationId}/summary?date=2024-12-11`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `locationId` (number): Location ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "summary": {
      "date": "2024-12-11",
      "location": {
        "id": 1,
        "name": "inParfume Bandung"
      },
      "statistics": {
        "total_issued": 125,
        "total_done": 108,
        "total_hold": 5,
        "total_cancel": 12,
        "avg_service_seconds": 360
      },
      "counters": [
        {
          "id": 1,
          "name": "Loket 1",
          "issued": 50,
          "done": 45,
          "utilization": 90
        },
        {
          "id": 2,
          "name": "Loket 2", 
          "issued": 40,
          "done": 35,
          "utilization": 87.5
        }
      ],
      "hourlyDistribution": {
        "08": 5,
        "09": 12,
        "10": 18,
        "11": 22,
        "12": 8,
        "13": 15,
        "14": 20,
        "15": 15,
        "16": 10
      }
    }
  }
}
```

---

### Get Dashboard Stats
Get dashboard statistics for a location.

**Endpoint:** `GET /api/admin/locations/{locationId}/dashboard?date=2024-12-11`

**Headers:** `Authorization: Bearer <admin-token>`

**URL Parameters:**
- `locationId` (number): Location ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "stats": {
      "overview": {
        "totalCounters": 3,
        "activeCounters": 3,
        "totalCapacity": 230,
        "todayIssued": 125,
        "utilizationRate": 54.3
      },
      "realTime": {
        "currentlyWaiting": 15,
        "currentlyServing": 3,
        "averageWaitTime": 18,
        "peakHour": "11:00-12:00"
      },
      "trends": {
        "vsYesterday": {
          "issued": "+8.5%",
          "completed": "+12.3%",
          "avgWaitTime": "-5.2%"
        },
        "vsLastWeek": {
          "issued": "+15.7%",
          "completed": "+18.9%",
          "avgWaitTime": "-8.1%"
        }
      },
      "counters": [
        {
          "id": 1,
          "name": "Loket 1",
          "status": "active",
          "currentQueue": 5,
          "todayServed": 45,
          "efficiency": 92.5
        }
      ]
    }
  }
}
```

---

## Location Management

### Get All Locations
Get list of all active locations with pagination.

**Endpoint:** `GET /api/locations?page=1&limit=20`

**Query Parameters:**
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "rows": [
      {
        "id": 1,
        "name": "inParfume Bandung",
        "address": "Jl. Braga No. 123, Bandung",
        "city": "Bandung",
        "lat": -6.9175,
        "lng": 107.6191,
        "is_active": true,
        "owner": {
          "id": 1,
          "name": "System Owner",
          "email": "owner@waitless.app"
        }
      }
    ],
    "count": 1,
    "pagination": {
      "total": 1,
      "page": 1,
      "limit": 20,
      "pages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

---

### Get Location by ID
Get detailed information about a specific location.

**Endpoint:** `GET /api/locations/{id}`

**URL Parameters:**
- `id` (number): Location ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "location": {
      "id": 1,
      "name": "inParfume Bandung",
      "address": "Jl. Braga No. 123, Bandung",
      "city": "Bandung",
      "lat": -6.9175,
      "lng": 107.6191,
      "is_active": true,
      "created_at": "2024-12-11T08:00:00.000Z",
      "owner": {
        "id": 1,
        "name": "System Owner",
        "email": "owner@waitless.app"
      }
    }
  }
}
```

---

### Create Location
Create a new service location.

**Endpoint:** `POST /api/locations`

**Headers:** `Authorization: Bearer <owner-token>`

**Request Body:**
```json
{
  "name": "inParfume Jakarta",
  "address": "Jl. Sudirman No. 456, Jakarta",
  "phone": "+6221-1234567",
  "description": "Jakarta branch location"
}
```

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "location": {
      "id": 2,
      "owner_id": 1,
      "name": "inParfume Jakarta",
      "address": "Jl. Sudirman No. 456, Jakarta",
      "city": "Unknown",
      "phone": "+6221-1234567",
      "description": "Jakarta branch location",
      "is_active": true,
      "created_at": "2024-12-11T08:00:00.000Z"
    }
  }
}
```

---

### Update Location
Update an existing location.

**Endpoint:** `PUT /api/locations/{id}`

**Headers:** `Authorization: Bearer <owner-token>`

**URL Parameters:**
- `id` (number): Location ID

**Request Body:**
```json
{
  "name": "inParfume Jakarta Central",
  "address": "Jl. Sudirman No. 456, Jakarta Pusat",
  "description": "Updated Jakarta central branch location"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "location": {
      "id": 2,
      "name": "inParfume Jakarta Central",
      "address": "Jl. Sudirman No. 456, Jakarta Pusat",
      "description": "Updated Jakarta central branch location",
      "updated_at": "2024-12-11T09:00:00.000Z"
    }
  }
}
```

---

### Delete Location
Delete a location.

**Endpoint:** `DELETE /api/locations/{id}`

**Headers:** `Authorization: Bearer <owner-token>`

**URL Parameters:**
- `id` (number): Location ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "message": "Location deleted successfully"
  }
}
```

---

### Get Location Counters
Get all counters for a specific location.

**Endpoint:** `GET /api/locations/{id}/counters`

**URL Parameters:**
- `id` (number): Location ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "counters": [
      {
        "id": 1,
        "name": "Loket 1",
        "description": "Counter untuk layanan umum",
        "prefix": "A",
        "open_time": "08:00:00",
        "close_time": "17:00:00",
        "capacity_per_day": 100,
        "is_active": true
      }
    ]
  }
}
```

---

### Get Location Status
Get current status of a location including all counters.

**Endpoint:** `GET /api/locations/{id}/status?date=2024-12-11`

**URL Parameters:**
- `id` (number): Location ID

**Query Parameters:**
- `date` (string, optional): Date in YYYY-MM-DD format (default: today)

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "status": {
      "location": {
        "id": 1,
        "name": "inParfume Bandung"
      },
      "date": "2024-12-11",
      "counters": [
        {
          "id": 1,
          "name": "Loket 1",
          "prefix": "A",
          "capacityStatus": {
            "capacity": 100,
            "issued": 25,
            "available": 75,
            "isAtCapacity": false
          }
        }
      ],
      "summary": {
        "totalCapacity": 230,
        "totalIssued": 125,
        "totalAvailable": 105,
        "utilizationRate": 54
      }
    }
  }
}
```

---

### Add Location Member
Add a user as member to a location.

**Endpoint:** `POST /api/locations/{id}/members`

**Headers:** `Authorization: Bearer <owner-token>`

**URL Parameters:**
- `id` (number): Location ID

**Request Body:**
```json
{
  "userId": 3
}
```

**Success Response (201):**
```json
{
  "ok": true,
  "data": {
    "member": {
      "id": 5,
      "location_id": 1,
      "user_id": 3,
      "role": "ADMIN",
      "is_active": true,
      "created_at": "2024-12-11T08:00:00.000Z"
    }
  }
}
```

---

### Remove Location Member
Remove a member from a location.

**Endpoint:** `DELETE /api/locations/{id}/members/{userId}`

**Headers:** `Authorization: Bearer <owner-token>`

**URL Parameters:**
- `id` (number): Location ID
- `userId` (number): User ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "message": "Location member removed successfully"
  }
}
```

---

### Get Location Members
Get all members of a location.

**Endpoint:** `GET /api/locations/{id}/members`

**Headers:** `Authorization: Bearer <owner-token>`

**URL Parameters:**
- `id` (number): Location ID

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "members": [
      {
        "id": 4,
        "location_id": 1,
        "user_id": 2,
        "role": "ADMIN",
        "is_active": true,
        "user": {
          "id": 2,
          "name": "Admin Pertama",
          "email": "admin1@waitless.app",
          "phone": "+628123456790"
        }
      }
    ]
  }
}
```

---

## System Endpoints

### Health Check
Check if the server is running properly.

**Endpoint:** `GET /health`

**Success Response (200):**
```json
{
  "ok": true,
  "message": "Waitless API Server is running",
  "timestamp": "2024-12-11T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

### System Status
Get detailed system status including database and jobs.

**Endpoint:** `GET /api/status`

**Success Response (200):**
```json
{
  "ok": true,
  "data": {
    "server": "running",
    "database": "connected",
    "jobs": {
      "dailySummary": true,
      "weeklyCleanup": true
    },
    "lastDailySummaryRun": "2024-12-11T01:00:00.000Z"
  }
}
```

---

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized / Authentication Required
- `403` - Forbidden / Insufficient Permissions
- `404` - Not Found
- `409` - Conflict / Resource Already Exists
- `422` - Unprocessable Entity
- `429` - Too Many Requests / Rate Limit
- `500` - Internal Server Error

### Error Response Format
```json
{
  "ok": false,
  "error": "Error message description",
  "details": {
    // Additional error details (optional)
  }
}
```

### Validation Error Response
```json
{
  "ok": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format",
      "code": "invalid_format"
    }
  ]
}
```

### Authentication Error Response
```json
{
  "ok": false,
  "error": "Authentication required"
}
```

### Authorization Error Response
```json
{
  "ok": false,
  "error": "Insufficient permissions",
  "details": "Required roles: ADMIN, OWNER"
}
```

---

## Response Formats

### Success Response Structure
```json
{
  "ok": true,
  "data": {
    // Response data here
  },
  "pagination": {
    // Only for paginated responses
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### Paginated Response Structure
```json
{
  "ok": true,
  "data": {
    "rows": [
      // Array of items
    ],
    "count": 100
  },
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "pages": 5,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Authentication & Authorization

### JWT Token Format
```json
{
  "userId": 1,
  "email": "user@example.com",
  "role": "ADMIN",
  "iat": 1702281600,
  "exp": 1702886400
}
```

### Role Hierarchy
- **VISITOR**: Basic user, can issue tickets and view own tickets
- **ADMIN**: Can manage queues, call tickets, view analytics for assigned locations  
- **OWNER**: Full access, can manage locations, counters, and members

### Permission Matrix

| Endpoint | VISITOR | ADMIN | OWNER |
|----------|---------|-------|-------|
| Register/Login | ✅ | ✅ | ✅ |
| Issue Ticket | ✅ | ✅ | ✅ |
| View Own Tickets | ✅ | ✅ | ✅ |
| Call Next Ticket | ❌ | ✅ | ✅ |
| Manage Tickets | ❌ | ✅ | ✅ |
| View Analytics | ❌ | ✅* | ✅ |
| Manage Counters | ❌ | ❌ | ✅ |
| Manage Locations | ❌ | ❌ | ✅ |
| Manage Members | ❌ | ❌ | ✅ |

*Admin can only access analytics for locations they are members of.

---

## Example Usage

### Complete Ticket Flow Example

```bash
# 1. Register a new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "name": "John Customer"
  }'

# 2. Login to get token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'

# 3. Issue a ticket
curl -X POST http://localhost:3001/api/queue/issue \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "locationId": 1,
    "counterId": 1
  }'

# 4. Check queue status
curl -X GET http://localhost:3001/api/queue/status/1

# 5. Admin calls next ticket
curl -X POST http://localhost:3001/api/queue/call-next \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "counterId": 1
  }'

# 6. Admin starts serving ticket
curl -X POST http://localhost:3001/api/queue/start-serving \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "ticketId": 123
  }'

# 7. Admin marks ticket as done
curl -X POST http://localhost:3001/api/queue/done \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "ticketId": 123
  }'
```

### Admin Dashboard Flow Example

```bash
# 1. Get location dashboard stats
curl -X GET http://localhost:3001/api/admin/locations/1/dashboard \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 2. Get counters with status
curl -X GET http://localhost:3001/api/admin/locations/1/counters/status \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 3. Get today's activity
curl -X GET http://localhost:3001/api/admin/locations/1/activity \
  -H "Authorization: Bearer ADMIN_TOKEN"

# 4. Get daily summary
curl -X GET http://localhost:3001/api/admin/locations/1/summary \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

---

*For additional support or questions about the API, please refer to the main README.md file or contact the development team.*