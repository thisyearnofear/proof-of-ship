import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function EcosystemProjectsRedirect() {
  const router = useRouter();
  const { ecosystem } = router.query;

  useEffect(() => {
    if (ecosystem) {
      router.replace(`/explore?ecosystem=${ecosystem}`);
    }
  }, [ecosystem, router]);

  return null;
}
