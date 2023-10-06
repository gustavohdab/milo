import { Expand, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { Document, Page, pdfjs } from 'react-pdf'
import { useResizeDetector } from 'react-resize-detector'
import SimpleBar from 'simplebar-react'

import { Button } from './ui/button'
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog'
import { useToast } from './ui/use-toast'

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

type PdfFullscreenProps = {
  fileUrl: string
}

const PdfFullscreen = ({ fileUrl }: PdfFullscreenProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const { toast } = useToast()
  const [numPages, setNumPages] = useState<number>(0)

  const { width, ref } = useResizeDetector()

  return (
    <Dialog
      open={isFullscreen}
      onOpenChange={(v) => {
        if (!v) setIsFullscreen(v)
      }}
    >
      <DialogTrigger asChild onClick={() => setIsFullscreen(true)}>
        <Button aria-label="fullscreen" className="gap-1.5" variant="ghost">
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-7xl">
        <SimpleBar autoHide={false} className="mt-6 max-h-[calc(100vh-10rem)]">
          <div ref={ref}>
            <Document
              className="max-h-full"
              file={fileUrl}
              loading={
                <div className="flex h-screen w-full items-center justify-center">
                  <Loader2 className="h-10 w-10 animate-spin text-zinc-300" />
                </div>
              }
              onLoadError={() => {
                toast({
                  title: 'Error',
                  description: 'Error loading PDF',
                  variant: 'destructive',
                })
              }}
              onLoadSuccess={({ numPages }) => setNumPages(numPages)}
            >
              {/* // there should have space between every page */}
              {Array.from(new Array(numPages), (_, i) => (
                <Page
                  key={`page_${i + 1}`}
                  pageNumber={i + 1}
                  width={width || 1}
                />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  )
}

export default PdfFullscreen
