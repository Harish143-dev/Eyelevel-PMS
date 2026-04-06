import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api/axios';
import type { SelectOption } from '../components/ui/CustomSelect';
import { TASK_STATUS_OPTIONS, TASK_PRIORITY_OPTIONS } from '../constants/statusConstants';

/** 
 * Shape of a custom status/priority from the API 
 */
export interface CustomWorkflowItem {
  id: string;
  name: string;
  color: string;
  orderIndex: number;
  isDefault?: boolean;
  standardStatus?: string;
}

/**
 * Central hook for workflow statuses & priorities.
 * Fetches once, caches in memory, and exposes merged SelectOption[] arrays 
 * that combine custom + standard statuses.
 * 
 * Usage:
 *   const { statusOptions, priorityOptions, customStatuses, hasCustomWorkflow, isLoading } = useWorkflowStatuses();
 */

// Module-level cache so we don't re-fetch on every mount
let _cachedStatuses: CustomWorkflowItem[] | null = null;
let _cachedPriorities: CustomWorkflowItem[] | null = null;
let _fetchingStatuses: Promise<CustomWorkflowItem[]> | null = null;
let _fetchingPriorities: Promise<CustomWorkflowItem[]> | null = null;

const fetchStatusesOnce = async (): Promise<CustomWorkflowItem[]> => {
  if (_cachedStatuses !== null) return _cachedStatuses;
  if (_fetchingStatuses) return _fetchingStatuses;
  
  _fetchingStatuses = api.get('/workflow/statuses')
    .then(res => {
      _cachedStatuses = res.data || [];
      _fetchingStatuses = null;
      return _cachedStatuses!;
    })
    .catch(() => {
      _fetchingStatuses = null;
      return [] as CustomWorkflowItem[];
    });
  
  return _fetchingStatuses;
};

const fetchPrioritiesOnce = async (): Promise<CustomWorkflowItem[]> => {
  if (_cachedPriorities !== null) return _cachedPriorities;
  if (_fetchingPriorities) return _fetchingPriorities;
  
  _fetchingPriorities = api.get('/workflow/priorities')
    .then(res => {
      _cachedPriorities = res.data || [];
      _fetchingPriorities = null;
      return _cachedPriorities!;
    })
    .catch(() => {
      _fetchingPriorities = null;
      return [] as CustomWorkflowItem[];
    });
  
  return _fetchingPriorities;
};

/** Force refetch (e.g. after admin edits workflows in Settings) */
export const invalidateWorkflowCache = () => {
  _cachedStatuses = null;
  _cachedPriorities = null;
};

export const useWorkflowStatuses = () => {
  const [customStatuses, setCustomStatuses] = useState<CustomWorkflowItem[]>(_cachedStatuses || []);
  const [customPriorities, setCustomPriorities] = useState<CustomWorkflowItem[]>(_cachedPriorities || []);
  const [isLoading, setIsLoading] = useState(!_cachedStatuses);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    
    Promise.all([fetchStatusesOnce(), fetchPrioritiesOnce()])
      .then(([statuses, priorities]) => {
        if (mounted) {
          setCustomStatuses(statuses);
          setCustomPriorities(priorities);
          setIsLoading(false);
        }
      });
    
    return () => { mounted = false; };
  }, []);

  const refetch = useCallback(async () => {
    invalidateWorkflowCache();
    const [statuses, priorities] = await Promise.all([
      fetchStatusesOnce(),
      fetchPrioritiesOnce(),
    ]);
    setCustomStatuses(statuses);
    setCustomPriorities(priorities);
  }, []);

  const hasCustomWorkflow = customStatuses.length > 0;

  /**
   * Merged status options: custom statuses first, then standard statuses.
   * Every dropdown in the app should use this.
   */
  const statusOptions: SelectOption[] = useMemo(() => (customStatuses.length > 0
    ? customStatuses.map(s => ({ value: s.id, label: s.name, color: s.color }))
    : TASK_STATUS_OPTIONS), [customStatuses]);

  /**
   * Merged priority options: custom priorities first, then standard priorities.
   */
  const priorityOptions: SelectOption[] = useMemo(() => (customPriorities.length > 0
    ? customPriorities.map(p => ({ value: p.id, label: p.name, color: p.color }))
    : TASK_PRIORITY_OPTIONS), [customPriorities]);

  /**
   * Resolve display name for a task's status
   */
  const getStatusLabel = useCallback((task: { status: string; customStatus?: { name: string } | null; customStatusId?: string | null }) => {
    if (task.customStatusId && task.customStatus?.name) return task.customStatus.name;
    if (task.customStatusId) {
      const found = customStatuses.find(s => s.id === task.customStatusId);
      if (found) return found.name;
    }
    const standard = TASK_STATUS_OPTIONS.find(s => s.value === task.status);
    return standard?.label || task.status;
  }, [customStatuses]);

  /**
   * Resolve display color for a task's status  
   */
  const getStatusColor = useCallback((task: { status: string; customStatus?: { color: string } | null; customStatusId?: string | null }) => {
    if (task.customStatusId && task.customStatus?.color) return task.customStatus.color;
    if (task.customStatusId) {
      const found = customStatuses.find(s => s.id === task.customStatusId);
      if (found) return found.color;
    }
    const colors: Record<string, string> = {
      pending: '#94a3b8',
      ongoing: '#3b82f6',
      in_review: '#f59e0b',
      completed: '#10b981',
      cancelled: '#ef4444',
    };
    return colors[task.status] || '#94a3b8';
  }, [customStatuses]);

  /**
   * Get the current value to pass to a CustomSelect for a task's status
   */
  const getStatusValue = useCallback((task: { status: string; customStatusId?: string | null }) => {
    return task.customStatusId || task.status;
  }, []);

  /**
   * Get the current value to pass to a CustomSelect for a task's priority
   */
  const getPriorityValue = useCallback((task: { priority: string; customPriorityId?: string | null }) => {
    return task.customPriorityId || task.priority;
  }, []);

  /**
   * Kanban columns — returns custom statuses if available, else standard defaults.
   */
  const kanbanColumns = useMemo(() => (customStatuses.length > 0
    ? customStatuses
    : [
        { id: '1', name: 'Pending', standardStatus: 'pending', color: '#94a3b8', orderIndex: 0 },
        { id: '2', name: 'Ongoing', standardStatus: 'ongoing', color: '#3b82f6', orderIndex: 1 },
        { id: '3', name: 'In Review', standardStatus: 'in_review', color: '#f59e0b', orderIndex: 2 },
        { id: '4', name: 'Completed', standardStatus: 'completed', color: '#10b981', orderIndex: 3 },
      ]), [customStatuses]);

  return {
    customStatuses,
    customPriorities,
    statusOptions,
    priorityOptions,
    hasCustomWorkflow,
    kanbanColumns,
    isLoading,
    refetch,
    getStatusLabel,
    getStatusColor,
    getStatusValue,
    getPriorityValue,
  };
};
