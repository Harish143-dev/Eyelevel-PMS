import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api/axios';
import { Building, ShieldCheck, CheckCircle2, XCircle, Search } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  status: string;
  setupCompleted: boolean;
  createdAt: string;
  _count: {
    users: number;
    projects: number;
  };
}

const CompanyList: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await api.get('/api/companies');
        setCompanies(response.data.companies);
      } catch (error) {
        console.error('Error fetching companies', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building className="text-primary" />
            Super Admin: Companies
          </h1>
          <p className="text-text-muted mt-1">Manage global platforms and feature accesses</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-surface p-4 rounded-xl border border-border mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
          <input 
            type="text" 
            placeholder="Search companies..." 
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-text-main focus:outline-none focus:border-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12"><div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div></div>
      ) : (
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-background/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Company Name</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Status</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Setup</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Users</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Projects</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted">Joined At</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCompanies.map(company => (
                <tr key={company.id} className="hover:bg-background/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{company.name}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center w-max gap-1
                      ${company.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}
                    `}>
                      {company.status === 'active' ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {company.setupCompleted ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-sm">
                        <CheckCircle2 size={16} /> Done
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-500 text-sm">
                        <XCircle size={16} /> Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-text-muted font-medium">{company._count.users}</td>
                  <td className="px-6 py-4 text-text-muted font-medium">{company._count.projects}</td>
                  <td className="px-6 py-4 text-text-muted text-sm">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link 
                      to={`/pm/settings/super-admin/companies/${company.id}/features`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      <ShieldCheck size={16} />
                      Features
                    </Link>
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                    No companies found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompanyList;
