import { ChatInterface } from '@/components/chat/chat-interface';

/**
 * Main chat page
 * Protected by ChatLayout authentication check
 */
export default async function ChatPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const params = await searchParams;
  const initialPrompt = params.prompt || undefined;

  return <ChatInterface initialPrompt={initialPrompt} />;
}
