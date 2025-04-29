import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { collection, addDoc, doc, setDoc, getDoc } from "firebase/firestore";
import { useRouter } from "next/router";
import Link from "next/link";

export default function CreateProject() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("Test Project");
  const [slug, setSlug] = useState("test-project");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  
  // The access code should be stored securely in your backend
  // For this example, we'll use a simple hardcoded value
  const ADMIN_ACCESS_CODE = "celo-hackathon-2023";
  
  useEffect(() => {
    // Check if user is logged in
    if (!currentUser) {
      setLoading(false);
      return;
    }
    
    // Check if user is an admin or has project creation access
    const checkAccess = async () => {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          // Check if user is an admin or has project creation access
          if (userData.isAdmin || userData.canCreateProjects) {
            setHasAccess(true);
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error checking access:", err);
        setLoading(false);
      }
    };
    
    checkAccess();
  }, [currentUser]);
  
  // Handle access code verification
  const verifyAccessCode = () => {
    if (enteredCode === ADMIN_ACCESS_CODE) {
      setHasAccess(true);
      
      // Also update the user's permissions in Firestore
      if (currentUser) {
        const userRef = doc(db, "users", currentUser.uid);
        setDoc(userRef, {
          canCreateProjects: true
        }, { merge: true })
        .catch(err => console.error("Error updating user permissions:", err));
      }
    } else {
      setError("Invalid access code");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      setError("You must be logged in to create a project");
      return;
    }
    
    // Check if user has access to create projects
    if (!hasAccess) {
      setError("You do not have permission to create projects");
      return;
    }
    
    if (!name || !slug) {
      setError("Name and slug are required");
      return;
    }
    
    setLoading(true);
    setError("");
    setSuccess("");
    
    try {
      // Create the project document
      await setDoc(doc(db, "projects", slug), {
        name,
        slug,
        description: "",
        contracts: [],
        socials: {
          twitter: "",
          discord: "",
          website: ""
        },
        founders: [],
        owners: [currentUser.uid],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      });
      
      // Update user permissions
      const userRef = doc(db, "users", currentUser.uid);
      
      // Add project to user's permissions
      await setDoc(userRef, {
        permissions: [{
          projectSlug: slug,
          projectName: name,
          role: "editor",
          grantedAt: new Date().toISOString()
        }]
      }, { merge: true });
      
      setSuccess(`Project "${name}" created successfully!`);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (err) {
      console.error("Error creating project:", err);
      setError(`Failed to create project: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // If user is not logged in
  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Please <Link href="/login" className="font-medium underline">sign in</Link> to continue.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If still checking access
  if (loading) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  // If user doesn't have access, show access code form
  if (!hasAccess) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">Create Project</h1>
        
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You need an access code to create projects. Please contact the administrator.
              </p>
            </div>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Access Code
          </label>
          <input
            type="text"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="button"
            onClick={verifyAccessCode}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Verify Access
          </button>
        </div>
      </div>
    );
  }

  // If user has access, show project creation form
  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Create Project</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Project Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={loading}
          />
          <p className="mt-1 text-xs text-gray-500">
            This will be used in the URL: /projects/{slug}
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </div>
  );
}
