import { PrismaClient, Prisma as PrismaTypes } from "@prisma/client";
import { Prisma } from "@prisma/client/extension";
import { S3Service } from "./s3";

const imageDeleteExtension = Prisma.defineExtension({
  name: "imageDeleteExtension",
  query: {
    imageAsset: {
      async delete({ args, query }) {
        const imageAsset = await prisma.imageAsset.findUnique({
          where: args.where as PrismaTypes.ImageAssetWhereUniqueInput,
        });

        const result = await query(args);

        if (imageAsset) {
          try {
            await S3Service.deleteFile(imageAsset.key);
          } catch (error) {
            console.error("Failed to delete from S3:", error);
          }
        }

        return result;
      },
    },
  },
});

const prisma = new PrismaClient({
  omit: {
    element: {
      projectId: true,
    },
  },
}).$extends(imageDeleteExtension);

export default prisma;
