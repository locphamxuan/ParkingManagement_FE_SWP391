# User API Service Documentation

This documentation covers the user role API service for the Parking Management System. It includes services for managing reservations, parking history, and long-term packages.

## Quick Start

### Import Hooks
```tsx
import {
  useReservations,
  useReservation,
  useCreateReservation,
  useCancelReservation,
  useParkingHistory,
  useLongTermPackages,
  useLongTermSubscriptions,
  useSubscribeToPackage,
  useCancelSubscription,
} from '@/hooks/user';
```

### Import API Service (for direct usage)
```tsx
import { userApi } from '@/services/user/userApi';
```

---

## API Endpoints

### Reservations

#### GET /users/reservations
Get list of user's reservations with optional filtering.

**Hooks:**
```tsx
const { items, isLoading, error, pagination, refresh } = useReservations({
  status: 'confirmed', // optional: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled'
  limit: 10,
  page: 1,
});
```

**Direct API:**
```tsx
const result = await userApi.reservations.list({
  status: 'confirmed',
  limit: 10,
  page: 1,
});
```

---

#### POST /users/reservations
Create a new reservation.

**Hook:**
```tsx
const { create, isLoading, error } = useCreateReservation();

const reservation = await create({
  plateNumber: '29A-12345',
  buildingId: 'bld-123',
  vehicleTypeId: 'vt-car', // optional
  slotId: 'slot-456', // optional
  reservationDate: new Date().toISOString(),
});
```

**Direct API:**
```tsx
const result = await userApi.reservations.create({
  plateNumber: '29A-12345',
  buildingId: 'bld-123',
  vehicleTypeId: 'vt-car',
  slotId: 'slot-456',
  reservationDate: new Date().toISOString(),
});
const reservation = result.data.reservation;
```

---

#### GET /users/reservations/:id
Get reservation details.

**Hook:**
```tsx
const { data: reservation, isLoading, error } = useReservation(id);
```

**Direct API:**
```tsx
const result = await userApi.reservations.get(id);
const reservation = result.data.reservation;
```

---

#### DELETE /users/reservations/:id
Cancel a reservation.

**Hook:**
```tsx
const { cancel, isLoading, error } = useCancelReservation();

await cancel(id);
```

**Direct API:**
```tsx
const result = await userApi.reservations.cancel(id);
```

---

### Parking History

#### GET /users/parking-history
Get user's parking history/sessions.

**Hook:**
```tsx
const { items, isLoading, error, pagination, refresh } = useParkingHistory({
  limit: 20,
  page: 1,
  fromDate: '2024-01-01', // optional: ISO format
  toDate: '2024-12-31', // optional: ISO format
});
```

**Direct API:**
```tsx
const result = await userApi.parkingHistory.list({
  limit: 20,
  page: 1,
  fromDate: '2024-01-01',
  toDate: '2024-12-31',
});
```

---

#### GET /users/parking-history/:id
Get parking session details.

**Hook:**
```tsx
const { data: session, isLoading, error } = useParkingHistoryItem(id);
```

**Direct API:**
```tsx
const result = await userApi.parkingHistory.get(id);
const session = result.data.session;
```

---

### Long-Term Packages

#### GET /users/long-term/packages
Get list of available long-term packages.

**Hook:**
```tsx
const { items, isLoading, error, pagination } = useLongTermPackages({
  buildingId: 'bld-123', // optional
  limit: 10,
  page: 1,
});
```

**Direct API:**
```tsx
const result = await userApi.longTermPackages.list({
  buildingId: 'bld-123',
  limit: 10,
  page: 1,
});
```

---

#### GET /users/long-term/packages/:id
Get package details.

**Hook:**
```tsx
const { data: package, isLoading, error } = useLongTermPackage(id);
```

**Direct API:**
```tsx
const result = await userApi.longTermPackages.get(id);
const pkg = result.data.package;
```

---

### Long-Term Subscriptions

#### GET /users/long-term/subscriptions
Get user's long-term subscriptions.

**Hook:**
```tsx
const { items, isLoading, error, pagination, refresh } = useLongTermSubscriptions({
  status: 'active', // optional: 'active' | 'expired' | 'cancelled'
  limit: 10,
  page: 1,
});
```

**Direct API:**
```tsx
const result = await userApi.longTermSubscriptions.list({
  status: 'active',
  limit: 10,
  page: 1,
});
```

---

#### POST /users/long-term/subscriptions
Subscribe to a long-term package.

**Hook:**
```tsx
const { subscribe, isLoading, error } = useSubscribeToPackage();

const subscription = await subscribe({
  packageId: 'pkg-123',
  linkedPlates: ['29A-12345', '29A-67890'],
  paymentMethod: 'wallet', // optional: 'wallet' | 'card' | 'cash'
});
```

**Direct API:**
```tsx
const result = await userApi.longTermSubscriptions.create({
  packageId: 'pkg-123',
  linkedPlates: ['29A-12345', '29A-67890'],
  paymentMethod: 'wallet',
});
const subscription = result.data.subscription;
```

---

#### GET /users/long-term/subscriptions/:id
Get subscription details.

**Hook:**
```tsx
const { data: subscription, isLoading, error } = useLongTermSubscription(id);
```

**Direct API:**
```tsx
const result = await userApi.longTermSubscriptions.get(id);
const subscription = result.data.subscription;
```

---

#### DELETE /users/long-term/subscriptions/:id
Cancel a subscription.

**Hook:**
```tsx
const { cancel, isLoading, error } = useCancelSubscription();

await cancel(id);
```

**Direct API:**
```tsx
const result = await userApi.longTermSubscriptions.cancel(id);
```

---

## Type Definitions

### Reservation
```typescript
interface Reservation {
  _id: string;
  code: string;
  plateNumber: string;
  vehicleType?: VehicleType | null;
  slot?: ParkingSlot | null;
  building: Building;
  status: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled';
  reservationDate: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
}
```

### ParkingHistory
```typescript
interface ParkingHistory {
  _id: string;
  plateNumber: string;
  vehicleType?: VehicleType | null;
  slot?: ParkingSlot | null;
  gate?: Gate | null;
  building: Building;
  checkIn: string;
  checkOut?: string | null;
  duration?: number | null;
  fee?: number | null;
  paymentMethod?: 'cash' | 'wallet' | 'qr' | null;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed' | 'cancelled';
  createdAt?: string;
}
```

### LongTermPackage
```typescript
interface LongTermPackage {
  _id: string;
  code: string;
  name: string;
  description?: string;
  building: Building;
  duration: number; // in days
  price: number;
  discountPercentage?: number;
  maxVehicles?: number;
  features?: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}
```

### LongTermSubscription
```typescript
interface LongTermSubscription {
  _id: string;
  code: string;
  package: LongTermPackage;
  user: { _id: string; fullName: string; email: string };
  linkedPlates: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod?: 'wallet' | 'card' | 'cash';
  price: number;
  createdAt?: string;
  updatedAt?: string;
}
```

---

## Hook Patterns

### Hooks with State Management

All list hooks follow this pattern:
```typescript
interface ListFetchState<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  refresh: () => Promise<void>;
}
```

All detail hooks follow this pattern:
```typescript
interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}
```

### Mutation Hooks

Create/Delete hooks follow this pattern:
```typescript
interface MutationHook {
  isLoading: boolean;
  error: Error | null;
  [method]: (params) => Promise<Result>;
}
```

---

## Examples

See [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx) for complete usage examples.

### Basic List Example
```tsx
function ReservationsList() {
  const { items, isLoading, error, refresh } = useReservations({ limit: 10 });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map(res => (
        <div key={res._id}>{res.building.name}</div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

### Create with Error Handling
```tsx
function CreateReservation() {
  const { create, isLoading, error } = useCreateReservation();

  const handleCreate = async () => {
    try {
      const res = await create({
        plateNumber: '29A-12345',
        buildingId: 'bld-123',
        reservationDate: new Date().toISOString(),
      });
      console.log('Created:', res);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <button onClick={handleCreate} disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create'}
      </button>
      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}
```

---

## Error Handling

All API calls throw `ApiError` with the following structure:
```typescript
class ApiError extends Error {
  status: number;
  payload: unknown;
}
```

Example:
```tsx
const { subscribe } = useSubscribeToPackage();

try {
  await subscribe({...});
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      // User not authenticated
    } else if (error.status === 400) {
      // Validation error
      console.log(error.payload);
    }
  }
}
```

---

## Files Structure

```
src/
├── services/user/
│   └── userApi.ts          # User API service with endpoints
├── hooks/user/
│   ├── index.ts            # Exports
│   ├── useUserApi.ts       # React hooks for user API
│   └── USAGE_EXAMPLES.tsx  # Usage examples
└── pages/user/
    ├── ...User pages
    └── mockXxxData.ts      # Mock data (can be replaced with hooks)
```

---

## Next Steps

1. **Update User Pages**: Replace mock data imports in user pages with these hooks
2. **Update Mock Data**: Remove mock data files once all pages are using real API
3. **Add Tests**: Add unit tests for hooks and error handling
4. **Add Caching**: Consider adding React Query or SWR for better caching
