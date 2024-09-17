import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'Kolom nama User tidak boleh kosong',
  })
  username: string;

  @IsInt()
  @IsOptional()
  ldapId: number;

  @IsInt({
    message: 'Kolom nama Peran tidak boleh kosong',
  })
  typeId: number;

  @IsInt({
    message: 'Kolom nama Group tidak boleh kosong',
  })
  groupId: number;

  @IsString()
  @IsOptional()
  fullname: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  recordStatus: string;
}

export class UpdateUserDto {
  @IsString({
    message: 'Kolom nama User tidak boleh kosong',
  })
  username: string;

  @IsInt({
    message: 'Kolom nama Peran tidak boleh kosong',
  })
  typeId: number;

  @IsInt({
    message: 'Kolom nama Group tidak boleh kosong',
  })
  groupId: number;

  @IsString()
  @IsOptional()
  fullname: string;

  @IsString()
  @IsOptional()
  email: string;

  @IsString()
  recordStatus: string;
}

export class PageValidateDto {
  @IsString()
  path: string;
}
