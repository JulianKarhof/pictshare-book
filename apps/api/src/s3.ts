import { S3Client, type S3File } from "bun";

export class S3Service {
  private static _s3Client = new S3Client({
    region: process.env.S3_REGION!,
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    bucket: process.env.S3_BUCKET_NAME!,
    endpoint: process.env.S3_ENDPOINT!,
  });

  public static async uploadFile(
    file: File,
    key: string,
  ): Promise<{ file: S3File; key: string }> {
    const s3File: S3File = this._s3Client.file(key);

    await s3File.write(await file.arrayBuffer(), { type: file.type });

    return { file: s3File, key };
  }

  public static async deleteFile(key: string) {
    const s3File = this._s3Client.file(key);
    await s3File.delete();
  }
}
