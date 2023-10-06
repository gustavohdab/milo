'use client'

import { ArrowRight } from 'lucide-react'

import { Button } from './ui/button'

import { trpc } from '@/app/(trpc)/client'

const UpgradeButton = () => {
  const { mutate: createStripeSession } = trpc.createStripeSession.useMutation({
    onSuccess: ({ url }) => {
      window.location.href = url ?? '/dashboard/billing'
    },
  })

  return (
    <Button onClick={() => createStripeSession()} className="w-full">
      Upgrade now <ArrowRight className="ml-1.5 h-5 w-5" />
    </Button>
  )
}

export default UpgradeButton
