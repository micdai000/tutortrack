import { useAuth } from "../components/AuthProvider";

function DashboardPage() {
  const { user, signOut } = useAuth();

  async function handleSignOut() {
    await signOut();
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Dashboard</h1>
      <p>Signed in as {user?.email}</p>
      <button type="button" onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}

export default DashboardPage;
