/**
 * User activity tracking and heartbeat disabled as requested.
 * This hook is now a no-op to prevent monitoring user presence.
 */
export const useActivityTracker = () => {
  return;
};

export default useActivityTracker;
