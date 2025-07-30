import { Injectable } from "@nestjs/common";
import { UserService } from "./user.service";

@Injectable()
export class FactoryService {
  constructor(
    private readonly prefix1: string,
    private readonly prefix2: string,
    private readonly userService: UserService
  ) {}
}
