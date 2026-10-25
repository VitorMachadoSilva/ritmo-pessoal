export const routinePageSizes = [5, 10, 20, 50, 100] as const;

export function paginateRoutine<T>(items: readonly T[], requestedPage: number, pageSize: number) {
  const size = routinePageSizes.includes(pageSize as (typeof routinePageSizes)[number]) ? pageSize : 10;
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / size));
  const safePage = Number.isFinite(requestedPage) ? Math.trunc(requestedPage) : 1;
  const page = Math.min(Math.max(1, safePage), totalPages);
  const offset = (page - 1) * size;
  return {
    items: items.slice(offset, offset + size),
    page,
    pageSize: size,
    total,
    totalPages,
    first: total === 0 ? 0 : offset + 1,
    last: Math.min(offset + size, total),
  };
}

export function visibleRoutinePages(page: number, totalPages: number) {
  const first = Math.max(1, Math.min(page - 2, totalPages - 4));
  return Array.from({ length: Math.min(5, totalPages) }, (_, index) => first + index);
}
