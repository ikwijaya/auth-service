import { type IPrismaPagination } from '@/dto/common.dto';

const createPagination = (
  page: number = 1,
  pageSize: number = 25,
  totalRows: number = 0
): IPrismaPagination => {
  const totalPages = Math.ceil(totalRows / pageSize);
  const currentPage = Math.min(Math.max(1, page), totalPages);
  const skip = (currentPage - 1) * pageSize;

  return {
    take: pageSize,
    skip,
    pageSize,
    currentPage,
    totalPages,
    totalRows,
  } as IPrismaPagination;
};

export default createPagination;
