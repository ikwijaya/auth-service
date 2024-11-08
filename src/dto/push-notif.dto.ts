import { IsObject, IsOptional, IsString } from 'class-validator';

export class PushNotifDto {
  @IsString()
  fromUser: string;

  @IsString()
  toUser: string;

  @IsString()
  message: string;

  @IsObject()
  @IsOptional()
  payload: unknown | undefined;
}
