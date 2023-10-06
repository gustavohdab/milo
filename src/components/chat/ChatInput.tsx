import { Send } from 'lucide-react'
import { useContext, useRef } from 'react'

import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

import { ChatContext } from '@/providers/ChatProvider'

type ChatInputProps = {
  isDisabled?: boolean
}

const ChatInput = ({ isDisabled }: ChatInputProps) => {
  const { addMessage, handleInputChange, isLoading, message } =
    useContext(ChatContext)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  return (
    <div className="absolute bottom-0 left-0 w-full">
      <form
        className="mx-2 flex flex-row gap-3 md:mx-4 md:last:mb-6"
        onSubmit={(e) => {
          e.preventDefault()
          addMessage()
        }}
      >
        <div className="relative flex w-full flex-grow flex-col p-4">
          <div className="relative">
            <Textarea
              rows={1}
              maxRows={4}
              placeholder="Enter your question about the PDF..."
              autoFocus
              ref={textareaRef}
              onChange={handleInputChange}
              value={message}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  addMessage()

                  textareaRef.current?.focus()
                }
              }}
              className="scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch resize-none py-3 pr-12 text-base"
            />

            <Button
              aria-label="send message"
              className="absolute bottom-1.5 right-3"
              variant="ghost"
              disabled={isDisabled || isLoading}
              type="submit"
              onClick={() => {
                addMessage()

                textareaRef.current?.focus()
              }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default ChatInput
