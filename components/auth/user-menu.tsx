'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, User, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

/**
 * User menu component
 * Shows user info and logout button
 * Placed at bottom of sidebar
 */

interface UserMenuProps {
  userEmail?: string;
}

export function UserMenu({ userEmail }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Failed to logout:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="relative border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* User info button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-medium">
          {userEmail?.charAt(0).toUpperCase() || 'U'}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {userEmail || 'User'}
          </p>
        </div>
        <ChevronUp
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
          >
            <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-700 dark:text-gray-300">Logout</span>
          </button>
        </div>
      )}
    </div>
  );
}
