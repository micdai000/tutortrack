import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h1>Page not found</h1>
      <p>That page does not exist or may have moved.</p>
      <p>
        <Link to="/dashboard">Return to dashboard</Link>
      </p>
    </div>
  );
}

export default NotFoundPage;
