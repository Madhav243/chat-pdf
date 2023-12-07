
'use client';

import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import { Document, Page, pdfjs } from 'react-pdf'
import { ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { useToast } from './ui/use-toast';
import { useResizeDetector } from 'react-resize-detector'
import { Button } from './ui/button';
import { Input } from './ui/input';
import { MutableRefObject, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'


pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.js`

interface PdfRendererProps {
    url: string
}

const PdfRenderer = ({ url }: PdfRendererProps) => {

    const [numPages, setNumPages] = useState<number>()
    const [currPage, setCurrPage] = useState<number>(1)
    const [scale, setScale] = useState<number>(1)
    const [rotation, setRotation] = useState<number>(0)
    const [renderedScale, setRenderedScale] = useState<
        number | null
    >(null)

    
    const CustomPageValidator = z.object({
        page : z.string().refine((num)=>Number(num) > 0 && Number(num) <= numPages!)
    })
     type TCustomPageValidator = z.infer<typeof CustomPageValidator>
    
    const {} = useForm<TCustomPageValidator>({
        defaultValues : {
            page : '1'
        },
        resolver : zodResolver(CustomPageValidator)
    });
    const { toast } = useToast();

    // Don't know what's happening but this was solution of width issue in github issues of library
    const [wrapperRef, setWrapperRef] = useState<
      MutableRefObject<HTMLElement> | undefined
    >(undefined);

    const refCallback = useCallback((node : any) => {
      setWrapperRef({ current: node });
    }, []);

    const { width } = useResizeDetector({
      targetRef: wrapperRef,
    });
    // const { width, ref } = useResizeDetector();



    return <>
        <div className='w-full bg-white rounded-md shadow flex flex-col items-center'>
            <div className='h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2'>
                <div className='flex items-center gap-1.5'>
                    <Button variant={'ghost'} aria-label='previous page'
                        disabled={currPage <= 1}
                        onClick={() => {
                            setCurrPage((prev) =>
                                prev - 1 > 1 ? prev - 1 : 1
                            )
                        }}
                    >
                        <ChevronDown className='h-4 w-4' />
                    </Button>
                    <div className='flex items-center gap-1.5'>
                        <Input className='w-12 h-8' />
                        <p className='text-zinc-700 text-sm space-x-1'>
                            <span>/</span>
                            <span>{numPages ?? 'x'}</span>
                        </p>
                    </div>
                    <Button
                        disabled={
                            numPages === undefined ||
                            currPage === numPages
                          }
                        variant='ghost'
                        aria-label='next page'
                        onClick={() => {
                            setCurrPage((prev) =>
                                prev + 1 > numPages! ? numPages! : prev + 1
                            )
                        }}
                    >
                        <ChevronUp className='h-4 w-4' />
                    </Button>
                </div>
            </div>
            <div className='flex-1 w-full max-h-screen'>
                <div ref={refCallback}>

                    <Document className='max-h-full' file={url}
                        loading={
                            <div className='flex justify-center'>
                                <Loader2 className='my-24 h-6 w-6 animate-spin' />
                            </div>
                        }
                        onLoadError={() => {
                            toast({
                                title: 'Error loading PDF',
                                description: 'Please try again later',
                                variant: 'destructive',
                            })
                        }}

                        onLoadSuccess={({ numPages }) =>
                            setNumPages(numPages)
                        }
                    >
                        <Page pageNumber={currPage} width={width ? width : 1}></Page>
                    </Document>
                </div>
            </div>
        </div>
    </>
}

export default PdfRenderer