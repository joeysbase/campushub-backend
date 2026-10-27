import styles from './ErrorBanner.module.css';

export interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorBanner = ({ message, onRetry, onDismiss }: ErrorBannerProps) => (
  <div className={styles.banner} role="alert">
    <span className={styles.message}>{message}</span>
    {onRetry && (
      <button type="button" className={styles.action} onClick={onRetry}>
        Retry
      </button>
    )}
    {onDismiss && (
      <button type="button" className={styles.action} onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    )}
  </div>
);
