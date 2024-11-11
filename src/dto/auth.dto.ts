import { IsInt, IsOptional, IsString } from 'class-validator';

export class ValidateGroupRes {
  @IsInt()
  group: any[];
}

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsInt()
  @IsOptional()
  groupId: number;

  @IsOptional()
  @IsString()
  device: string | undefined;

  @IsOptional()
  @IsString()
  ipAddress: string | undefined;

  @IsOptional()
  @IsString()
  fcmUrl: string | undefined;
}

export class LoginResDto {
  @IsString()
  accessToken: string;

  @IsOptional()
  expiresIn: string;

  @IsInt()
  groupId: number;
}

export class LogoutResDto {
  messages: string[];
}
