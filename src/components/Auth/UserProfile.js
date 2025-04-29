import { useAuth } from '@/contexts/AuthContext';

export default function UserProfile() {
  const { currentUser, logout, userPermissions } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center space-x-4 mb-6">
        {currentUser.photoURL && (
          <img 
            src={currentUser.photoURL} 
            alt={currentUser.displayName || 'User'} 
            className="w-16 h-16 rounded-full"
          />
        )}
        <div>
          <h2 className="text-xl font-semibold">{currentUser.displayName}</h2>
          <p className="text-gray-600">{currentUser.email}</p>
          {currentUser.providerData[0]?.providerId === 'github.com' && (
            <p className="text-sm text-gray-500">
              GitHub: @{currentUser.providerData[0]?.uid}
            </p>
          )}
        </div>
      </div>

      {userPermissions.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-2">Your Projects</h3>
          <ul className="space-y-2">
            {userPermissions.map((permission) => (
              <li key={permission.projectSlug} className="flex items-center justify-between">
                <span>{permission.projectName}</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {permission.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium rounded transition duration-150"
      >
        Sign Out
      </button>
    </div>
  );
}
