import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GithubAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase/clientApp";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
} from "firebase/firestore";

interface Permission {
  projectSlug: string;
  projectName: string;
  role: string;
  grantedAt: any;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  userPermissions: Permission[];
  logout: () => Promise<void>;
  signInWithGithub: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  loading: true,
  userPermissions: [],
  logout: async () => {},
  signInWithGithub: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userPermissions, setUserPermissions] = useState<Permission[]>([]);

  const checkPendingPermissions = async (user: User) => {
    try {
      const githubUsername = user.providerData.find(
        (p) => p.providerId === "github.com"
      )?.uid;

      if (!githubUsername) return;

      const pendingPermissionsRef = collection(db, "pendingPermissions");
      const q = query(
        pendingPermissionsRef,
        where("githubUsername", "==", githubUsername)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) return;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.exists() ? userDoc.data() : { permissions: [] };
      const currentPermissions = userData.permissions || [];
      let newPermissions = [...currentPermissions];

      for (const permissionDoc of querySnapshot.docs) {
        const permissionData = permissionDoc.data();

        if (
          !newPermissions.some(
            (p) => p.projectSlug === permissionData.projectSlug
          )
        ) {
          newPermissions.push({
            projectSlug: permissionData.projectSlug,
            projectName: permissionData.projectName,
            role: permissionData.role,
            grantedAt: permissionData.grantedAt,
          });

          const projectRef = doc(db, "projects", permissionData.projectSlug);
          const projectDoc = await getDoc(projectRef);

          if (projectDoc.exists()) {
            const projectData = projectDoc.data();
            const owners = projectData.owners || [];
            if (!owners.includes(user.uid)) {
              owners.push(user.uid);
              await setDoc(projectRef, { owners }, { merge: true });
            }
          }
          await deleteDoc(permissionDoc.ref);
        }
      }

      if (newPermissions.length !== currentPermissions.length) {
        await setDoc(userDocRef, { permissions: newPermissions }, { merge: true });
        setUserPermissions(newPermissions);
      }
    } catch (err) {
      console.error("Error checking pending permissions:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await checkPendingPermissions(user);
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserPermissions(userDoc.data().permissions || []);
        }
      } else {
        setUserPermissions([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signInWithGithub = async () => {
    const provider = new GithubAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, userPermissions, logout, signInWithGithub }}>
      {children}
    </AuthContext.Provider>
  );
};
