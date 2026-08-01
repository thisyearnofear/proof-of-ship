import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

/**
 * Signup page — redirects to the consolidated login page with mode=signup.
 * Kept as a page so existing bookmarks/links don't break.
 */
export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/login?mode=signup');
  }, [router]);

  return (
    <Head>
      <title>Sign Up | Proof of Ship</title>
      <meta httpEquiv="refresh" content="0;url=/login?mode=signup" />
    </Head>
  );
}
