import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Company logo upload
  companyLogo: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      if (session.user.role !== "COMPANY") {
        throw new Error("Only companies can upload logos");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Company logo upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Update company logo in database
      const company = await db.companyProfile.findUnique({
        where: { userId: metadata.userId }
      });

      if (company) {
        await db.companyProfile.update({
          where: { id: company.id },
          data: { logo: file.url }
        });
      }

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Company banner upload
  companyBanner: f({ image: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      if (session.user.role !== "COMPANY") {
        throw new Error("Only companies can upload banners");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Company banner upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      // Update company banner in database
      const company = await db.companyProfile.findUnique({
        where: { userId: metadata.userId }
      });

      if (company) {
        await db.companyProfile.update({
          where: { id: company.id },
          data: { banner: file.url }
        });
      }

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Product images upload
  productImages: f({ image: { maxFileSize: "4MB", maxFileCount: 5 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      if (session.user.role !== "COMPANY") {
        throw new Error("Only companies can upload product images");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Product image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  // Project images upload
  projectImages: f({ image: { maxFileSize: "8MB", maxFileCount: 10 } })
    .middleware(async ({ req }) => {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        throw new Error("Unauthorized");
      }

      if (session.user.role !== "COMPANY") {
        throw new Error("Only companies can upload project images");
      }

      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Project image upload complete for userId:", metadata.userId);
      console.log("File URL:", file.url);

      return { uploadedBy: metadata.userId, url: file.url };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;