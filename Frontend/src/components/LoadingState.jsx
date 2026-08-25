export default function LoadingState({ label = "Loading" }) {
  return <div className="page-state"><span className="spinner" />{label}…</div>;
}
