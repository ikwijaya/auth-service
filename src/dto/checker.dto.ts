import { IsArray } from 'class-validator';

export class EmailResponderDto {
  @IsArray({ message: "Please set the pageIds, value is typeof array" })
  pageIds: number[];
}
