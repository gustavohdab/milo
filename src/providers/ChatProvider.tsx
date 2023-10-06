import { useMutation } from '@tanstack/react-query'
import { ChangeEvent, ReactNode, createContext, useRef, useState } from 'react'

import { trpc } from '@/app/(trpc)/client'
import { useToast } from '@/components/ui/use-toast'
import { INFINITE_QUERY_LIMIT } from '@/config/infinite-query'

type StreamResponse = {
  addMessage: () => void
  message: string
  handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
  isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
  message: '',
  isLoading: false,
  handleInputChange: () => {
    // This is a placeholder function that will be replaced when the ChatProvider is utilized
  },
  addMessage: () => {
    // This is a placeholder function that will be replaced when the ChatProvider is utilized,
  },
})

type ChatProviderProps = {
  fileId: string
  children: ReactNode
}

export const ChatProvider = ({ fileId, children }: ChatProviderProps) => {
  // NOTE - Controlled states
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // NOTE - TRPC has a built-in context provider that we can use to access the client
  const utils = trpc.useContext()

  const { toast } = useToast()

  const backupMessage = useRef<string>('')

  const { mutate: sendMessage } = useMutation({
    mutationFn: async ({ message }: { message: string }) => {
      const response = await fetch('/api/message', {
        method: 'POST',
        body: JSON.stringify({
          fileId,
          message,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      return response.body
    },
    // SECTION - Optimistic updates - *Obs: this message is not the controlled by state on this file, but the one on the ChatInput.tsx
    onMutate: async ({ message }) => {
      backupMessage.current = message
      setMessage('')

      // NOTE - Step 1: We want to cancel any outgoing messages
      await utils.getFileMessages.cancel()

      // NOTE - Step 2: We gonna snapshot the previous value
      const previousMessages = utils.getFileMessages.getInfiniteData()

      // NOTE - Step 3: Optimistically update the response to the UI
      utils.getFileMessages.setInfiniteData(
        {
          fileId,
          limit: INFINITE_QUERY_LIMIT,
        },
        (old) => {
          if (!old) {
            return {
              // NOTE - Those two are required from @TanStack/react-query fields to handle infinite queries
              pages: [],
              pageParams: [],
            }
          }

          // NOTE - Clone the previous data
          const newPages = [...old.pages]

          // NOTE - Get the last page
          const latestPage = newPages[0]

          // NOTE - Directly mutate the data
          latestPage.messages = [
            {
              createdAt: new Date().toISOString(),
              id: crypto.randomUUID(),
              text: message,
              isUserMessage: true,
            },
            // NOTE - Spread the previous messages
            ...latestPage.messages,
          ]

          // NOTE - Return the new data - Changing the data to the UI
          newPages[0] = latestPage

          return {
            ...old,
            pages: newPages,
          }
        },
      )

      // NOTE - Loading state after optimistic update
      setIsLoading(true)

      // NOTE - Step 4: Return the previous value - Using flatMap instead o map to flatten the array. We don't want to return an array of arrays but an array of messages.
      return {
        previousMessages: previousMessages?.pages.flatMap(
          (p) => p.messages ?? [],
        ),
      }
    },
    // SECTION - AI Optimistic updates
    onSuccess: async (stream) => {
      setIsLoading(false)

      if (!stream) {
        return toast({
          title: 'There was a problem sending this message',
          description: 'Please refresh this page and try again',
          variant: 'destructive',
        })
      }

      const reader = stream.getReader()
      const decoder = new TextDecoder()
      let done = false

      // accumulated response
      let accResponse = ''

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value)

        accResponse += chunkValue

        // append chunk to the actual message
        utils.getFileMessages.setInfiniteData(
          { fileId, limit: INFINITE_QUERY_LIMIT },
          (old) => {
            if (!old) return { pages: [], pageParams: [] }

            const isAiResponseCreated = old.pages.some((page) =>
              page.messages.some((message) => message.id === 'ai-response'),
            )

            const updatedPages = old.pages.map((page) => {
              if (page === old.pages[0]) {
                let updatedMessages

                if (!isAiResponseCreated) {
                  updatedMessages = [
                    {
                      createdAt: new Date().toISOString(),
                      id: 'ai-response',
                      text: accResponse,
                      isUserMessage: false,
                    },
                    ...page.messages,
                  ]
                } else {
                  updatedMessages = page.messages.map((message) => {
                    if (message.id === 'ai-response') {
                      return {
                        ...message,
                        text: accResponse,
                      }
                    }
                    return message
                  })
                }

                return {
                  ...page,
                  messages: updatedMessages,
                }
              }

              return page
            })

            return { ...old, pages: updatedPages }
          },
        )
      }
    },
    onError: (_, __, context) => {
      // NOTE - Step 5: If the mutation fails, we gonna revert the optimistic update
      setMessage(backupMessage.current)
      utils.getFileMessages.setData(
        { fileId },
        { messages: context?.previousMessages ?? [] },
      )
    },
    onSettled: async () => {
      setIsLoading(false)

      // NOTE - Step 6: Invalidate the query to refetch the data - So we always have the latest data
      await utils.getFileMessages.invalidate({ fileId })
    },
  })

  const addMessage = () => sendMessage({ message })

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  return (
    <ChatContext.Provider
      value={{
        addMessage,
        message,
        handleInputChange,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}
