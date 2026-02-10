'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { registerUser } from '@/app/(auth)/actions';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();

  const handleRegister = async (
    email: string,
    password: string,
    confirmPassword?: string
  ) => {
    try {
      // Additional validation
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters');
        return;
      }

      if (password !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }

      // Create user account using server action
      const result = await registerUser(email, password);

      if (!result.success) {
        toast.error(result.error || 'Registration failed');
        return;
      }

      // Automatically sign in after successful registration
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error('Account created but sign in failed. Please try logging in.');
        router.push('/login');
        return;
      }

      // Successful registration and login - redirect to home
      toast.success('Account created successfully!');
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('An error occurred during registration');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-sm border border-zinc-200">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900">Create Account</h1>
        <p className="text-sm text-zinc-600 mt-1">
          Sign up to start chatting with AI.
        </p>
      </div>

      <AuthForm mode="register" onSubmit={handleRegister} />

      <div className="mt-6 text-center">
        <p className="text-sm text-zinc-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-zinc-900 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
