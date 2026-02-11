import { auth } from '@/app/(auth)/auth';
import { getConversation, getConversationMessages } from '@/lib/db/queries';
import { ChatInterface } from '@/components/chat/chat-interface';
import { notFound } from 'next/navigation';

/**
 * Dynamic conversation page
 * Loads existing conversation and displays messages with chat interface
 * Protected by ChatLayout authentication check
 */
export default async function ConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { conversationId } = await params;

  // Fetch conversation with ownership check
  const conversation = await getConversation(conversationId, session.user.id);
  if (!conversation) notFound();

  // Fetch all messages for this conversation
  const messages = await getConversationMessages(conversationId);

  return (
    <ChatInterface
      conversationId={conversationId}
      initialMessages={messages}
    />
  );
}
