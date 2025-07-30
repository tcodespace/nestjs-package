import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService {
  constructor(private readonly prefix: string) {}
}
