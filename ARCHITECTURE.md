# Architecture Overview

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     React Components                        │
│  (ReservationsPage, ParkingHistoryPage, etc.)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Hooks                              │
│  (useReservations, useParkingHistory, etc.)                │
│  - State management (isLoading, error, data)               │
│  - Auto-refresh capability                                 │
│  - Error handling                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 User API Service                            │
│  (userApi.reservations.list(), etc.)                       │
│  - Method definitions                                      │
│  - Request/response typing                                 │
│  - Endpoint mapping                                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  API Client                                 │
│  (apiRequest, api.get(), api.post(), etc.)                │
│  - HTTP requests                                           │
│  - Auth token injection                                    │
│  - Error handling                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API                                │
│  (/users/reservations, /users/parking-history, etc.)      │
│  - Database queries                                        │
│  - Business logic                                          │
│  - Data persistence                                        │
└─────────────────────────────────────────────────────────────┘
```

## Module Structure

```
src/
│
├── components/          (UI Components)
│   └── pages/user/
│       ├── ReservationsPage.tsx
│       ├── ParkingHistoryPage.tsx
│       └── PackagesPage.tsx
│
├── pages/user/          (Page Components)
│   ├── BuildingsPage.tsx
│   └── MIGRATION_GUIDE.md
│
├── hooks/               (React Hooks)
│   ├── user/
│   │   ├── useUserApi.ts           ← 12 Custom Hooks
│   │   ├── USAGE_EXAMPLES.tsx
│   │   └── index.ts
│   └── useAuth.ts
│
├── services/            (API Services)
│   ├── user/
│   │   ├── userApi.ts              ← 12 API Methods
│   │   ├── types.ts
│   │   ├── index.ts
│   │   ├── README.md
│   │   └── CHANGELOG.md
│   ├── apiClient.ts                ← Generic HTTP Client
│   ├── authService.ts
│   └── admin/, staff/, manager/
│
└── types/               (Type Definitions)
    └── index.ts
```

## Hook Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    List Hooks                              │
│  useReservations, useParkingHistory, etc.                 │
├────────────────────────────────────────────────────────────┤
│ Returns:                                                   │
│  ├─ items: T[]                                             │
│  ├─ isLoading: boolean                                     │
│  ├─ error: Error | null                                   │
│  ├─ pagination?: {...}                                    │
│  └─ refresh(): Promise<void>                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                   Detail Hooks                             │
│  useReservation, useParkingHistoryItem, etc.              │
├────────────────────────────────────────────────────────────┤
│ Returns:                                                   │
│  ├─ data: T | null                                         │
│  ├─ isLoading: boolean                                     │
│  ├─ error: Error | null                                   │
│  └─ refresh(): Promise<void>                              │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│                  Mutation Hooks                            │
│  useCreateReservation, useCancelReservation, etc.         │
├────────────────────────────────────────────────────────────┤
│ Returns:                                                   │
│  ├─ [action](): Promise<T>                                │
│  ├─ isLoading: boolean                                     │
│  └─ error: Error | null                                   │
└────────────────────────────────────────────────────────────┘
```

## API Methods Organization

```
userApi
├── reservations
│   ├── list(query?: {...})
│   ├── get(id: string)
│   ├── create(body: {...})
│   └── cancel(id: string)
│
├── parkingHistory
│   ├── list(query?: {...})
│   └── get(id: string)
│
├── longTermPackages
│   ├── list(query?: {...})
│   └── get(id: string)
│
└── longTermSubscriptions
    ├── list(query?: {...})
    ├── get(id: string)
    ├── create(body: {...})
    └── cancel(id: string)
```

## Type Hierarchy

```
┌─────────────────────────────────┐
│         Wrap<T>                 │
│  { data: T }                    │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
┌─────────────┐  ┌──────────────────┐
│  Reservation │  │ ListResult<T>    │
│  Buildings   │  │ {                │
│  etc.       │  │   items: T[],    │
└─────────────┘  │   pagination: {...}
                 │ }
                 └──────────────────┘
```

## State Management Flow

```
User Action
    │
    ▼
Hook Called (useReservations)
    │
    ├─ Set isLoading = true
    ├─ Set error = null
    │
    ▼
API Call (userApi.reservations.list)
    │
    ├─ Success ──┐
    │            ▼
    │         Set items = data
    │         Set isLoading = false
    │
    └─ Error ───┐
               ▼
            Set error = Error
            Set isLoading = false

Updated Component
    │
    ▼
Re-render with new state
```

## Request/Response Cycle

```
Frontend Component
    │
    ▼
Hook: useReservations()
    │
    ▼
API: userApi.reservations.list({ page: 1, limit: 10 })
    │
    ▼
HTTP: GET /users/reservations?page=1&limit=10
    ├─ Headers: Authorization: Bearer {token}
    ├─ Content-Type: application/json
    │
    ▼
Backend API
    │
    ├─ Success (200) ──┐
    │                  ▼
    │              Response: {
    │                data: {
    │                  items: [...],
    │                  pagination: {...}
    │                }
    │              }
    │
    └─ Error ─────┐
                  ▼
              Response: {
                message: "Error message",
                status: 400/401/500
              }

Parse Response
    │
    ├─ Success ──┐
    │            ▼
    │         Return { data: {...} }
    │
    └─ Error ───┐
               ▼
            Throw ApiError {
              message,
              status,
              payload
            }

Hook Catches
    │
    ├─ Success ──┐
    │            ▼
    │         setState({ items, pagination, isLoading: false })
    │
    └─ Error ───┐
               ▼
            setState({ error, isLoading: false })

Component Re-renders
    │
    ▼
Display data or error
```

## Error Flow

```
API Call Fails
    │
    ▼
apiRequest throws ApiError
    │
    ├─ 401 Unauthorized
    │  └─ Clear token → Redirect to login
    │
    ├─ 400 Bad Request
    │  └─ Show validation error
    │
    ├─ 404 Not Found
    │  └─ Show not found message
    │
    ├─ 500 Server Error
    │  └─ Show server error message
    │
    └─ Network Error
       └─ Show connection error

Hook Catches Error
    │
    ▼
setState({ error, isLoading: false })
    │
    ▼
Component Renders Error Message
    │
    ▼
User Sees: "Failed to load. Please try again."
           [Retry Button]
```

## Cache & Refresh Strategy

```
Initial Load
    │
    ▼
Hook fetches data + caches in component state
    │
    ▼
Data displayed

User Action (create, update, delete)
    │
    ├─ Mutation Hook executes
    │  │
    │  ▼
    │  API call sent
    │  │
    │  ├─ Success: Optionally call refresh()
    │  │           to update cached list
    │  │
    │  └─ Error: Show error to user
    │
    ▼
[Optional] Call listHook.refresh()
    │
    ▼
Fresh data fetched from server
    │
    ▼
Component re-renders with new data
```

## Features Map

```
Feature                │ List Hooks │ Detail Hooks │ Mutation Hooks
───────────────────────┼────────────┼─────────────┼───────────────
isLoading tracking     │     ✅     │      ✅     │       ✅
Error handling         │     ✅     │      ✅     │       ✅
Pagination support     │     ✅     │      ❌     │       ❌
refresh() capability   │     ✅     │      ✅     │       ❌
Auto-cleanup           │     ✅     │      ✅     │       ❌
Dependency tracking    │     ✅     │      ✅     │       ❌
```

## Integration Checkpoints

```
1. Setup ✅
   └─ Files created and exported

2. API Testing
   └─ Test each endpoint with backend

3. Hook Integration
   └─ Use hooks in components

4. Error Handling
   └─ Test error scenarios

5. State Management
   └─ Verify loading/error states

6. Pagination
   └─ Test list pagination

7. Performance
   └─ Check re-render frequency

8. Production Build
   └─ Verify no TypeScript errors
```
