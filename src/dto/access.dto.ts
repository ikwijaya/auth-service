import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class IRole {
  @IsString()
  roleName: string;

  @IsBoolean()
  roleValue: boolean;

  @IsString()
  roleAction: string;
}

export class IMatrixMenu {
  @IsNumber()
  id: number;

  @IsString()
  name: string;

  @IsNumber()
  @IsOptional()
  sort: number;

  @IsBoolean()
  @IsOptional()
  isReadOnly: boolean;

  @IsNumber()
  @IsOptional()
  parentId?: number | null;

  @ValidateNested()
  @Type(() => IRole)
  roles: IRole[];
}

export class CreateBulkAccessDto {
  @IsInt()
  typeId: number;

  @ValidateNested({ each: true })
  @Type(() => IMatrixMenu)
  items: IMatrixMenu[];
}
