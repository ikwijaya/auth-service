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

/**
 *
 * @param qs
 * @param _default is { createdAt: 'desc' }
 * @returns
 * { sort: 'desc', nulls: 'last' }
 */
export function useOrderBy(
  qs?: IQuerySearch & Record<string, any>,
  _default: Record<
    string,
    'asc' | 'desc' | { sort: 'asc' | 'desc'; nulls: 'last' | 'first' }
  > = { createdAt: { sort: 'desc', nulls: 'last' } }
): Record<
  string,
  'asc' | 'desc' | { sort: 'asc' | 'desc'; nulls: 'last' | 'first' }
> {
  let orderBy: Record<
    string,
    'asc' | 'desc' | { sort: 'asc' | 'desc'; nulls: 'last' | 'first' }
  > = {};

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
