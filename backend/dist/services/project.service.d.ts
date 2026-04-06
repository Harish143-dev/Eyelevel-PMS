export declare class ProjectService {
    /**
     * Complex logic to determine who becomes the Project Manager and which department defaults apply.
     */
    static resolveProjectMembers(creatorId: string, providedMemberIds: string[], projectManagerId?: string, departmentId?: string, otherDepartmentIds?: string[]): Promise<{
        finalMemberIds: string[];
        finalProjectManagerId: string;
    }>;
    /**
     * Retrieves paginated, aggregated project lists with isolation.
     */
    static getPaginatedProjects(filterParams: any, user: any, paginationParams: any): Promise<{
        projects: any[];
        total: number;
    }>;
}
//# sourceMappingURL=project.service.d.ts.map