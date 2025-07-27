import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  // Company logo uploader
  companyLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'COMPANY') {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Company logo upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),

  // Company banner uploader
  companyBanner: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'COMPANY') {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Company banner upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),

  // Project images uploader
  projectImages: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'COMPANY') {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Project images upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),

  // Product images uploader
  productImages: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'COMPANY') {
        throw new Error("Unauthorized");
      }
      
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product images upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);
      
      return { uploadedBy: metadata.userId };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;