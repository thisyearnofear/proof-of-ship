import { useEffect } from "react";
import { useRouter } from "next/router";

export default function CreateProjectRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to the new create project page
    router.replace("/create-project-new");
  }, [router]);

  // Show loading state while redirecting
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create Project</h1>
      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      <p className="text-center mt-4 text-gray-500">Redirecting...</p>
    </div>
  );
}
