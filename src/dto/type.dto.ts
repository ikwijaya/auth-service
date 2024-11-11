import {
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IMatrixMenu } from './access.dto';

export class CreateTypeDto {
  @IsString({
    message: 'Kolom nama Peran tidak boleh kosong',
  })
  @MaxLength(50, {
    message: 'Kolom nama Peran tidak boleh lebih dari 50 karakter',
  })
  @MinLength(2, {
    message: 'Kolom nama Peran tidak boleh kurang dari 2 karakter',
  })
  name: string;

  @IsString()
  @IsOptional()
  flag: string;

  @IsString({
    message: 'Kolom tipe Peran tidak boleh kosong',
  })
  @IsOptional()
  mode: string;

  @IsString()
  @IsOptional()
  note: string;

  @IsInt({
    message: 'Kolom Group tidak boleh kosong',
  })
  @IsOptional()
  groupId: number | undefined;

  @ValidateNested()
  @Type(() => IMatrixMenu)
  @ArrayNotEmpty({ message: 'Daftar akses halaman harus di set' })
  forms: IMatrixMenu[];
}

export class UpdateTypeDto {
  @IsString({
    message: 'Kolom nama Peran tidak boleh kosong',
  })
  @MaxLength(50, {
    message: 'Kolom nama Peran tidak boleh lebih dari 50 karakter',
  })
  @MinLength(2, {
    message: 'Kolom nama Peran tidak boleh kurang dari 2 karakter',
  })
  name: string;

  @IsString()
  @IsOptional()
  flag: string;

  @IsString({
    message: 'Kolom tipe Peran tidak boleh kosong',
  })
  @IsOptional()
  mode: string;

  @IsString()
  @IsOptional()
  note: string;

  @IsInt({
    message: 'Kolom Group tidak boleh kosong',
  })
  @IsOptional()
  groupId: number | undefined;

  @ValidateNested()
  @Type(() => IMatrixMenu)
  forms: IMatrixMenu[];
}
