import { IsString } from "class-validator";

export class IBullLoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;
}
