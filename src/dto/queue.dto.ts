
export class ILogQMes {
    serviceName?: string;
    action: string;
    json: Record<string, any>;
    message: string;
    createdAt?: Date;
    createdBy?: number | undefined | null;
    createdUsername?: string | undefined | null;
    roleId?: number | undefined | null;
    roleName?: string | undefined | null;

    constructor () {
        this.createdAt = new Date()
        this.serviceName = process.env.APP_NAME
    }
}

export class INotifQMes {
    serviceName?: string;
    action: string;
    json: Record<string, any>;
    message: string;
    url?: string;
    createdAt?: Date;
    createdBy: number | undefined | null;
    createdUsername: string | undefined | null;
    forUserId?: bigint;

    constructor () {
        this.createdAt = new Date()
        this.serviceName = process.env.APP_NAME
    }
}