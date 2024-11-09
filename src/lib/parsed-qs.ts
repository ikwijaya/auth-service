import logger from './logger';
import { type IQuerySearch } from '@/dto/common.dto';

/**
 *
 * @param qs
 * @returns
 */
export function useQsParse(qs: IQuerySearch & Record<string, any>) {
  return Object.keys(qs)
    .filter((key) => qs[key])
    .map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(qs[k]))
    .join('&');
}

interface OrderByField {
  sort: 'asc' | 'desc';
  nulls: 'last' | 'first';
}
type OrderByValue = 'asc' | 'desc' | OrderByField;
export type OrderBy = Record<string, OrderByValue>;

/**
 *
 * @param qs
 * @param _default is { createdAt: 'desc' } or { updatedAt: { sort: 'desc', nulls: 'last' } }
 * @returns
 */
export function useOrderBy(
  qs?: IQuerySearch & Record<string, any>,
  _default: OrderBy = { createdAt: { sort: 'desc', nulls: 'last' } }
): OrderBy {
  let orderBy: OrderBy = {};
  const sortBy = qs?.sortBy?.split(',');
  const sortOrder = qs?.sortOrder?.split(',');

  // Case where sortBy and sortOrder are both arrays
  if (Array.isArray(sortBy) && Array.isArray(sortOrder)) {
    orderBy = sortBy.reduce((acc, field, index) => {
      acc[field] = sortOrder[index] as 'asc' | 'desc';
      return acc;
    }, {});
  }
  // Case where sortBy is a single string, not an array
  else if (typeof sortBy === 'string' && typeof sortOrder === 'string') {
    orderBy = { [sortBy]: sortOrder as 'asc' | 'desc' };
  }
  // Default to the fallback order `d`
  else {
    orderBy = _default;
  }

  logger.info(`useOrderBy: `, orderBy);
  return orderBy;
}
