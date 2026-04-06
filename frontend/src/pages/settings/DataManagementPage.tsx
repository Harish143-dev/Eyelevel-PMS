import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Download, Upload, Trash2, FileText, Users, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';

const DataManagementPage: React.FC = () => {
  const handleExport = (module: string) => {
    const baseUrl = (window as any).process?.env?.REACT_APP_API_URL || '/api';
    const token = localStorage.getItem('token');
    
    // Using simple window.open or anchor for CSV download with Auth header is tricky
    // but for now we follow the simplest approach for a quick win
    toast.loading(`Preparing ${module} export...`, { duration: 2000 });
    
    fetch(`${baseUrl}/data/export/${module}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(async (res) => {
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${module}_export.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      toast.success(`${module} exported successfully`);
    })
    .catch((err) => {
      console.error(err);
      toast.error(`Failed to export ${module}`);
    });
  };

  return (
    <div className="space-y-6 text-left max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-text-main">Data Management</h1>
        <p className="mt-1 text-sm text-text-muted">
          Export your company data or manage deleted records.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download size={20} className="text-primary" />
              Quick Exports
            </CardTitle>
            <CardDescription>Download your data in CSV format.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <FileText size={18} className="text-text-muted" />
                <span className="text-sm font-medium">Tasks & Activities</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('tasks')}>CSV</Button>
            </div>
            
            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <FolderKanban size={18} className="text-text-muted" />
                <span className="text-sm font-medium">Project Lists</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('projects')}>CSV</Button>
            </div>

            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-background/50">
              <div className="flex items-center gap-3">
                <Users size={18} className="text-text-muted" />
                <span className="text-sm font-medium">Employee Directory</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleExport('employees')}>CSV</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload size={20} className="text-success" />
              Data Import
            </CardTitle>
            <CardDescription>Bulk upload records into your workspace.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-border rounded-xl bg-background/20">
            <Upload size={32} className="text-text-muted mb-3" />
            <p className="text-sm text-text-muted mb-4 text-center px-4">
              Upload CSV files to import employees or projects.
            </p>
            <Button variant="secondary" disabled>Select File</Button>
            <p className="mt-2 text-[10px] text-text-muted">Coming soon in next update</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-danger/20 bg-danger/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-danger">
            <Trash2 size={20} />
            Recycle Bin
          </CardTitle>
          <CardDescription>View and restore items deleted in the last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-text-muted border border-danger/10 rounded-lg">
            <p className="text-sm italic">Trash service is currently empty.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagementPage;
