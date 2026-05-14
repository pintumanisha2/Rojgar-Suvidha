const fs = require('fs');
const path = require('path');

const pages = [
  {
    path: 'src/app/admin/users/page.tsx',
    title: 'Manage Admin Users',
    icon: 'Users',
    desc: 'Add or remove admin users who can access this dashboard.',
    columns: ['Name', 'Email', 'Role', 'Status'],
    dummy: '[{ id: 1, col1: "Rojgar Admin", col2: "admin@rojgarsuvidha.com", col3: "Super Admin", col4: "Active" }]'
  },
  {
    path: 'src/app/admin/payments/page.tsx',
    title: 'Payment History',
    icon: 'CreditCard',
    desc: 'Track all successful and failed payments from users.',
    columns: ['Transaction ID', 'User Email', 'Amount', 'Status', 'Date'],
    dummy: '[{ id: 1, col1: "TXN-98234", col2: "user@example.com", col3: "₹100", col4: "Success", col5: "Today" }]'
  },
  {
    path: 'src/app/admin/banners/page.tsx',
    title: 'Homepage Banners',
    icon: 'ImageIcon',
    desc: 'Manage sliding banners shown on the user frontend.',
    columns: ['Preview', 'Title', 'Link', 'Status'],
    dummy: '[{ id: 1, col1: "Image", col2: "SSC CGL Big Update", col3: "/job/ssc-cgl", col4: "Active" }]'
  },
  {
    path: 'src/app/admin/direct-form/page.tsx',
    title: 'Direct Form Leads',
    icon: 'BarChart2',
    desc: 'View data submitted directly by users via quick forms.',
    columns: ['Name', 'Phone Number', 'Form Type', 'Date Submitted'],
    dummy: '[{ id: 1, col1: "Rahul Kumar", col2: "+91 9876543210", col3: "Career Counseling", col4: "Yesterday" }]'
  },
  {
    path: 'src/app/admin/coupons/page.tsx',
    title: 'Discount Coupons',
    icon: 'Ticket',
    desc: 'Create promo codes for Apply For Me services.',
    columns: ['Code', 'Discount', 'Usage Limit', 'Status'],
    dummy: '[{ id: 1, col1: "WELCOME50", col2: "50% OFF", col3: "12 / 100", col4: "Active" }]'
  },
  {
    path: 'src/app/admin/complaints/page.tsx',
    title: 'User Complaints & Support',
    icon: 'MessageSquareWarning',
    desc: 'Manage support tickets and complaints raised by users.',
    columns: ['Ticket ID', 'User', 'Subject', 'Status', 'Action'],
    dummy: '[{ id: 1, col1: "#TKT-102", col2: "amit@gmail.com", col3: "Payment failed but money deducted", col4: "Pending", col5: "View" }]'
  }
];

const template = (page) => `"use client";

import { useState } from "react";
import { PlusCircle, Search, ${page.icon} } from "lucide-react";

export default function Page() {
  const [data] = useState(${page.dummy});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <${page.icon} className="h-6 w-6 text-indigo-500" />
            ${page.title}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">${page.desc}</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <PlusCircle className="h-5 w-5" />
          Add New
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search..." className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                ${page.columns.map(c => `<th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">${c}</th>`).join('\n                ')}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-4 text-sm font-medium">{row.col1}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{row.col2}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{row.col3}</td>
                  <td className="px-5 py-4 text-sm font-bold text-indigo-600">{row.col4}</td>
                  ${page.columns.length > 4 ? `<td className="px-5 py-4 text-sm font-medium text-blue-500 cursor-pointer">{row.col5}</td>` : ''}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`;

pages.forEach(page => {
  const dir = path.dirname(page.path);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  // Need to import ImageIcon instead of Image to avoid conflict with next/image if they ever use it,
  // but lucide-react exports Image. We handled it by importing Image as ImageIcon in the script.
  let content = template(page);
  if (page.icon === 'ImageIcon') {
    content = content.replace('ImageIcon } from', 'Image as ImageIcon } from');
  }
  
  fs.writeFileSync(page.path, content);
  console.log('Created: ' + page.path);
});
