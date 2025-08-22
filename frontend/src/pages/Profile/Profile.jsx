import { useAuth } from "../../hooks/useAuth";

export default function Profile() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return null; // render nothing if not logged in

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <h2 className="text-3xl font-bold mb-6">👤 Profile</h2>
      <img
        src={user.picture}
        alt="profile"
        className="w-28 h-28 rounded-full shadow-md mb-4"
      />
      <p className="text-lg">
        <b>Name:</b> {user.name}
      </p>
      <p className="text-lg">
        <b>Email:</b> {user.email}
      </p>
    </div>
  );
}
