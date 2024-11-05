import { type EmailResponderDto } from '@/dto/checker.dto';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type ILogQMes } from '@/dto/queue.dto';
import { type IApiError } from '@/lib/errors';
import Service from '@/lib/service';

export default class DualControlService extends Service {
  /**
   *
   * @param auth
   * @param formId
   * @returns
   */
  public async checker(auth: IUserAccount, formId: number) {
    if (!auth.groupId)
      return {
        rawErrors: ['User without group cannot have the user as checker'],
      } as IApiError;

    const users = this.findChecker(formId, auth.groupId).catch((e) => {
      throw e;
    });
    const payload: ILogQMes = {
      serviceName: DualControlService.name,
      action: 'checker',
      json: { users },
      message: `${auth.fullname} is inquiry checker`,
      createdAt: new Date(),
      createdBy: auth.userId,
      createdUsername: auth.username,
      roleId: auth.typeId,
      roleName: auth.type?.name,
      device: auth.device,
      ipAddress: auth.ipAddress,
    };

    this.addLog([{ flag: DualControlService.name, payload }]);
    return { messages: [], payload: { users } } as IMessages;
  }

  /**
   *
   * @param auth
   * @param formIds
   * @returns
   */
  public async emailResponder(auth: IUserAccount, obj: EmailResponderDto) {
    if (!auth.groupId)
      return {
        rawErrors: ['User without group cannot have the email as responder'],
      } as IApiError;

    const users = this.findEmailResponder(obj.pageIds).catch((e) => {
      throw e;
    });
    const payload: ILogQMes = {
      serviceName: DualControlService.name,
      action: 'email-responder',
      json: { users },
      message: `${auth.fullname} is inquiry email-responder`,
      createdAt: new Date(),
      createdBy: auth.userId,
      createdUsername: auth.username,
      roleId: auth.typeId,
      roleName: auth.type?.name,
      device: auth.device,
      ipAddress: auth.ipAddress,
    };

    this.addLog([{ flag: DualControlService.name, payload }]);
    return { messages: [], payload: { users } } as IMessages;
  }
}
