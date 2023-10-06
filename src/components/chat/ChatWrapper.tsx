'use client'

import { ChevronLeft, Loader2, XCircle } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '../ui/button'

import ChatInput from './ChatInput'
import Messages from './Messages'

import { trpc } from '@/app/(trpc)/client'
import { ChatProvider } from '@/providers/ChatProvider'

type ChatWrapperProps = {
  fileId: string
}

const ChatWrapper = ({ fileId }: ChatWrapperProps) => {
  const { data: fileStatus, isLoading } = trpc.getFileUploadStatus.useQuery(
    { fileId },
    {
      refetchInterval(data) {
        return data?.status === 'FINISHED' || data?.status === 'FAILED'
          ? false
          : 1000
      },
    },
  )

  if (isLoading)
    return (
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <h3 className="text-xl font-semibold">Loading...</h3>
            <p className="text-sm text-zinc-500">
              We&apos;re preparing your PDF.
            </p>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )

  if (fileStatus?.status === 'PROCESSING') {
    ;<div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
      <div className="mb-28 flex flex-1 flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <h3 className="text-xl font-semibold">Processing PDF...</h3>
          <p className="text-sm text-zinc-500">
            This won&apos;t take long, we promise.
          </p>
        </div>
      </div>

      <ChatInput isDisabled />
    </div>
  }

  if (fileStatus?.status === 'FAILED') {
    return (
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-12 w-12 text-red-500" />

            <h3 className="text-xl font-semibold">Too many pages in PDF</h3>
            <p className="text-sm text-zinc-500">
              Your <span className="font-medium">Free</span> plan supports only
              up to 5 pages per PDF.
            </p>
            <Link
              href="/dashboard"
              className={buttonVariants({
                variant: 'secondary',
              })}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </div>
        </div>

        <ChatInput isDisabled />
      </div>
    )
  }

  return (
    <ChatProvider fileId={fileId}>
      <div className="relative flex min-h-full flex-col justify-between gap-2 divide-y divide-zinc-200 bg-zinc-50">
        <div className="mb-28 flex flex-1 flex-col justify-between">
          <Messages fileId={fileId} />
        </div>

        <ChatInput />
      </div>
    </ChatProvider>
  )
}

export default ChatWrapper
