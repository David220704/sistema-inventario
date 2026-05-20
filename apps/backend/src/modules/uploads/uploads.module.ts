import { Module } from "@nestjs/common";
import { UploadsController } from "./uploads.controller";

/**
 * UploadsModule
 * Handles file upload endpoints. Uses Multer via the FileInterceptor to process
 * multipart image uploads and stores them on the local filesystem.
 */
@Module({
  controllers: [UploadsController],
  providers: [],
})
export class UploadsModule {}
