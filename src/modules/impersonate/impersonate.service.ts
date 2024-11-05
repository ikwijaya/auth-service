import Service from "@/lib/service";
import Jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';
import { type IApiError } from '@/lib/errors';
import { type LoginResDto } from '@/dto/auth.dto';
import { IUserAccount, type IJwtVerify, IMessages } from '@/dto/common.dto';
import environment from '@/lib/environment';
import logger from '@/lib/logger';
import { ILogQMes } from '@/dto/queue.dto';


export default class ImpersonateService extends Service {

    /**
     *
     * @param auth
     * @param groupId
     * @returns
     */
    public async impersonate(auth: IUserAccount, groupId: number) {
        /// find group
        const group = await prisma.group.findFirst({ where: { id: groupId } }).catch(e => { throw e })
        if (!group) throw { rawErrors: ["Group tidak Kami temukan"] } as IApiError

        /// check user in another group here..
        const findRelated = await prisma.userGroup.findFirst({
            select: {
                userId: true,
                group: { select: { name: true } },
                type: { select: { name: true } },
            },
            where: {
                groupId: groupId,
                userId: auth.userId,
                recordStatus: 'A',
                actionCode: 'APPROVED'
            },
            orderBy: {
                checkedAt: 'desc',
            }
        }).catch(e => { throw e })
        if (!findRelated) throw { rawErrors: ["Anda tidak berhak meng-akses group tersebut (" + group.name + ")"] } as IApiError

        const token = Jwt.sign(
            {
                id: auth.userId,
                username: auth.username,
                fullname: auth.fullname,
                groupId: groupId,
                type: 'app-cms',
                method: 'impersonate'
            } as IJwtVerify,
            process.env.JWT_SECRET ?? new Date().toLocaleDateString(),
            { expiresIn: process.env.JWT_EXPIRE }
        );

        await this.relogin(auth, token).catch(e => { throw e });
        const payload: ILogQMes = {
            serviceName: ImpersonateService.name,
            action: 'switch-login',
            json: { username: auth.username, groupId: auth.groupId, type: auth.type, fullname: auth.fullname, related: findRelated },
            message: `${auth.fullname} is impersonate login from group ${auth.group?.name} to group ${findRelated.group?.name}`,
            createdAt: new Date(),
            createdBy: auth.userId,
            createdUsername: auth.username,
            roleId: auth.typeId,
            roleName: auth.type?.name,
            device: auth.device,
            ipAddress: auth.ipAddress
        }

        this.addLog([{ flag: `${ImpersonateService.name}`, payload }])
        return {
            accessToken: token,
            expiresIn: process.env.JWT_EXPIRE,
            groupId: groupId
        } as LoginResDto;
    }

    /**
     *
     * @param auth
     */
    public async groups(auth: IUserAccount) {
        /**
         * handle when user status is waiting for approval
         * thats means this user has assign to some group before
         * and this user has waiting for new group after
         */
        const findUserGroup: { id: number }[] = await prisma.$queryRaw`
            SELECT  a."id"
            FROM    "UserGroup" as a
            INNER JOIN (
            SELECT  MAX(b."checkedAt") as "maxdate", b."userId", b."groupId"
            FROM    "UserGroup" as b
            WHERE   b."actionCode" = 'APPROVED' AND b."recordStatus" = 'A'
            GROUP BY b."userId", b."groupId"
            ) as ib ON a."userId" = ib."userId" AND a."groupId" = ib."groupId" AND a."checkedAt" = ib."maxdate"
            WHERE   a."recordStatus" = 'A' AND a."actionCode" = 'APPROVED';
        `

        const userGroup = await prisma.userGroup.findMany({
            select: {
                userId: true,
                groupId: true,
                typeId: true,
                user: { select: { username: true, fullname: true, email: true } },
                group: { select: { name: true } },
                type: { select: { name: true, mode: true, flag: true } },
            },
            where: { id: { in: findUserGroup.map(e => e.id) }, userId: auth.userId }
        }).catch(e => { throw e })

        const gIds = userGroup.map(e => e.groupId).filter(this.notEmpty)
        const groups = await prisma.group.findMany({
            select: { id: true, name: true },
            where: {
                id: { in: gIds }
            }
        }).catch(e => { throw e })

        const payload: ILogQMes = {
            serviceName: ImpersonateService.name,
            action: 'groups',
            json: { username: auth.username, groupId: auth.groupId, type: auth.type, fullname: auth.fullname, matchGroupIds: gIds, groups },
            message: `${auth.fullname} is inquiry groups`,
            createdAt: new Date(),
            createdBy: auth.userId,
            createdUsername: auth.username,
            roleId: auth.typeId,
            roleName: auth.type?.name,
            device: auth.device,
            ipAddress: auth.ipAddress
        }

        this.addLog([{ flag: `${ImpersonateService.name}`, payload }])
        return { messages: [], payload: { groups: Array.from(new Set(groups)) } } as IMessages
    }

    /**
     *
     * @param auth
     */
    private async relogin(auth: IUserAccount, token: string) {
        return await prisma.$transaction(async (tx) => {
            if (environment.isProd()) {
                logger.info(
                    `Multiple session is disable, cause env is ${environment.env}`
                );
                const lastSessions = await tx.session
                    .findMany({ where: { userId: auth.userId, recordStatus: 'A' } })
                    .catch((e) => {
                        throw e;
                    });
                await tx.session
                    .updateMany({
                        data: {
                            recordStatus: 'N',
                            updatedAt: new Date(),
                            updatedBy: auth.userId,
                        },
                        where: {
                            id: { in: lastSessions.map((e) => e.id) },
                        },
                    })
                    .catch((e) => {
                        throw e;
                    });
            } else
                logger.info(
                    `Multiple session is enable, cause env is ${environment.env}`
                );

            /**
             * handle create new session
             */
            await tx.session.create({
                data: {
                    createdBy: auth.userId,
                    createdAt: new Date(),
                    token,
                    type: 'app-cms',
                    userId: auth.userId,
                },
            });
        })
    }
}
