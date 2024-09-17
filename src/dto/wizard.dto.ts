import { IsBoolean, IsInt, IsJSON, IsString, IsDate } from 'class-validator';

export class RunWizardDto {
  @IsString()
  token: string;
}

export class LdapWizardDto {
  @IsString({
    message: 'Kolom Password tidak boleh kosong',
  })
  password: string;

  @IsString({
    message: 'Kolom nama User tidak boleh kosong',
  })
  username: string;

  @IsInt()
  id: number;

  @IsBoolean()
  usePlain: boolean;
}

export class ExecWizardDto {
  @IsString()
  token: string;

  @IsJSON()
  json: LdapWizardDto;
}

export class ExecWizardResDto {
  @IsString()
  redirect: string;
}

export class RunWizardRes {
  @IsBoolean()
  success: boolean;

  @IsDate()
  expiresIn: Date;
}
