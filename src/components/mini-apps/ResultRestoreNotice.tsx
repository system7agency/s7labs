/**
 * The "restoring a saved result from ?result=<id>" placeholder, shown in a
 * mini-app's panel body while useResultParam fetches the stored output. Single
 * source of truth so every app's loading state looks identical.
 */
export function ResultRestoreNotice({ label = 'Loading your saved result…' }: { label?: string }) {
  return (
    <p style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)' }}>{label}</p>
  )
}
