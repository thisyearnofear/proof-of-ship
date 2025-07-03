import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import ProjectEditor from '@/components/projects';

export default function EditProjectPage() {
  const { currentUser, loading, hasProjectPermission } = useAuth();
  const router = useRouter();
  const { slug } = router.query;

  useEffect(() => {
    if (!loading) {
      if (!currentUser) {
        router.push(`/login?redirect=/projects/${slug}/edit`);
      } else if (slug && !hasProjectPermission(slug)) {
        router.push(`/dashboard`);
      }
    }
  }, [currentUser, loading, router, slug, hasProjectPermission]);

  if (loading || !slug) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser || !hasProjectPermission(slug)) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Edit Project</h1>
      <ProjectEditor projectSlug={slug} />
    </div>
  );
}
