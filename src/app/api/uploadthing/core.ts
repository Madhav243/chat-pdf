import { db } from "@/db";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();


const middleware = async () => {
    const { getUser } = getKindeServerSession()
    const user = getUser()
  
    if (!user || !user.id) throw new Error('Unauthorized')
  
    return { userId: user.id }
  }

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    pdfUploader : f({ pdf : {maxFileSize : '4MB' , maxFileCount : 1}})
    .middleware(middleware).onUploadComplete(async ({metadata , file})=> {
      const createdFile = await db.file.create({
        data : {
          key : file.key,
          name : file.name,
          userId : metadata.userId,
          url : `https://uploadthing-prod.s3.us-west-2.amazonaws.com/${file.key}` // jugaad
        }
      })


    })
  
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
