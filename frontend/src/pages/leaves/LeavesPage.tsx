import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchMyLeaves, fetchAllLeaves, applyForLeave, updateLeaveStatus } from '../../store/slices/leaveSlice';
import { Calendar, Plus, CheckCircle, XCircle } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import CustomSelect from '../../components/ui/CustomSelect';
import Badge from '../../components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import toast from 'react-hot-toast';
import Avatar from '../../components/Avatar';

import { isAdminOrManager } from '../../constants/roles';

const LeavesPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { myLeaves, allLeaves, isLoading } = useAppSelector((state) => state.leaves);
  const isAdmin = isAdminOrManager(user?.role);

  const [activeTab, setActiveTab] = useState<'my_leaves' | 'all_leaves'>('my_leaves');
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveType, setLeaveType] = useState('CASUAL');
  const [reason, setReason] = useState('');

  // Admin approval state
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    if (activeTab === 'my_leaves') {
      dispatch(fetchMyLeaves());
    } else if (activeTab === 'all_leaves' && isAdmin) {
      dispatch(fetchAllLeaves());
    }
  }, [dispatch, activeTab, isAdmin]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !reason) {
      toast.error('Please fill all required fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      toast.error('End date cannot be earlier than start date');
      return;
    }
    try {
      await dispatch(applyForLeave({ startDate, endDate, type: leaveType, reason })).unwrap();
      toast.success('Leave application submitted');
      setIsApplyModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    } catch (err: any) {
      toast.error(err || 'Failed to apply');
    }
  };

  const handleStatusUpdate = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedLeave) return;
    try {
      await dispatch(updateLeaveStatus({ id: selectedLeave.id, status, adminNote })).unwrap();
      toast.success(`Leave ${status.toLowerCase()}`);
      setIsApproveModalOpen(false);
      setSelectedLeave(null);
      setAdminNote('');
    } catch (err: any) {
      toast.error(err || 'Failed to update status');
    }
  };

  const leavesToDisplay = activeTab === 'my_leaves' ? myLeaves : allLeaves;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-left gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main flex items-center gap-2">
            <Calendar className="text-primary" size={24} />
            Leave Management
          </h1>
          <p className="mt-1 text-sm text-text-muted">
            Request time off or manage team leaves.
          </p>
        </div>
        <Button onClick={() => setIsApplyModalOpen(true)} leftIcon={<Plus size={18} />}>
          Apply for Leave
        </Button>
      </div>

      {isAdmin && (
        <div className="flex bg-surface border border-border rounded-xl p-1 gap-2 w-fit">
          <button
            onClick={() => setActiveTab('my_leaves')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'my_leaves'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-background'
            }`}
          >
            My Leaves
          </button>
          <button
            onClick={() => setActiveTab('all_leaves')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'all_leaves'
                ? 'bg-primary text-white shadow-sm'
                : 'text-text-muted hover:text-text-main hover:bg-background'
            }`}
          >
            Team Requests
          </button>
        </div>
      )}

      <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden text-left">
        <Table>
          <TableHeader>
            <TableRow>
              {activeTab === 'all_leaves' && <TableHead>Employee</TableHead>}
              <TableHead>Type</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Applied On</TableHead>
              {activeTab === 'all_leaves' && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && leavesToDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === 'all_leaves' ? 6 : 4} className="h-24 text-center">
                   <div className="flex justify-center items-center h-full">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                </TableCell>
              </TableRow>
            ) : leavesToDisplay.length === 0 ? (
              <TableRow>
                <TableCell colSpan={activeTab === 'all_leaves' ? 6 : 4} className="h-24 text-center text-text-muted">
                  No leave records found.
                </TableCell>
              </TableRow>
            ) : (
              leavesToDisplay.map((leave) => (
                <TableRow key={leave.id}>
                  {activeTab === 'all_leaves' && (
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={leave.user?.name || ''} color={leave.user?.avatarColor || '#6366f1'} size={32} />
                        <div>
                          <div className="font-medium text-text-main">{leave.user?.name}</div>
                          <div className="text-xs text-text-muted">{leave.user?.designation || 'Employee'}</div>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge variant={leave.type === 'SICK' ? 'red' : leave.type === 'CASUAL' ? 'indigo' : 'gray'}>
                      {leave.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium text-text-main">{new Date(leave.startDate).toLocaleDateString()}</span>
                      <span className="text-text-muted mx-1">to</span>
                      <span className="font-medium text-text-main">{new Date(leave.endDate).toLocaleDateString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={leave.status === 'APPROVED' ? 'green' : leave.status === 'REJECTED' ? 'red' : 'amber'}>
                      {leave.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-text-muted">
                    {new Date(leave.createdAt).toLocaleDateString()}
                  </TableCell>
                  {activeTab === 'all_leaves' && (
                    <TableCell className="text-right space-x-2">
                       {leave.status === 'PENDING' ? (
                         <Button
                           variant="secondary"
                           size="sm"
                           onClick={() => {
                             setSelectedLeave(leave);
                             setAdminNote('');
                             setIsApproveModalOpen(true);
                           }}
                         >
                           Review
                         </Button>
                       ) : (
                         <span className="text-xs text-text-muted italic px-2">Reviewed</span>
                       )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        title="Apply for Leave"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-text-main mb-1">Leave Type</label>
             <CustomSelect
                value={leaveType}
                onChange={setLeaveType}
                options={[
                  { value: 'CASUAL', label: 'Casual Leave' },
                  { value: 'SICK', label: 'Sick Leave' },
                  { value: 'UNPAID', label: 'Unpaid Leave' },
                ]}
             />
          </div>
          <div>
             <label className="block text-sm font-medium text-text-main mb-1">Reason</label>
             <textarea
               className="w-full bg-background border border-border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
               rows={3}
               placeholder="Briefly describe the reason..."
               value={reason}
               onChange={(e) => setReason(e.target.value)}
               required
             />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="secondary" onClick={() => setIsApplyModalOpen(false)} type="button">Cancel</Button>
            <Button type="submit">Submit Request</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        title="Review Leave Request"
      >
        {selectedLeave && (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-lg border border-border text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-text-muted">Employee:</span>
                <span className="font-medium text-text-main">{selectedLeave?.user?.name}</span>
              </div>
               <div className="flex justify-between">
                <span className="text-text-muted">Type:</span>
                <span className="font-medium text-text-main">{selectedLeave?.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Period:</span>
                <span className="font-medium text-text-main">
                  {new Date(selectedLeave.startDate).toLocaleDateString()} - {new Date(selectedLeave.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-text-muted block mb-1">Reason:</span>
                <p className="text-text-main text-sm">{selectedLeave.reason}</p>
              </div>
            </div>

            <div>
               <label className="block text-sm font-medium text-text-main mb-1">Admin Note (optional)</label>
               <Input
                 value={adminNote}
                 onChange={(e) => setAdminNote(e.target.value)}
                 placeholder="Will be visible to the employee..."
               />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => handleStatusUpdate('REJECTED')}
                className="text-danger hover:bg-danger/10 border-danger/20"
                leftIcon={<XCircle size={16} />}
              >
                Reject
              </Button>
              <Button
                type="button"
                onClick={() => handleStatusUpdate('APPROVED')}
                className="bg-success hover:bg-success-hover text-white shadow-none"
                leftIcon={<CheckCircle size={16} />}
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LeavesPage;
