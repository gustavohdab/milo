'use client'

import { Loader2 } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { trpc } from '../(trpc)/client'

const AuthCallbackPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const origin = searchParams.get('origin')

  trpc.authCallback.useQuery(undefined, {
    onSuccess: ({ success }) => {
      if (success) {
        // NOTE - User is synced to db
        router.push(origin ? `${origin}` : '/dashboard')
      }
    },
    onError: (err) => {
      if (err.data?.code === 'UNAUTHORIZED') {
        // NOTE - User is not synced to db
        router.push(`/sign-in}`)
      }
    },
    retry: true,
    retryDelay: 1000,
  })

  return (
    <div className="mt-24 flex w-full justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-10 w-10 animate-spin text-zinc-800" />
        <h3 className="text-left font-semibold">
          Setting up your account, please wait
        </h3>
        <p>
          You will be redirected to{' '}
          <span className="font-semibold">{origin}</span> once your account is
          ready.
        </p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
