"use strict";
/**
 * Pagination utility for Prisma queries.
 * Extract page/limit from Express query params, return Prisma skip/take + meta.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.parsePagination = parsePagination;
exports.paginatedResponse = paginatedResponse;
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 25));
    return { page, limit, skip: (page - 1) * limit, take: limit };
}
function paginatedResponse(data, total, params) {
    return {
        data,
        pagination: {
            page: params.page,
            limit: params.limit,
            total,
            totalPages: Math.ceil(total / params.limit),
            hasMore: params.page * params.limit < total,
        },
    };
}
//# sourceMappingURL=pagination.js.map