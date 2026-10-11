export function Loading({ message = 'Finding your next experience…' }) {
  return (
    <div className="state-panel" role="status">
      <span className="spinner" />
      <p>{message}</p>
    </div>
  );
}
export function Empty({ title = 'Nothing here yet', children }) {
  return (
    <div className="state-panel">
      <span className="state-symbol" aria-hidden="true">
        ✦
      </span>
      <h2>{title}</h2>
      <p>{children}</p>
    </div>
  );
}
export function ErrorState({ message, retry }) {
  return (
    <div className="state-panel" role="alert">
      <h2>We hit a little pause</h2>
      <p>{message}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again
        </button>
      )}
    </div>
  );
}
