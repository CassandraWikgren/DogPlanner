declare module "stream-buffers" {
  import { Writable } from "stream";

  export class WritableStreamBuffer extends Writable {
    constructor(options?: { initialSize?: number; incrementAmount?: number });
    getContents(): Buffer | null;
    getContentsAsString(encoding?: string): string | null;
  }
}
