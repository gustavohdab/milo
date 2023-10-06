import { useIntersection } from '@mantine/hooks'
import { Loader2, MessageSquare } from 'lucide-react'
import { useContext, useEffect, useRef } from 'react'
import Skeleton from 'react-loading-skeleton'

import Message from './Message'

import { trpc } from '@/app/(trpc)/client'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'
import { ChatContext } from '@/providers/ChatProvider'

type MessagesProps = {
  fileId: string
}

const Messages = ({ fileId }: MessagesProps) => {
  const { isLoading: isAiThinking } = useContext(ChatContext)
  const {
    data: fileMessages,
    isLoading,
    fetchNextPage,
  } = trpc.getFileMessages.useInfiniteQuery(
    {
      fileId,
      limit: INFINITE_QUERY_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => lastPage?.nextCursor,
      keepPreviousData: true,
    },
  )

  const messages = fileMessages?.pages.flatMap((page) => page.messages) ?? []

  const LoadingMessage = {
    createdAt: new Date().toISOString(),
    id: 'loading-message',
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      </span>
    ),
    isUserMessage: false,
  }

  const combinedMessages = [
    ...(isAiThinking ? [LoadingMessage] : []),
    ...(messages ?? []),
  ]

  const lastMessageRef = useRef<HTMLDivElement>(null)

  const { ref, entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 0.5,
  })

  useEffect(() => {
    if (entry?.isIntersecting) {
      fetchNextPage()
    }
  }, [entry, fetchNextPage])

  return (
    <div className="scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch flex max-h-[calc(100vh-3.5rem-7rem)] flex-1 flex-col-reverse gap-4 overflow-y-auto border-zinc-200 p-3">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, i) => {
          const isNextMessageSamePerson =
            combinedMessages[i - 1]?.isUserMessage ===
            combinedMessages[i]?.isUserMessage

          if (i === combinedMessages.length - 1) {
            return (
              <Message
                ref={ref}
                key={message.id}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
              />
            )
          } else {
            return (
              <Message
                key={message.id}
                message={message}
                isNextMessageSamePerson={isNextMessageSamePerson}
              />
            )
          }
        })
      ) : isLoading ? (
        <div className="flex w-full flex-col gap-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          <h3 className="text-xl font-semibold">You&apos;re all caught up!</h3>
          <p className="to-zinc-500 text-sm">
            Ask your first question about the PDF.
          </p>
        </div>
      )}
    </div>
  )
}

export default Messages
