import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { ConversationSidebar } from '@/components/sidebar/conversation-sidebar';
import { getUserConversations } from '@/lib/db/queries';

/**
 * Protected chat layout
 * Requires authentication - redirects to /login if not authenticated
 * Includes sidebar with conversation list
 */
export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch user's conversations for sidebar
  const conversations = await getUserConversations(session.user.id);

  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationSidebar conversations={conversations} />
      <main className="flex-1 relative overflow-hidden">{children}</main>
    </div>
  );
}
