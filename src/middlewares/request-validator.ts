import { type ClassConstructor, plainToInstance } from 'class-transformer';
import {
  type ValidationError,
  type ValidatorOptions,
  validate,
} from 'class-validator';
import { type Request, type Response, type NextFunction } from 'express';
import { HttpBadRequestError } from '@/lib/errors';
import logger from '@/lib/logger';
import { REQVAL_FAIL_00 } from '@/utils/constants';

export default class RequestValidator {
  static validate = <T>(classInstance: ClassConstructor<T>) => {
    return async (req: Request, _res: Response, next: NextFunction) => {
      const validationErrorText = REQVAL_FAIL_00;
      try {
        const convertedObject = plainToInstance(classInstance, req.body);
        const errors = await validate(
          convertedObject as Record<string, unknown>,
          { whitelist: true } as ValidatorOptions
        ).catch((e) => {
          throw e;
        });

        /// validate
        if (!errors.length) {
          req.body = convertedObject;
          next();
        } else {
          const rawErrors: string[] = getAllConstraintKeys(errors);
          logger.error(rawErrors);
          next(new HttpBadRequestError(validationErrorText, rawErrors));
        }
      } catch (e) {
        logger.error(e);
        next(new HttpBadRequestError(validationErrorText, [e.message]));
      }
    };
  };
}

/**
 *
 * @param jsonObject
 * @returns
 */
function getAllConstraintKeys(jsonObject: ValidationError[]): string[] {
  let keys: string[] = [];

  function traverse(obj: ValidationError[]) {
    obj.forEach((item) => {
      if (item.constraints) {
        for (const key in item.constraints) {
          if (Object.prototype.hasOwnProperty.call(item.constraints, key)) {
            const msg = `${item.constraints[key]}`;
            keys = keys.concat(msg);
          }
        }
      }
      if (item.children && item.children.length > 0) traverse(item.children);
    });
  }

  traverse(jsonObject);
  keys = [...new Set(keys)];

  return keys;
}
