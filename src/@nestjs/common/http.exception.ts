import { HttpStatus } from "./enum";

export class HttpException extends Error {
  constructor(private response: string | object, private status: HttpStatus) {
    super(JSON.stringify(response));
  }

  getResponse() {
    return this.response;
  }

  getStatus() {
    return this.status;
  }
}
