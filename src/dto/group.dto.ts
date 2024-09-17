import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateGroupDto {
  @IsString({
    message: 'Kolom nama Group tidak boleh kosong',
  })
  name: string;

  @IsString()
  @IsOptional()
  note: string;

  @IsDate()
  @IsOptional()
  createdAt: Date;

  @IsInt()
  @IsOptional()
  createdBy: number;
}

export class UpdateGroupDto {
  @IsString({
    message: 'Kolom nama Group tidak boleh kosong',
  })
  name: string;

  @IsString()
  @IsOptional()
  note: string;

  @IsDate()
  @IsOptional()
  updatedAt: Date;

  @IsInt()
  @IsOptional()
  updatedBy: number;
}
