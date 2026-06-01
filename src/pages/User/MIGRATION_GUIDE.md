# User Pages Migration Guide

This guide explains how to update existing user pages to use the new User API service instead of mock data.

## Before and After Examples

### Example 1: Reservations List Page

**Before (with mock data):**
```tsx
import { listUserReservations } from '@/pages/User/mockReservationsData';

function ReservationsPage() {
  const reservations = listUserReservations();

  return (
    <div>
      {reservations.map(res => (
        <div key={res.id}>{res.buildingName}</div>
      ))}
    </div>
  );
}
```

**After (with hooks):**
```tsx
import { useReservations } from '@/hooks/user';

function ReservationsPage() {
  const { items: reservations, isLoading, error, refresh } = useReservations();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {reservations.map(res => (
        <div key={res._id}>{res.building.name}</div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}
```

**Key changes:**
- Replace mock function with hook
- Use `items` instead of direct return
- Add loading/error states
- Change `id` to `_id`, `buildingName` to `building.name`
- Add `refresh()` callback for manual refetch

---

### Example 2: Create Reservation Form

**Before:**
```tsx
import { userApi } from '@/services/userApi'; // assuming old structure

function CreateReservationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (formData) => {
    setLoading(true);
    try {
      const res = await userApi.createReservation(formData);
      // handle success
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

**After:**
```tsx
import { useCreateReservation } from '@/hooks/user';

function CreateReservationForm() {
  const { create, isLoading, error } = useCreateReservation();

  const handleSubmit = async (formData) => {
    try {
      const reservation = await create({
        plateNumber: formData.plateNumber,
        buildingId: formData.buildingId,
        vehicleTypeId: formData.vehicleTypeId,
        reservationDate: formData.reservationDate,
      });
      // handle success
    } catch (err) {
      // error is already in the error state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      ...
      {error && <div className="error">{error.message}</div>}
      <button disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

**Key changes:**
- Use the `useCreateReservation()` hook
- Hook manages loading and error state
- Call the `create` function with properly structured data

---

### Example 3: Parking History with Pagination

**Before:**
```tsx
import { listUserParkingHistory } from '@/pages/User/mockParkingData';

function ParkingHistoryPage() {
  const [page, setPage] = useState(1);
  const data = listUserParkingHistory(); // no pagination in mock

  return (
    <div>
      {data.map(session => (
        <div key={session.id}>{session.duration}</div>
      ))}
    </div>
  );
}
```

**After:**
```tsx
import { useParkingHistory } from '@/hooks/user';

function ParkingHistoryPage() {
  const [page, setPage] = useState(1);
  const { items, isLoading, error, pagination, refresh } = useParkingHistory({
    page,
    limit: 20,
  });

  return (
    <div>
      {items.map(session => (
        <div key={session._id}>{session.duration}</div>
      ))}

      {pagination && (
        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <span>Page {page} of {pagination.totalPages}</span>
          <button
            disabled={page === pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
```

**Key changes:**
- Use hook with pagination parameters
- Get `pagination` info from response
- Implement pagination controls

---

### Example 4: Long-Term Packages & Subscriptions

**Before:**
```tsx
import { listLongTermPackages, listSubscriptions } from '@/pages/User/mockData';

function PackagesPage() {
  const packages = listLongTermPackages();
  const subscriptions = listSubscriptions();

  const handleSubscribe = async (pkgId) => {
    // manual API call
  };

  return (
    <div>
      Packages: {packages.length}
      Subscriptions: {subscriptions.length}
    </div>
  );
}
```

**After:**
```tsx
import {
  useLongTermPackages,
  useLongTermSubscriptions,
  useSubscribeToPackage,
} from '@/hooks/user';

function PackagesPage() {
  const { items: packages, isLoading: loadingPkgs } = useLongTermPackages();
  const { items: subscriptions } = useLongTermSubscriptions();
  const { subscribe, isLoading: subscribing } = useSubscribeToPackage();

  const handleSubscribe = async (pkgId, linkedPlates) => {
    try {
      await subscribe({
        packageId: pkgId,
        linkedPlates,
        paymentMethod: 'wallet',
      });
      // handle success
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  if (loadingPkgs) return <div>Loading...</div>;

  return (
    <div>
      Packages: {packages.length}
      Subscriptions: {subscriptions.length}

      {packages.map(pkg => (
        <div key={pkg._id}>
          <h3>{pkg.name}</h3>
          <button
            onClick={() => handleSubscribe(pkg._id, ['29A-12345'])}
            disabled={subscribing}
          >
            Subscribe
          </button>
        </div>
      ))}
    </div>
  );
}
```

---

## Data Structure Changes

### Reservation
| Mock Field | API Field | Notes |
|-----------|-----------|-------|
| `id` | `_id` | - |
| `buildingId` | `building._id` | Now nested object |
| `buildingName` | `building.name` | Now nested object |
| `vehicleType` (string) | `vehicleType._id` | Now full object |
| `status` | `status` | Same |
| `plateNumber` | `plateNumber` | Same |

### Parking History
| Mock Field | API Field | Notes |
|-----------|-----------|-------|
| `id` | `_id` | - |
| `buildingId` | `building._id` | Now nested object |
| `duration` | `duration` | Same (in minutes) |
| `fee` | `fee` | Same |
| `vehicleType` | `vehicleType._id` | Now full object |

### Package
| Mock Field | API Field | Notes |
|-----------|-----------|-------|
| `id` | `_id` | - |
| `name` | `name` | Same |
| `price` | `price` | Same |
| `duration` | `duration` | Same (in days) |
| `features` | `features` | Array of strings |

---

## Migration Checklist

For each user page that uses mock data:

- [ ] Import appropriate hooks from `@/hooks/user`
- [ ] Replace mock data import with hook call
- [ ] Handle loading state with skeleton/spinner
- [ ] Handle error state with user message
- [ ] Update field names to match API response
- [ ] Add pagination if applicable
- [ ] Test with actual API
- [ ] Remove mock data imports
- [ ] Remove unused mock data files

---

## Files to Update

User pages that likely need updates:

1. `src/pages/user/BuildingsPage.tsx` - May need updates if it uses API
2. Any pages using `mockReservationsData.ts`
3. Any pages using `mockLongTermSubscriptionsData.ts`
4. Any pages using `mockParkingHistoryData.ts`

Find all usages:
```bash
grep -r "mockReservationsData\|mockLongTermSubscriptionsData\|mockParkingHistoryData" src/pages/user/
```

---

## Best Practices

1. **Always handle loading state** - Show spinner or skeleton
2. **Always handle error state** - Show user-friendly message
3. **Use refresh() for manual refetch** - For success callbacks
4. **Cache pagination state** - Prevent jumps during refresh
5. **Add error boundaries** - For component-level error handling
6. **Use TypeScript** - Import types from userApi

---

## Common Issues

### Issue: "Undefined" when accessing nested properties
**Before:**
```tsx
{reservation.building} // was a string ID in mock
```

**After:**
```tsx
{reservation.building.name} // is now full object
```

### Issue: Infinite loop with useEffect
**Problem:**
```tsx
useEffect(() => {
  fetch(); // This might be called repeatedly
}, [query]); // query object changes on every render
```

**Solution:**
```tsx
// Pass specific values, not entire object
const { items } = useReservations({ page: 1, limit: 10 });

useEffect(() => {
  // Dependencies are primitives, not objects
}, [1, 10]);
```

### Issue: State not updating after mutation
**Before:**
```tsx
const { cancel } = useCancelReservation();
await cancel(id);
// data not refreshed automatically
```

**After:**
```tsx
const { cancel } = useCancelReservation();
const { refresh } = useReservations();

await cancel(id);
refresh(); // Manually refresh list after mutation
```

---

## Support

For questions or issues:
1. Check [USAGE_EXAMPLES.tsx](./USAGE_EXAMPLES.tsx)
2. Review [API README](../services/user/README.md)
3. Check types in [userApi.ts](../services/user/userApi.ts)
