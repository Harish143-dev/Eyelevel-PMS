/**
 * Pagination utility for Prisma queries.
 * Extract page/limit from Express query params, return Prisma skip/take + meta.
 */
export interface PaginationParams {
    page: number;
    limit: number;
    skip: number;
    take: number;
}
export interface PaginatedResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}
export declare function parsePagination(query: Record<string, any>): PaginationParams;
export declare function paginatedResponse<T>(data: T[], total: number, params: PaginationParams): PaginatedResult<T>;
//# sourceMappingURL=pagination.d.ts.map