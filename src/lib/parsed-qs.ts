import logger from './logger';
import { type IQuerySearch } from '@/dto/common.dto';

/**
 *
 * @param qs
 * @returns
 */
export function useQsParse(qs: IQuerySearch) {
  return Object.keys(qs)
    .filter((key) => qs[key])
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(qs[k]))
    .join('&');
}

/**
 *
 * @param qs
 * @returns
 */
export function createOrderBy(
  qs: any,
  d: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
): Record<string, 'asc' | 'desc'> {
  let orderBy: Record<string, 'asc' | 'desc'> = {};
  const sortBy = qs?.sortBy?.split(',');
  const sortOrder = qs?.sortOrder?.split(',');

  if (Array.isArray(sortBy) && Array.isArray(sortOrder))
    orderBy = sortBy.reduce(
      (acc, field, index) => ({
        ...acc,
        [field]: sortOrder[index] as 'asc' | 'desc',
      }),
      {}
    );
  else if (sortBy && sortOrder)
    orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };
  else orderBy = d;

  logger.info(`orderBy: `, orderBy);
  return orderBy;
}
