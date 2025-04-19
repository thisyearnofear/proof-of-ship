import { useEffect } from 'react';
import { useRouter } from 'next/router';
import repos from '../../repos.json';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    router.push('/shippers');
  }, []);

  return null;
}