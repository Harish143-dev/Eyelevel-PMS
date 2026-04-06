import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchOKRs, createOKR, updateOKR, deleteOKR, fetchReviews, createReview } from '../../store/slices/performanceSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import CustomSelect from '../../components/ui/CustomSelect';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';
import { Trophy, Star, Plus, Trash2 } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';

export const PerformancePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const { okrs, reviews, isLoading } = useAppSelector((state) => state.performance);
  const { user: currentUser } = useAppSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState<'okrs' | 'reviews'>('okrs');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // OKR Form State
  const [isOkrModalOpen, setIsOkrModalOpen] = useState(false);
  const { register: regOkr, handleSubmit: handleOkrSubmit, reset: resetOkr, control: controlOkr } = useForm();
  
  // Review Form State
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const { register: regReview, handleSubmit: handleReviewSubmit, reset: resetReview, control: controlReview } = useForm();

  const canManage = ['hr', 'manager', 'admin', 'manager'].includes(currentUser?.role || '');

  useEffect(() => {
    dispatch(fetchUsers({}));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchOKRs(employeeFilter || undefined));
    dispatch(fetchReviews(employeeFilter || undefined));
  }, [dispatch, employeeFilter]);

  const onOkrSubmit = async (data: any) => {
    const payload = {
      ...data,
      userId: data.userId || currentUser?.id
    };
    const action = await dispatch(createOKR(payload));
    if (createOKR.fulfilled.match(action)) {
      toast.success('OKR Created');
      setIsOkrModalOpen(false);
      resetOkr();
    } else {
      toast.error('Failed to create OKR');
    }
  };

  const onUpdateOkrProgress = async (id: string, progress: number, currentStatus: string) => {
    let status = currentStatus;
    if (progress >= 100) status = 'completed';
    const action = await dispatch(updateOKR({ id, data: { progress, status } }));
    if (updateOKR.fulfilled.match(action)) {
      toast.success('Progress updated');
    }
  };

  const onDeleteOkr = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this OKR?')) {
      await dispatch(deleteOKR(id));
      toast.success('OKR deleted');
    }
  };

  const onReviewSubmit = async (data: any) => {
    const payload = { ...data, rating: Number(data.rating) };
    const action = await dispatch(createReview(payload));
    if (createReview.fulfilled.match(action)) {
      toast.success('Review Published');
      setIsReviewModalOpen(false);
      resetReview();
    } else {
      toast.error('Failed to publish review');
    }
  };

  const userOptions = users.map(u => ({ value: u.id, label: u.name }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl border border-violet-500/20">
            <Trophy size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">Performance</h1>
            <p className="text-text-muted text-lg">Manage OKRs and Performance Reviews</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canManage && (
            <div className="w-48">
              <select
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main appearance-none"
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
              >
                <option value="">All Employees</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
          )}
          {activeTab === 'okrs' ? (
            <Button onClick={() => setIsOkrModalOpen(true)}>
              <Plus size={18} className="mr-2" />
              New OKR
            </Button>
          ) : (
            canManage && (
              <Button onClick={() => setIsReviewModalOpen(true)}>
                <Star size={18} className="mr-2" />
                New Review
              </Button>
            )
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-surface border border-border p-1 rounded-xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab('okrs')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'okrs' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-background'
          }`}
        >
          Active OKRs
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`flex-1 sm:flex-none px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'reviews' ? 'bg-primary text-white shadow-sm' : 'text-text-muted hover:text-text-main hover:bg-background'
          }`}
        >
          Performance Reviews
        </button>
      </div>

      {activeTab === 'okrs' && (
        <Card>
          <CardHeader>
            <CardTitle>Objectives & Key Results</CardTitle>
            <CardDescription>Track goals and progress over quarters</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && okrs.length === 0 ? (
              <div className="text-center py-8 text-text-muted font-medium">Loading OKRs...</div>
            ) : okrs.length === 0 ? (
              <div className="text-center py-8 text-text-muted">No OKRs found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Objective</TableHead>
                      <TableHead>Quarter</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      {canManage && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {okrs.map(okr => (
                      <TableRow key={okr.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar name={okr.user?.name || '?'} color={okr.user?.avatarColor || '#ccc'} size={28} />
                            <span className="font-medium">{okr.user?.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-text-main">{okr.title}</p>
                          <p className="text-xs text-text-muted mt-0.5">{okr.description}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="blue">{okr.quarter}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={okr.status === 'completed' ? 'green' : 'amber'}>
                            {okr.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-24 h-2 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${okr.progress}%` }}></div>
                            </div>
                            <span className="text-xs font-semibold">{okr.progress}%</span>
                            
                            {(okr.userId === currentUser?.id || canManage) && (
                              <button
                                onClick={() => {
                                  const p = window.prompt('Update progress (0-100):', okr.progress.toString());
                                  if (p && !isNaN(Number(p))) onUpdateOkrProgress(okr.id, Math.min(100, Math.max(0, Number(p))), okr.status);
                                }}
                                className="text-text-muted hover:text-primary transition-colors text-xs ml-2"
                              >
                                Update
                              </button>
                            )}
                          </div>
                        </TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => onDeleteOkr(okr.id)} className="text-danger hover:text-danger hover:bg-danger/10">
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'reviews' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading && reviews.length === 0 ? (
             <div className="col-span-full text-center py-8 text-text-muted font-medium">Loading Reviews...</div>
          ) : reviews.length === 0 ? (
             <div className="col-span-full text-center py-8 text-text-muted border border-dashed border-border rounded-xl">No performance reviews found.</div>
          ) : (
            reviews.map(review => (
              <Card key={review.id} className="flex flex-col h-full">
                <CardHeader className="pb-3 border-b border-border">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <Avatar name={review.reviewee?.name || '?'} color={review.reviewee?.avatarColor || '#ccc'} size={40} />
                      <div>
                        <CardTitle className="text-base">{review.reviewee?.name}</CardTitle>
                        <Badge variant="indigo" className="mt-1">{review.period}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={16} className={star <= review.rating ? "fill-amber-500 text-amber-500" : "text-text-muted"} />
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 flex flex-col flex-1 pb-4">
                  <p className="text-sm text-text-main whitespace-pre-wrap flex-1 italic relative">
                    <span className="absolute -left-2 -top-2 text-primary/20 text-3xl font-serif">"</span>
                    {review.feedback}
                  </p>
                  <div className="mt-4 pt-3 border-t border-border flex items-center gap-2">
                    <span className="text-xs text-text-muted">Reviewed by</span>
                    <span className="text-xs font-medium text-text-main">{review.reviewer?.name}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* OKR Modal */}
      <Modal isOpen={isOkrModalOpen} onClose={() => setIsOkrModalOpen(false)} title="Create New OKR">
        <form onSubmit={handleOkrSubmit(onOkrSubmit)} className="space-y-4">
          {canManage && (
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Employee</label>
              <Controller
                name="userId"
                control={controlOkr}
                render={({ field }) => (
                  <CustomSelect
                    value={field.value || ''}
                    onChange={field.onChange}
                    options={[{ value: '', label: '-- Self --' }, ...userOptions]}
                  />
                )}
              />
            </div>
          )}
          <Input label="Objective Title" placeholder="e.g., Increase user engagement" required {...regOkr('title')} />
          <Input label="Description / Metrics" placeholder="e.g., Achieve 20% more DAU" {...regOkr('description')} />
          <Input label="Quarter" placeholder="Q1 2026" required {...regOkr('quarter')} />
          
          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsOkrModalOpen(false)}>Cancel</Button>
            <Button type="submit">Create OKR</Button>
          </div>
        </form>
      </Modal>

      {/* Review Modal */}
      <Modal isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} title="Publish Performance Review">
        <form onSubmit={handleReviewSubmit(onReviewSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Employee to Review</label>
            <Controller
              name="revieweeId"
              control={controlReview}
              rules={{ required: true }}
              render={({ field }) => (
                <CustomSelect
                  value={field.value || ''}
                  onChange={field.onChange}
                  options={[{ value: '', label: '-- Select Employee --' }, ...userOptions]}
                />
              )}
            />
          </div>
          <Input label="Review Period" placeholder="e.g., Q1 2026 or 2025 Annual" required {...regReview('period')} />
          
          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Rating (1-5)</label>
            <input 
              type="number" 
              min="1" 
              max="5" 
              className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
              required 
              {...regReview('rating')} 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-main mb-1">Constructive Feedback</label>
            <textarea
              rows={4}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main resize-none transition-all"
              placeholder="Strengths and areas for improvement..."
              required
              {...regReview('feedback')}
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsReviewModalOpen(false)}>Cancel</Button>
            <Button type="submit">Publish Review</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PerformancePage;
