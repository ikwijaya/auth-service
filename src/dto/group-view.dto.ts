import { IsInt } from 'class-validator';

export class CreateGViewDto {
  @IsInt({
    message: 'Kolom grup tidak boleh kosong',
  })
  groupId: number;
}
