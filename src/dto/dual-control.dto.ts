import { IsInt, IsString } from 'class-validator';

export class DualControlDto {
  @IsInt()
  id: number;

  @IsString()
  changelog: string;
}
