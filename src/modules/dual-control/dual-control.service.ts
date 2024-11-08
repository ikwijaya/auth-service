import { HttpStatusCode } from 'axios';
import { type EmailResponderDto } from '@/dto/checker.dto';
import { type IMessages, type IUserAccount } from '@/dto/common.dto';
import { type ILogQMes } from '@/dto/queue.dto';
import { setError } from '@/lib/errors';
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
      throw setError(
        HttpStatusCode.InternalServerError,
        'User without group cannot have the user as checker'
      );

    const users = this.findChecker(formId, auth.groupId).catch((e) => {
      throw e;
    });
    const payload: ILogQMes = {
      serviceName: DualControlService.name,
      action: 'checker',
      json: { users },
      message: `${auth.fullname ?? auth.username} is inquiry checker`,
      createdAt: new Date(),
      createdBy: auth.userId,
      createdUsername: auth.username,
      roleId: auth.typeId,
      roleName: auth.type?.name,
      device: auth.device,
      ipAddress: auth.ipAddress,
    };

    void this.addLog([{ flag: DualControlService.name, payload }]);
    return { messages: [], payload: { users } } satisfies IMessages;
  }

  /**
   *
   * @param auth
   * @param formIds
   * @returns
   */
  public async emailResponder(auth: IUserAccount, obj: EmailResponderDto) {
    if (!auth.groupId)
      throw setError(
        HttpStatusCode.InternalServerError,
        'User without group cannot have the email as responder'
      );

    const users = this.findEmailResponder(obj.pageIds).catch((e) => {
      throw e;
    });
    const payload: ILogQMes = {
      serviceName: DualControlService.name,
      action: 'email-responder',
      json: { users },
      message: `${auth.fullname ?? auth.username} is inquiry email-responder`,
      createdAt: new Date(),
      createdBy: auth.userId,
      createdUsername: auth.username,
      roleId: auth.typeId,
      roleName: auth.type?.name,
      device: auth.device,
      ipAddress: auth.ipAddress,
    };

    void this.addLog([{ flag: DualControlService.name, payload }]);
    return { messages: [], payload: { users } } satisfies IMessages;
  }
}
