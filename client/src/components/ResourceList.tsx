import { useState } from 'react';
import { useResources } from '../hooks/useResources';
import { RESOURCE_TYPES, type Resource, type ResourceType } from '../types/campushub';
import { RESOURCE_TYPE_LABELS } from '../utils/format';
import { ErrorBanner } from './ErrorBanner';
import styles from './ResourceList.module.css';

const FILTER_LABELS: Record<ResourceType, string> = {
  ROOM: 'Rooms',
  EQUIPMENT: 'Equipment',
  LAB: 'Labs',
};

export interface ResourceListProps {
  selectedResourceId: string | null;
  onSelect: (resource: Resource) => void;
}

export const ResourceList = ({ selectedResourceId, onSelect }: ResourceListProps) => {
  const [typeFilter, setTypeFilter] = useState<ResourceType | undefined>(undefined);
  const { data: resources, isLoading, error, reload } = useResources(typeFilter);

  const filters: { label: string; value: ResourceType | undefined }[] = [
    { label: 'All', value: undefined },
    ...RESOURCE_TYPES.map((type) => ({ label: FILTER_LABELS[type], value: type })),
  ];

  return (
    <section className={styles.section} aria-labelledby="resources-heading">
      <h2 id="resources-heading">Campus Resources</h2>

      <div className={styles.filters} role="group" aria-label="Filter by resource type">
        {filters.map(({ label, value }) => (
          <button
            key={label}
            type="button"
            className={styles.filter}
            aria-pressed={typeFilter === value}
            onClick={() => setTypeFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error && <ErrorBanner message={error} onRetry={reload} />}
      {isLoading && <p className={styles.status}>Loading resources…</p>}
      {!isLoading && !error && resources.length === 0 && (
        <p className={styles.status}>No resources match this filter.</p>
      )}

      {!isLoading && !error && resources.length > 0 && (
        <ul className={styles.grid}>
          {resources.map((resource) => (
            <li
              key={resource.id}
              className={styles.card}
              data-selected={resource.id === selectedResourceId}
            >
              <div className={styles.cardHeader}>
                <span className={styles.type}>{RESOURCE_TYPE_LABELS[resource.type]}</span>
                <span
                  className={resource.isAvailable ? styles.available : styles.unavailable}
                >
                  {resource.isAvailable ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <h3 className={styles.name}>{resource.name}</h3>
              <p className={styles.location}>{resource.location}</p>
              <button
                type="button"
                className={styles.book}
                disabled={!resource.isAvailable}
                onClick={() => onSelect(resource)}
              >
                {resource.id === selectedResourceId ? 'Selected' : 'Book'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};
