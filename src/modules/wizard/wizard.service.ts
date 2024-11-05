import prisma from '@/lib/prisma';
import { type IApiError } from '@/lib/errors';
import {
  type ExecWizardDto,
  type RunWizardDto,
  type LdapWizardDto,
  type RunWizardRes,
} from '@/dto/wizard.dto';
import { type IMessages } from '@/dto/common.dto';
import Service from '@/lib/service';
import { type ILogQMes } from '@/dto/queue.dto';

interface LdapWizardRes {
  id: number;
  dc: string;
  url: string;
}

export default class WizardService extends Service {
  /**
   *
   * @param obj
   * @returns
   */
  public async run(obj: RunWizardDto): Promise<RunWizardRes> {
    const wizard: null | Record<string, any> = await prisma.wizard
      .findFirst({
        select: {
          id: true,
          expiresIn: true,
        },
        where: {
          token: obj.token,
          recordStatus: 'A',
          hasExecuted: false,
          expiresIn: { gte: new Date() },
        },
      })
      .catch((e) => {
        throw e;
      });

    if (!wizard) throw { rawErrors: ['not authenticated'] } as IApiError;
    else return { success: true, expiresIn: wizard.expiresIn } as RunWizardRes;
  }

  /**
   *
   * @param obj
   */
  public async support(obj: RunWizardDto): Promise<{ ldaps: LdapWizardRes[] }> {
    const wizard: null | Record<string, any> = await prisma.wizard
      .findFirst({
        select: {
          id: true,
          expiresIn: true,
        },
        where: {
          token: obj.token,
          recordStatus: 'A',
          hasExecuted: false,
          expiresIn: { gte: new Date() },
        },
      })
      .catch((e) => {
        throw e;
      });

    if (!wizard) throw { rawErrors: ['not authenticated'] } as IApiError;
    else {
      const ldap: LdapWizardRes[] = await prisma.ldap
        .findMany({
          select: {
            id: true,
            dc: true,
            url: true,
            usePlain: true,
            username: true,
          },
        })
        .catch((e) => {
          throw e;
        });

      return { ldaps: ldap };
    }
  }

  /**
   *
   * @param obj
   */
  public async execute(obj: ExecWizardDto): Promise<IApiError | IMessages> {
    const wizard: null | Record<string, any> = await prisma.wizard
      .findFirst({
        select: {
          id: true,
          expiresIn: true,
        },
        where: {
          token: obj.token,
          recordStatus: 'A',
          hasExecuted: false,
          expiresIn: { gte: new Date() },
        },
      })
      .catch((e) => {
        throw e;
      });

    if (!wizard)
      throw { rawErrors: ['not authenticated or expired'] } as IApiError;
    else {
      const str: string = obj.json as unknown as string;
      const json: LdapWizardDto = JSON.parse(str);
      await prisma
        .$transaction(async (tx) => {
          const date = new Date();
          await tx.ldap.update({
            data: {
              updatedAt: new Date(),
              note: `updated by wizard with token is ${obj.token} at ${date}` as string & {
                _kind?: 'MyString';
              },
              password: json.password,
              username: json.username,
              usePlain: json.usePlain,
            },
            where: { id: json.id },
          });

          await tx.wizard.update({
            data: {
              updatedAt: new Date(),
              json: JSON.stringify(json),
              hasExecuted: true,
            },
            where: { id: wizard.id, token: obj.token },
          });

          const payload: ILogQMes = {
            serviceName: WizardService.name,
            action: 'sys-execute',
            json: {
              token: obj.token,
              json: { id: obj.json.id, username: obj.json.username },
            },
            message: 'wizard is processed for change identity of ldap auth',
          };

          this.addLog([{ flag: WizardService.name, payload }]);
        })
        .catch((e) => {
          throw e;
        });

      // @typescript-eslint/consistent-type-assertions
      return { messages: ['Success'] } as IMessages;
    }
  }
}
