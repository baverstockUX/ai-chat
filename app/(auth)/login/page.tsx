'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Invalid email or password');
        return;
      }

      // Successful login - redirect to home
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-zinc-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Sign In</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Welcome back! Please sign in to continue.
        </p>
      </div>

      <AuthForm mode="login" onSubmit={handleLogin} />

      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-600">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-zinc-900 hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
