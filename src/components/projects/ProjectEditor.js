import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function ProjectEditor({ projectSlug }) {
  const { currentUser, hasProjectPermission } = useAuth();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contracts, setContracts] = useState([]);
  const [socials, setSocials] = useState({
    twitter: "",
    discord: "",
    website: "",
  });
  const [founders, setFounders] = useState([]);

  useEffect(() => {
    async function fetchProjectData() {
      if (!projectSlug) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const projectRef = doc(db, "projects", projectSlug);
        const projectDoc = await getDoc(projectRef);

        if (projectDoc.exists()) {
          const projectData = projectDoc.data();
          setProject(projectData);

          // Set form state
          setName(projectData.name || "");
          setDescription(projectData.description || "");
          setContracts(projectData.contracts || []);
          setSocials({
            twitter: projectData.socials?.twitter || "",
            discord: projectData.socials?.discord || "",
            website: projectData.socials?.website || "",
          });
          setFounders(projectData.founders || []);
        } else {
          setError("Project not found");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
        setError("Failed to load project data");
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [projectSlug]);

  const handleSave = async (e) => {
    if (e) e.preventDefault();

    if (!currentUser) {
      setError("You must be signed in to save a project.");
      return;
    }

    // If editing, check for permission
    if (projectSlug && !hasProjectPermission(projectSlug)) {
      setError("You do not have permission to edit this project");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const validContracts = contracts.filter(
        (c) => c.address && c.address.trim() !== ""
      );

      const projectData = {
        name,
        description,
        contracts: validContracts,
        socials,
        founders,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid,
      };

      if (projectSlug) {
        // Update existing project
        const projectRef = doc(db, "projects", projectSlug);
        await updateDoc(projectRef, projectData);
        setSuccess("Project updated successfully!");
      } else {
        // Create new project
        const newSlug = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        if (!newSlug) {
          setError("Project name must not be empty.");
          setSaving(false);
          return;
        }
        projectData.slug = newSlug;
        projectData.owner = currentUser.uid; // Set owner on creation
        projectData.createdAt = new Date().toISOString();

        const projectRef = doc(db, "projects", newSlug);
        await setDoc(projectRef, projectData);
        setSuccess("Project created successfully!");
      }

      // Redirect after a short delay
      setTimeout(() => {
        window.location.href = projectSlug
          ? `/projects/${projectSlug}`
          : "/dashboard";
      }, 2000);
    } catch (err) {
      console.error("Error saving project:", err);
      setError(`Failed to save project: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addContract = () => {
    setContracts([...contracts, { label: "", address: "", explorer: "" }]);
  };

  const updateContract = (index, field, value) => {
    const updatedContracts = [...contracts];
    updatedContracts[index] = { ...updatedContracts[index], [field]: value };
    setContracts(updatedContracts);
  };

  const removeContract = (index) => {
    setContracts(contracts.filter((_, i) => i !== index));
  };

  const addFounder = () => {
    setFounders([...founders, { name: "", url: "" }]);
  };

  const updateFounder = (index, field, value) => {
    const updatedFounders = [...founders];
    updatedFounders[index] = { ...updatedFounders[index], [field]: value };
    setFounders(updatedFounders);
  };

  const removeFounder = (index) => {
    setFounders(founders.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              Please sign in to edit this project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (projectSlug && !hasProjectPermission(projectSlug)) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-red-700">
              You do not have permission to edit this project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-6">
        {projectSlug ? `Edit Project: ${name}` : "Create New Project"}
      </h2>

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

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div>
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contracts */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Contracts</h3>
            <button
              type="button"
              onClick={addContract}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Contract
            </button>
          </div>

          {contracts.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No contracts added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Label"
                      value={contract.label}
                      onChange={(e) =>
                        updateContract(index, "label", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Contract Address"
                      value={contract.address}
                      onChange={(e) =>
                        updateContract(index, "address", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="text"
                      placeholder="Explorer URL (optional)"
                      value={contract.explorer}
                      onChange={(e) =>
                        updateContract(index, "explorer", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeContract(index)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Links */}
        <div>
          <h3 className="text-lg font-medium mb-4">Social Links</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Twitter
              </label>
              <input
                type="text"
                placeholder="https://twitter.com/username"
                value={socials.twitter}
                onChange={(e) =>
                  setSocials({ ...socials, twitter: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discord
              </label>
              <input
                type="text"
                placeholder="https://discord.gg/invite"
                value={socials.discord}
                onChange={(e) =>
                  setSocials({ ...socials, discord: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="text"
                placeholder="https://yourproject.com"
                value={socials.website}
                onChange={(e) =>
                  setSocials({ ...socials, website: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Founders */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Founders</h3>
            <button
              type="button"
              onClick={addFounder}
              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Founder
            </button>
          </div>

          {founders.length === 0 ? (
            <p className="text-sm text-gray-500 italic">
              No founders added yet.
            </p>
          ) : (
            <div className="space-y-3">
              {founders.map((founder, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-center"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      placeholder="Name"
                      value={founder.name}
                      onChange={(e) =>
                        updateFounder(index, "name", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="URL (optional)"
                      value={founder.url}
                      onChange={(e) =>
                        updateFounder(index, "url", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => removeFounder(index)}
                      className="inline-flex items-center p-1.5 border border-transparent rounded-md text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end space-x-3">
          <a
            href="/dashboard"
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
