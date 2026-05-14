"use client";

import { useState } from "react";
import { Search, CreditCard, Download } from "lucide-react";

export default function AdminPaymentsPage() {
  const [data] = useState([{ id: 1, col1: "TXN-98234", col2: "user@example.com", col3: "₹100", col4: "Success", col5: "Today" }]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6 text-indigo-500" />
            Payment History
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all successful and failed payments from users for 'Apply For Me'.</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 font-bold px-5 py-2.5 rounded-xl shadow-sm transition-colors">
          <Download className="h-5 w-5" />
          Export CSV
        </button>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input type="text" placeholder="Search by TXN ID or Email..." className="w-full pl-11 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Transaction ID</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">User Email</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Amount</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-5 py-3 text-xs font-bold text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.map((row: any) => (
                <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="px-5 py-4 text-sm font-medium">{row.col1}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{row.col2}</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900 dark:text-white">{row.col3}</td>
                  <td className="px-5 py-4 text-sm font-bold text-green-600">{row.col4}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{row.col5}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
