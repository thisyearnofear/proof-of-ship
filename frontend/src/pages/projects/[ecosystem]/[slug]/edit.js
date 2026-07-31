import { useEffect } from "react";
import { useRouter } from "next/router";

import { useUser } from "@/stores/authStore";
import { LoadingSpinner } from "@/components/common/LoadingStates";
import ProjectEditor from "@/components/projects";

export default function EditProjectPage() {
  const { currentUser, loading } = useUser();
  const router = useRouter();
  const { ecosystem, slug } = router.query;

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      const redirect = ecosystem && slug ? `/projects/${ecosystem}/${slug}/edit` : "/projects/new";
      router.push(`/login?redirect=${encodeURIComponent(redirect)}`);
      return;
    }
  }, [currentUser, loading, router, ecosystem, slug]);

  if (loading || !ecosystem || !slug) {
    return (
      <div className="flex justify-center items-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <ProjectEditor projectSlug={slug} />
    </div>
  );
}
