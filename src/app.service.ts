import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getAllList() {
    return [1, 2, 3];
  }
}
