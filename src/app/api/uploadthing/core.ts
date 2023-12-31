import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { OpenAIEmbeddings } from 'langchain/embeddings/openai'
import { PineconeStore } from 'langchain/vectorstores/pinecone'
import { getPineconeClient } from '@/lib/pinecone'



const f = createUploadthing();


const middleware = async () => {
  const { getUser } = getKindeServerSession()
  const user = getUser()

  if (!user || !user.id) throw new Error('Unauthorized')

  return { userId: user.id }
}

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  pdfUploader: f({ pdf: { maxFileSize: '4MB', maxFileCount: 1 } })
    .middleware(middleware)
    .onUploadComplete(async ({ metadata, file }) => {
      const createdFile = await db.file.create({
        data: {
          key: file.key,
          name: file.name,
          userId: metadata.userId,
          url: `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}` // jugaad
        }
      })

      try {
        const response = await fetch(
          `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}`
        )

        const blob = await response.blob()

        const loader = new PDFLoader(blob)

        const pageLevelDocs = await loader.load()

        const pagesAmt = pageLevelDocs.length

        // const { subscriptionPlan } = metadata
        // const { isSubscribed } = subscriptionPlan

        // const isProExceeded =
        //   pagesAmt >
        //   PLANS.find((plan) => plan.name === 'Pro')!.pagesPerPdf
        // const isFreeExceeded =
        //   pagesAmt >
        //   PLANS.find((plan) => plan.name === 'Free')!
        //     .pagesPerPdf

        // if (
        //   (isSubscribed && isProExceeded) ||
        //   (!isSubscribed && isFreeExceeded)
        // ) {
        //   await db.file.update({
        //     data: {
        //       uploadStatus: 'FAILED',
        //     },
        //     where: {
        //       id: createdFile.id,
        //     },
        //   })
        // }

        // vectorize and index entire document
        const pinecone = await getPineconeClient()
        const pineconeIndex = pinecone.Index(`${process.env.PINECONE_INDEX}`)

        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_API_KEY,
        })

        await PineconeStore.fromDocuments(
          pageLevelDocs,
          embeddings,
          {
            pineconeIndex,
            namespace: createdFile.id,
          }
        )

        await db.file.update({
          data: {
            uploadStatus: 'SUCCESS',
          },
          where: {
            id: createdFile.id,
          },
        })
      } catch (err) {
        console.log('err-: ',err)
        await db.file.update({
          data: {
            uploadStatus: 'FAILED',
          },
          where: {
            id: createdFile.id,
          },
        })
      }

    })


} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
