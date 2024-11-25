import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ConsentDto {
  @IsNumber()
  id: number;

  @IsOptional()
  changelog: string;
}

export class RefuseDto {
  @IsNumber()
  id: number;

  @IsString({ message: 'Changelog is not null' })
  changelog: string;
}
