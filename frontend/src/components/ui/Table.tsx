import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  className?: string;
}

export const Table: React.FC<TableProps> = ({ className = '', children, ...props }) => (
  <div className="overflow-x-auto w-full">
    <table className={`w-full text-sm text-left ${className}`} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <thead className={`text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200 ${className}`} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className = '', ...props }) => (
  <tbody className={`divide-y divide-gray-200 ${className}`} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className = '', ...props }) => (
  <tr className={`bg-white hover:bg-gray-50 transition-colors ${className}`} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <th className={`px-6 py-3 font-medium whitespace-nowrap ${className}`} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className = '', ...props }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-gray-700 ${className}`} {...props} />
);
