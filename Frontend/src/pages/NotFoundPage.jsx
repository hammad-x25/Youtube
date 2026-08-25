import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <div className="empty-state"><span>404</span><h1>That frame is missing.</h1><p>The page you are looking for does not exist.</p><Link className="button button-primary" to="/">Back to home</Link></div>;
}
