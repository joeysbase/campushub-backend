import { useMemo, useState, type FormEvent } from 'react';
import { BookingForm } from './components/BookingForm';
import { ResourceList } from './components/ResourceList';
import { UserReservations } from './components/UserReservations';
import { useResources } from './hooks/useResources';
import { useUserReservations } from './hooks/useUserReservations';
import type { Resource } from './types/campushub';
import shared from './styles/shared.module.css';
import styles from './App.module.css';

/** There is no auth yet, so the "current student" is just an id typed into the header. */
const DEFAULT_USER_ID = 'user-456';

const App = () => {
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [userIdDraft, setUserIdDraft] = useState<string>(DEFAULT_USER_ID);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const reservationsQuery = useUserReservations(userId);

  // Unfiltered list, used only to show resource names in "My Bookings".
  const { data: allResources } = useResources();
  const resourceNames = useMemo(
    (): Record<string, string> =>
      Object.fromEntries(allResources.map((resource) => [resource.id, resource.name])),
    [allResources],
  );

  const handleSwitchUser = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    const nextUserId = userIdDraft.trim();
    if (nextUserId) setUserId(nextUserId);
  };

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1 className={styles.title}>CampusHub</h1>
        <form className={styles.userForm} onSubmit={handleSwitchUser}>
          <label htmlFor="user-id">Student ID</label>
          <input
            id="user-id"
            value={userIdDraft}
            onChange={(event) => setUserIdDraft(event.target.value)}
          />
          <button
            type="submit"
            className={shared.secondaryButton}
            disabled={!userIdDraft.trim() || userIdDraft.trim() === userId}
          >
            Switch
          </button>
        </form>
      </header>

      <main className={styles.layout}>
        <ResourceList
          selectedResourceId={selectedResource?.id ?? null}
          onSelect={setSelectedResource}
        />
        <aside className={styles.sidebar}>
          <BookingForm
            key={selectedResource?.id ?? 'none'}
            resource={selectedResource}
            userId={userId}
            onBooked={reservationsQuery.reload}
          />
          <UserReservations reservationsQuery={reservationsQuery} resourceNames={resourceNames} />
        </aside>
      </main>
    </div>
  );
};

export default App;
