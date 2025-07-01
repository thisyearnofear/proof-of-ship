import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
// Create a simple login component inline since the original is missing
const Login = () => (
  <div className="text-center">
    <h1>Login functionality temporarily unavailable</h1>
    <p>Please check back later.</p>
  </div>
);

export default function LoginPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { redirect } = router.query;

  useEffect(() => {
    if (currentUser) {
      router.push(redirect || "/dashboard");
    }
  }, [currentUser, redirect, router]);

  return (
    <div className="max-w-md mx-auto mt-12">
      <Login />
    </div>
  );
}
