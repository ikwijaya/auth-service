import { type RawAxiosRequestHeaders, type AxiosHeaders } from 'axios';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export interface IUserAccount {
  id: number;
  userId: number;
  token: string;
  formId?: number;
  username: string;
  fullname?: string | null;
  email?: string | null;
  ldapId: number | null;
  typeId?: number;
  groupId?: number;
  group?: {
    name: string;
  };
  type?: {
    name: string;
    flag: string | null;
    mode: string | null;
  };
  device?: string | undefined;
  ipAddress?: string | undefined;
  logAction?: string;
}

export interface IUserMatrix {
  is_create?: boolean;
  is_read?: boolean;
  is_update?: boolean;
  is_delete?: boolean;
  is_upload?: boolean;
  is_download?: boolean;
}

export class MatrixValidatorDto {
  @IsBoolean()
  is_create?: boolean;

  @IsBoolean()
  is_read?: boolean;

  @IsBoolean()
  is_update?: boolean;

  @IsBoolean()
  is_delete?: boolean;

  @IsBoolean()
  is_upload?: boolean;

  @IsBoolean()
  is_download?: boolean;
}

export interface IPagination {
  page: number;
  pageSize: number;
  totalRows?: number;
  totalPage?: number;
  currentPage?: number;
}

export interface IDataWithPagination {
  items: unknown[];
  matrix?: IUserMatrix;
  pagination?: IPagination;
}

export interface IMessages {
  messages: string[];
  payload?: Record<string, any>;
}

export interface IJwtVerify {
  id: number;
  username: string;
  email?: string | null | undefined;
  fullname?: string | null | undefined;
  type: string;
  method: 'original' | 'impersonate';
  privilegeName?: string;
  privilegeMode?: string;
  groupId: number;
  device?: string | undefined;
  ipAddress?: string | undefined;
  exp?: number;
  iat?: number;
}

export interface IJwtCommunicator extends IJwtVerify {
  userMatrix: IUserMatrix;
}

export interface IPrismaPagination {
  take: number;
  skip: number;
  totalRows: number;
  totalPages: number;
  currentPage: number;
}

export interface ICalendarEvent {
  id: number;
  title: string;
  date: Date;
  reason?: string;
  leave: ILeaveData;
}

export interface ILeaveData {
  id: number;
  startDate: Date;
  endDate: Date;
  userId: number;
  user: {
    username: string | null;
    fullname: string | null;
    type: {
      name: string;
    } | null;
  } | null;
  caretaker: {
    username: string | null;
    fullname: string | null;
  } | null;
  reason: string;
  color?: string;
  is_update: boolean | undefined;
  createdAt: Date;
  updatedAt?: Date | null;
  createdUser: {
    username: string | null;
  } | null;
  updatedUser: {
    username: string | null;
  } | null;
}

export interface IDownloadDateRange {
  startDate: Date;
  endDate: Date;
}

export interface IQuerySearch {
  startDate?: string | undefined;
  endDate?: string | undefined;
  keyword?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: string | undefined;
}

class Ids {
  @IsNumber()
  id: number;

  @IsString()
  model: string;
}

export class ApproveDto {
  @ValidateNested()
  @Type(() => Ids)
  ids: Ids[];

  @IsString({
    message: 'Aksi tidak boleh kosong',
  })
  @IsOptional()
  actionCode: string;

  @IsString()
  @IsOptional()
  actionNote: string;
}

export class RejectDto {
  @ValidateNested()
  @Type(() => Ids)
  ids: Ids[];

  @IsString({
    message: 'Aksi tidak boleh kosong',
  })
  @IsOptional()
  actionCode: string;

  @IsString({
    message: 'Kolom alasan tidak boleh kosong',
  })
  actionNote: string;
}

export interface IWorkerApi {
  method: string | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body: unknown;
  headers: RawAxiosRequestHeaders | AxiosHeaders;
}

export interface ITierLimit {
  id: number;
  maxLimit: number;
}
