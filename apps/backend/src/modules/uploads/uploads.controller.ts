import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";

/**
 * UploadsController
 * Handles file uploads (product images). Files are stored on disk under the
 * /uploads directory and served via static asset middleware at the /uploads path.
 */
@Controller("uploads")
export class UploadsController {
  /**
   * Uploads an image file via multipart/form-data. The file is saved to disk
   * with a unique timestamp-based filename.
   * @param file - Uploaded file (from Multer)
   * @returns Object containing the public URL path to the uploaded file
   */
  @Post()
  @UseInterceptors(
    FileInterceptor("image", {
      storage: diskStorage({
        destination: "./uploads",
        filename: (req: any, file: any, cb: any) => {
          const ext = path.extname(file.originalname) || ".jpg";
          const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
          cb(null, name);
        },
      }),
    }),
  )
  async upload(@UploadedFile() file: any) {
    const urlPath = `/uploads/${file.filename}`;
    return { path: urlPath };
  }
}
