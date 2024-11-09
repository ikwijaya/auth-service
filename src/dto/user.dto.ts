import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsString, ValidateNested } from 'class-validator';

export class PageValidateDto {
  @IsString()
  path: string;
}

export class UserGroupDto {
  @IsInt({ message: 'Silakan pilih Group' })
  groupId: number;

  @IsInt({ message: 'Silakan pilih Peran' })
  typeId: number;

  @IsBoolean()
  isDefault: boolean;

  @IsString({
    message: 'Aksi column tidak Kami temukan. ex: CREATE, DELETE, UPDATE',
  })
  rowAction: 'CREATE' | 'DELETE' | 'UPDATE';
}

export class CreateUserDto {
  @IsString({ message: 'Silakan isi Username' })
  username: string;

  @ValidateNested({ message: 'User group tidak di set', each: true })
  @Type(() => UserGroupDto)
  userGroups: UserGroupDto[];
}

export class UpdateUserDto {
  @ValidateNested({ message: 'User group tidak di set', each: true })
  @Type(() => UserGroupDto)
  userGroups: UserGroupDto[];
}
