export class ILogQMes {
  encryptionMode?: 'at-rest' | 'in-transit' | 'no' | 'both';
  encryptionKey?: string;
  serviceName?: string;
  action: string;
  json: Record<string, any>;
  message: string;
  createdAt?: Date;
  createdBy?: number | undefined | null;
  createdUsername?: string | undefined | null;
  roleId?: number | undefined | null;
  roleName?: string | undefined | null;
  device?: string;
  ipAddress?: string;

  constructor() {
    this.createdAt = new Date();
    this.serviceName = process.env.APP_NAME;
  }
}

export class INotifQMes {
  encryptionMode?: 'at-rest' | 'in-transit' | 'no' | 'both';
  encryptionKey?: string;
  serviceName?: string;
  action: string;
  json: Record<string, any>;
  message: string;
  url?: string;
  createdAt?: Date;
  createdBy: number | undefined | null;
  createdUsername: string | undefined | null;
  forUserId?: number | undefined | null;

  constructor() {
    this.createdAt = new Date();
    this.serviceName = process.env.APP_NAME;
  }
}

export class IAddQueue {
  flag: string;
  payload: ILogQMes | INotifQMes;
}
