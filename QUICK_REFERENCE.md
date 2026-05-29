# User API - Quick Reference

## 📦 Import

```tsx
// Hooks (recommended)
import {
  useReservations,
  useReservation,
  useCreateReservation,
  useCancelReservation,
  useParkingHistory,
  useParkingHistoryItem,
  useLongTermPackages,
  useLongTermPackage,
  useLongTermSubscriptions,
  useLongTermSubscription,
  useSubscribeToPackage,
  useCancelSubscription,
} from '@/hooks/user';

// API service (direct usage)
import { userApi } from '@/services/user/userApi';
```

---

## 🎣 Hooks Cheat Sheet

### List Hooks
```tsx
const { items, isLoading, error, pagination, refresh } = useReservations(options);
const { items, isLoading, error, pagination, refresh } = useParkingHistory(options);
const { items, isLoading, error, pagination, refresh } = useLongTermPackages(options);
const { items, isLoading, error, pagination, refresh } = useLongTermSubscriptions(options);
```

### Detail Hooks
```tsx
const { data, isLoading, error, refresh } = useReservation(id);
const { data, isLoading, error, refresh } = useParkingHistoryItem(id);
const { data, isLoading, error, refresh } = useLongTermPackage(id);
const { data, isLoading, error, refresh } = useLongTermSubscription(id);
```

### Mutation Hooks
```tsx
const { create, isLoading, error } = useCreateReservation();
const { cancel, isLoading, error } = useCancelReservation();
const { subscribe, isLoading, error } = useSubscribeToPackage();
const { cancel, isLoading, error } = useCancelSubscription();
```

---

## 🌐 API Endpoints

### Reservations
```tsx
// List
GET /users/reservations
?status=confirmed&limit=10&page=1

// Get
GET /users/reservations/{id}

// Create
POST /users/reservations
{
  plateNumber: "29A-12345",
  buildingId: "bld-123",
  vehicleTypeId?: "vt-car",
  slotId?: "slot-456",
  reservationDate: "2024-01-20T10:00:00Z"
}

// Cancel
DELETE /users/reservations/{id}
```

### Parking History
```tsx
// List
GET /users/parking-history
?limit=20&page=1&fromDate=...&toDate=...

// Get
GET /users/parking-history/{id}
```

### Long-Term Packages
```tsx
// List
GET /users/long-term/packages
?buildingId=bld-123&limit=10&page=1

// Get
GET /users/long-term/packages/{id}
```

### Long-Term Subscriptions
```tsx
// List
GET /users/long-term/subscriptions
?status=active&limit=10&page=1

// Get
GET /users/long-term/subscriptions/{id}

// Create
POST /users/long-term/subscriptions
{
  packageId: "pkg-123",
  linkedPlates: ["29A-12345"],
  paymentMethod?: "wallet"
}

// Cancel
DELETE /users/long-term/subscriptions/{id}
```

---

## 💻 Common Patterns

### Pattern 1: List with Pagination
```tsx
const [page, setPage] = useState(1);
const { items, pagination, refresh } = useReservations({
  page,
  limit: 10,
});

<button onClick={() => setPage(page + 1)}>
  Next ({pagination?.page}/{pagination?.totalPages})
</button>
```

### Pattern 2: Create + Refresh List
```tsx
const { items, refresh } = useReservations();
const { create } = useCreateReservation();

const handleCreate = async (data) => {
  await create(data);
  await refresh(); // Refresh the list
};
```

### Pattern 3: Filter + List
```tsx
const [status, setStatus] = useState('active');
const { items } = useReservations({ status });

// When status changes, list automatically updates
```

### Pattern 4: Detail + Edit + Refresh Parent
```tsx
const { data: reservation, refresh: refreshDetail } = useReservation(id);
const { cancel } = useCancelReservation();
const { refresh: refreshList } = useReservations();

const handleCancel = async () => {
  await cancel(id);
  refreshDetail(); // Optional: refresh this detail
  refreshList();   // Update parent list
};
```

---

## 🔢 Response Types

### ListResult<T>
```typescript
{
  items: T[],
  pagination?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

### Wrap<T>
```typescript
{
  data: T
}
```

### Reservation
```typescript
{
  _id: string,
  code: string,
  plateNumber: string,
  vehicleType?: VehicleType,
  slot?: ParkingSlot,
  building: Building,
  status: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled',
  reservationDate: string,
  expiresAt: string
}
```

---

## ⚠️ Common Mistakes

```tsx
// ❌ WRONG: Infinite loop
useEffect(() => {
  const { items } = useReservations();
}, [useReservations()]);

// ✅ RIGHT: Dependencies from hook
const { items } = useReservations();
useEffect(() => {
  // Use items here
}, [items]);

// ❌ WRONG: Missing error handling
const data = useReservations();

// ✅ RIGHT: Handle all states
const { items, isLoading, error } = useReservations();
if (error) return <div>{error.message}</div>;

// ❌ WRONG: Not refreshing after mutation
await create(data);

// ✅ RIGHT: Refresh after mutation
await create(data);
refresh();

// ❌ WRONG: Object in dependency
const query = { page: 1 };
useEffect(() => {}, [query]);

// ✅ RIGHT: Primitive dependencies
useEffect(() => {}, [1, 10]);
```

---

## 🎨 UI Components Template

### List Component
```tsx
function ReservationsList() {
  const { items, isLoading, error, pagination } = useReservations();

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;

  return (
    <div>
      <table>
        <tbody>
          {items.map(item => <Row key={item._id} {...item} />)}
        </tbody>
      </table>
      <Pagination current={pagination?.page} total={pagination?.totalPages} />
    </div>
  );
}
```

### Detail Component
```tsx
function ReservationDetail({ id }) {
  const { data, isLoading, error } = useReservation(id);

  if (isLoading) return <Skeleton />;
  if (error) return <Error message={error.message} />;
  if (!data) return <NotFound />;

  return <div>{/* render data */}</div>;
}
```

### Form Component
```tsx
function CreateReservationForm() {
  const { create, isLoading, error } = useCreateReservation();

  const onSubmit = async (formData) => {
    try {
      await create({...formData});
      toast.success('Created!');
    } catch {
      // error already in state
    }
  };

  return (
    <form onSubmit={onSubmit}>
      {/* form fields */}
      <button disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create'}
      </button>
      {error && <ErrorMessage>{error.message}</ErrorMessage>}
    </form>
  );
}
```

---

## 📞 Support Resources

- 📖 [Full API Documentation](../services/user/README.md)
- 💡 [Usage Examples](./USAGE_EXAMPLES.tsx)
- 🔄 [Migration Guide](../pages/user/MIGRATION_GUIDE.md)
- 📝 [Type Definitions](../services/user/userApi.ts)

---

## 🔗 Related Files

- API Service: `src/services/user/userApi.ts`
- Hooks: `src/hooks/user/useUserApi.ts`
- Auth Service: `src/services/authService.ts`
- API Client: `src/services/apiClient.ts`
