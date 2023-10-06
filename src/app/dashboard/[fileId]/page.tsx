import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation'

import PdfRenderer from '@/components/PdfRenderer '
import ChatWrapper from '@/components/chat/ChatWrapper'
import { db } from '@/db'

type FileIdPageProps = {
  params: {
    fileId: string
  }
}

const FileIdPage = async ({ params }: FileIdPageProps) => {
  const { fileId } = params

  const { getUser } = getKindeServerSession()

  const user = getUser()

  if (!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileId}`)

  const file = await db.file.findFirst({
    where: {
      id: fileId,
      userId: user.id,
    },
  })

  // NOTE - notFound() redirects to 404 nextjs page
  if (!file) notFound()

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-1 flex-col justify-between">
      <div className="mx-auto w-full max-w-[90rem] grow lg:flex xl:px-2">
        {/* NOTE - file content */}
        <div className="flex-1 xl:flex">
          <div className="px-4 py-6 sm:px-6 lg:pl-8 xl:flex-1 xl:pl-6">
            <PdfRenderer url={file.url} />
          </div>
        </div>

        <div className="flex-[0.75] shrink-0 border-t border-gray-200 lg:w-96 lg:border-l lg:border-t-0">
          <ChatWrapper fileId={fileId} />
        </div>
      </div>
    </div>
  )
}

export default FileIdPage
