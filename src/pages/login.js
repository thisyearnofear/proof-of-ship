import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { Login } from "@/components/auth";

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
