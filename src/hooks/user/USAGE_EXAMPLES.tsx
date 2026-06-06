import { userApi, type Reservation } from '@/services/user/userApi';
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

/**
 * USAGE EXAMPLES - USER API
 *
 * This file demonstrates how to use the user API service and hooks
 */

// ============================================
// 1. RESERVATIONS EXAMPLES
// ============================================

/**
 * Example: Display user's reservations list
 */
export function ReservationsListExample() {
  const { items, isLoading, error, refresh } = useReservations({
    status: 'confirmed',
    limit: 10,
    page: 1,
  });

  if (isLoading) return <div>Loading reservations...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map((res) => (
        <div key={res._id}>
          <p>Building: {res.building.name}</p>
          <p>Plate: {res.plateNumber}</p>
          <p>Status: {res.status}</p>
        </div>
      ))}
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

/**
 * Example: Get single reservation detail
 */
export function ReservationDetailExample({ id }: { id: string }) {
  const { data, isLoading, error } = useReservation(id);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div>
      <h2>{data.building.name}</h2>
      <p>Code: {data.code}</p>
      <p>Status: {data.status}</p>
    </div>
  );
}

/**
 * Example: Create new reservation
 */
export function CreateReservationExample() {
  const { create, isLoading, error } = useCreateReservation();

  const handleCreate = async () => {
    try {
      const reservation = await create({
        plateNumber: '29A-12345',
        buildingId: 'building-123',
        vehicleTypeId: 'car-type-id',
        startTime: new Date().toISOString(),
      });
      console.log('Created:', reservation);
    } catch (err) {
      console.error('Failed to create:', err);
    }
  };

  return (
    <button onClick={handleCreate} disabled={isLoading}>
      {isLoading ? 'Creating...' : 'Create Reservation'}
    </button>
  );
}

/**
 * Example: Cancel reservation
 */
export function CancelReservationExample({ id }: { id: string }) {
  const { cancel, isLoading, error } = useCancelReservation();

  const handleCancel = async () => {
    try {
      await cancel(id);
      console.log('Cancelled successfully');
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  return (
    <button onClick={handleCancel} disabled={isLoading}>
      {isLoading ? 'Cancelling...' : 'Cancel Reservation'}
    </button>
  );
}

// ============================================
// 2. PARKING HISTORY EXAMPLES
// ============================================

/**
 * Example: Get parking history
 */
export function ParkingHistoryExample() {
  const { items, isLoading, error } = useParkingHistory({
    limit: 20,
    page: 1,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <table>
      <tbody>
        {items.map((session) => (
          <tr key={session._id}>
            <td>{session.plateNumber}</td>
            <td>{session.building.name}</td>
            <td>{session.duration} minutes</td>
            <td>{session.fee} VND</td>
            <td>{session.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ============================================
// 3. LONG-TERM PACKAGES EXAMPLES
// ============================================

/**
 * Example: List available long-term packages
 */
export function PackagesListExample() {
  const { items, isLoading } = useLongTermPackages({
    limit: 10,
    page: 1,
  });

  if (isLoading) return <div>Loading packages...</div>;

  return (
    <div className="grid gap-4">
      {items.map((pkg) => (
        <div key={pkg._id} className="p-4 border rounded">
          <h3>{pkg.name}</h3>
          <p>Price: {pkg.price} VND</p>
          <p>Duration: {pkg.durationDays} days</p>
          <button>Subscribe</button>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Subscribe to a package
 */
export function SubscribeExample() {
  const { subscribe, isLoading } = useSubscribeToPackage();

  const handleSubscribe = async () => {
    try {
      const subscription = await subscribe({
        packageId: 'pkg-123',
        linkedPlates: ['29A-12345', '29A-67890'],
        paymentMethod: 'wallet',
      });
      console.log('Subscribed:', subscription);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <button onClick={handleSubscribe} disabled={isLoading}>
      {isLoading ? 'Processing...' : 'Subscribe'}
    </button>
  );
}

// ============================================
// 4. LONG-TERM SUBSCRIPTIONS EXAMPLES
// ============================================

/**
 * Example: Get user's subscriptions
 */
export function SubscriptionsListExample() {
  const { items, isLoading, error } = useLongTermSubscriptions({
    status: 'active',
  });

  if (isLoading) return <div>Loading subscriptions...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {items.map((sub) => (
        <div key={sub._id}>
          <h3>{sub.package.name}</h3>
          <p>Active from {sub.startDate} to {sub.endDate}</p>
          <p>Plate: {sub.plateNumber ?? sub.linkedPlates?.join(', ') ?? '—'}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * Example: Cancel subscription
 */
export function CancelSubscriptionExample({ id }: { id: string }) {
  const { cancel, isLoading } = useCancelSubscription();

  const handleCancel = async () => {
    try {
      await cancel(id);
      console.log('Subscription cancelled');
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <button onClick={handleCancel} disabled={isLoading}>
      {isLoading ? 'Cancelling...' : 'Cancel Subscription'}
    </button>
  );
}

// ============================================
// 5. DIRECT API USAGE (Without Hooks)
// ============================================

/**
 * Example: Using the API directly (useful for non-React code or custom logic)
 */
export async function directApiExample() {
  try {
    // Get reservations
    const reservations = await userApi.reservations.list({ status: 'confirmed' });
    console.log(reservations.data.items);

    // Get parking history
    const history = await userApi.parkingHistory.list({ limit: 20 });
    console.log(history.data.items);

    // Get packages
    const packages = await userApi.longTermPackages.list();
    console.log(packages.data.packages);

    // Subscribe to package
    const subscription = await userApi.longTermSubscriptions.create({
      packageId: 'pkg-123',
      plateNumber: '29A-12345',
    });
    console.log(subscription.data.subscription);
  } catch (error) {
    console.error('API Error:', error);
  }
}
