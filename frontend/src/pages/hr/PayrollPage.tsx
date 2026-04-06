import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useRedux';
import { fetchUsers } from '../../store/slices/userSlice';
import { fetchAllSalaries, updateSalary, generatePayslip } from '../../store/slices/payrollSlice';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Avatar from '../../components/Avatar';
import toast from 'react-hot-toast';
import { IndianRupee, FileText, Settings, Download, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';

interface SalaryForm {
  baseSalary: number;
  hra: number;
  otherAllowances: number;
  pfDeduction: number;
  esiDeduction: number;
  taxDeduction: number;
}

const PayrollPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { users } = useAppSelector((state) => state.users);
  const { salaries, isLoading } = useAppSelector((state) => state.payroll);

  const [searchTerm, setSearchTerm] = useState('');
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const [payslipMonth, setPayslipMonth] = useState(new Date().getMonth() + 1);
  const [payslipYear, setPayslipYear] = useState(new Date().getFullYear());

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<SalaryForm>();

  useEffect(() => {
    dispatch(fetchUsers({}));
    dispatch(fetchAllSalaries());
  }, [dispatch]);

  const onEditSalary = (user: any) => {
    setSelectedUser(user);
    const existing = salaries.find(s => s.userId === user.id);
    reset({
      baseSalary: existing?.baseSalary || 0,
      hra: existing?.hra || 0,
      otherAllowances: existing?.otherAllowances || 0,
      pfDeduction: existing?.pfDeduction || 0,
      esiDeduction: existing?.esiDeduction || 0,
      taxDeduction: existing?.taxDeduction || 0,
    });
    setIsSalaryModalOpen(true);
  };

  const onSubmitSalary = async (data: SalaryForm) => {
    if (!selectedUser) return;
    
    // Ensure numbers
    const payload = {
      baseSalary: Number(data.baseSalary) || 0,
      hra: Number(data.hra) || 0,
      otherAllowances: Number(data.otherAllowances) || 0,
      pfDeduction: Number(data.pfDeduction) || 0,
      esiDeduction: Number(data.esiDeduction) || 0,
      taxDeduction: Number(data.taxDeduction) || 0,
    };

    const action = await dispatch(updateSalary({ userId: selectedUser.id, data: payload }));
    if (updateSalary.fulfilled.match(action)) {
      toast.success('Salary updated');
      setIsSalaryModalOpen(false);
    } else {
      toast.error('Failed to update salary');
    }
  };

  const onOpenPayslipModal = (user: any) => {
    setSelectedUser(user);
    setIsPayslipModalOpen(true);
  };

  const handleGeneratePayslip = async () => {
    if (!selectedUser) return;
    const action = await dispatch(generatePayslip({ 
      userId: selectedUser.id, 
      month: payslipMonth, 
      year: payslipYear 
    }));
    
    if (generatePayslip.fulfilled.match(action)) {
      toast.success(`Payslip generated for ${payslipMonth}/${payslipYear}`);
      setIsPayslipModalOpen(false);
    } else {
      toast.error(action.payload as string || 'Failed to generate');
    }
  };

  const activeEmployees = users.filter(u => u.isActive && u.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const getNetPay = (userId: string) => {
    const s = salaries.find(s => s.userId === userId);
    if (!s) return null;
    return (s.baseSalary + s.hra + s.otherAllowances) - (s.pfDeduction + s.esiDeduction + s.taxDeduction);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl border border-emerald-500/20">
            <IndianRupee size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-text-main">Payroll Management</h1>
            <p className="text-text-muted text-lg">Manage employee salaries and payslips</p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
          <div>
            <CardTitle>Staff Salaries</CardTitle>
            <CardDescription>Configure base pay and deductions</CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main placeholder:text-text-muted transition-all"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Net Pay (M)</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && salaries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2 text-text-muted">
                        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        Loading payroll data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : activeEmployees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-text-muted">
                      No employees found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeEmployees.map((user) => {
                    const net = getNetPay(user.id);
                    return (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={user.name} color={user.avatarColor} size={32} />
                            <div>
                              <p className="font-medium text-text-main">{user.name}</p>
                              <p className="text-xs text-text-muted">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-text-muted">{user.designation || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={net !== null ? 'green' : 'amber'}>
                            {net !== null ? 'Configured' : 'No config'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-text-main">
                          {net !== null ? `₹${net.toLocaleString()}` : '—'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => onEditSalary(user)} title="Configure Salary">
                              <Settings size={16} />
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => onOpenPayslipModal(user)} disabled={net === null} title="Generate Payslip">
                              <FileText size={16} className="mr-1" />
                              Payslip
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Salary Configuration Modal */}
      <Modal isOpen={isSalaryModalOpen} onClose={() => setIsSalaryModalOpen(false)} title={`Salary Config: ${selectedUser?.name}`}>
        <form onSubmit={handleSubmit(onSubmitSalary)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <h3 className="text-sm font-semibold text-text-main mb-2 border-b border-border pb-1">Earnings</h3>
            </div>
            <Input type="number" label="Base Salary" {...register('baseSalary')} />
            <Input type="number" label="HRA" {...register('hra')} />
            <Input type="number" label="Other Allowances" {...register('otherAllowances')} />
            
            <div className="col-span-2 mt-2">
              <h3 className="text-sm font-semibold text-text-main mb-2 border-b border-border pb-1">Deductions</h3>
            </div>
            <Input type="number" label="PF Deduction" {...register('pfDeduction')} />
            <Input type="number" label="ESI Deduction" {...register('esiDeduction')} />
            <Input type="number" label="Tax / TDS" {...register('taxDeduction')} />
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsSalaryModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting}>Save Configuration</Button>
          </div>
        </form>
      </Modal>

      {/* Generate Payslip Modal */}
      <Modal isOpen={isPayslipModalOpen} onClose={() => setIsPayslipModalOpen(false)} title={`Generate Payslip: ${selectedUser?.name}`}>
        <div className="space-y-4">
          <p className="text-sm text-text-muted">Generate a published PDF payslip available for the employee to download.</p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Month</label>
              <select
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main appearance-none"
                value={payslipMonth}
                onChange={(e) => setPayslipMonth(Number(e.target.value))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{new Date(0, m - 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-main mb-1">Year</label>
              <input
                type="number"
                className="w-full px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-text-main"
                value={payslipYear}
                onChange={(e) => setPayslipYear(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border">
            <Button variant="secondary" onClick={() => setIsPayslipModalOpen(false)}>Cancel</Button>
            <Button onClick={handleGeneratePayslip}>
              <Download size={16} className="mr-2" />
              Generate Payslip
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PayrollPage;
