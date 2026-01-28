import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Palette, 
  Settings, 
  Search, 
  Filter,
  ChevronDown,
  Download
} from 'lucide-react';

// --- Components (Reused for consistency) ---

const SidebarItem = ({ icon: Icon, label, to = "#", active }) => (
  <Link 
    to={to} 
    className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 group ${
      active 
        ? 'bg-[#EAE5D8] text-charcoal font-medium' 
        : 'text-gray-500 hover:bg-[#F5F2EB] hover:text-charcoal'
    }`}
  >
    <Icon size={20} className={active ? 'text-charcoal' : 'text-gray-400 group-hover:text-charcoal'} />
    <span>{label}</span>
  </Link>
);

const StatusBadge = ({ status, type }) => {
  // Define styles based on status content
  const getStyles = (s) => {
    switch (s.toLowerCase()) {
      case 'paid': return "bg-green-100 text-green-700 border-green-200";
      case 'pending': return "bg-red-100 text-red-700 border-red-200";
      case 'failed': return "bg-gray-100 text-gray-700 border-gray-200";
      
      case 'fulfilled': return "bg-green-100 text-green-700 border-green-200";
      case 'unfulfilled': return "bg-amber-100 text-amber-700 border-amber-200";
      case 'shipped': return "bg-blue-100 text-blue-700 border-blue-200";
      
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStyles(status)}`}>
      {status}
    </span>
  );
};

// --- Mock Data ---
const MOCK_ORDERS = [
    { id: "#1001", date: "2023-06-27", customer: "Customer A", payment: "Paid", fulfillment: "Unfulfilled", total: "$45,000" },
    { id: "#1002", date: "2023-06-28", customer: "Customer B", payment: "Pending", fulfillment: "Unfulfilled", total: "$45,000" },
    { id: "#1003", date: "2023-06-27", customer: "Artist Name", payment: "Paid", fulfillment: "Fulfilled", total: "$75,000" },
    { id: "#1004", date: "2023-06-26", customer: "Artist Name", payment: "Paid", fulfillment: "Unfulfilled", total: "$35,000" },
    { id: "#1005", date: "2023-06-26", customer: "Artist Name", payment: "Paid", fulfillment: "Fulfilled", total: "$30,000" },
    { id: "#1006", date: "2023-06-26", customer: "Artist Name", payment: "Pending", fulfillment: "Unfulfilled", total: "$25,000" },
    { id: "#1007", date: "2023-06-27", customer: "Customer A", payment: "Paid", fulfillment: "Unfulfilled", total: "$45,000" },
    { id: "#1008", date: "2023-06-26", customer: "Artist Name", payment: "Pending", fulfillment: "Unfulfilled", total: "$75,000" },
];

const AdminOrders = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-cream flex font-sans text-charcoal">
      
      {/* --- SIDEBAR (Same as Dashboard) --- */}
      <aside className="w-64 bg-beige-light border-r border-beige-border fixed h-full hidden md:flex flex-col z-20">
        <div className="p-8">
            <h1 className="text-2xl font-serif text-charcoal">Artisan Canvas</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin/dashboard" />
            <SidebarItem icon={Package} label="Products" to="/admin/products" />
            <SidebarItem icon={ShoppingCart} label="Orders" active={true} to="/admin/orders" />
            <SidebarItem icon={Users} label="Customers" to="/admin/customers" />
            <SidebarItem icon={Palette} label="Upload" to="/admin/upload" />
            <SidebarItem icon={Settings} label="Settings" to="#" />
        </nav>
        
        <div className="p-4 border-t border-[#EBE7DE]">
            <div className="flex items-center space-x-3 px-4 py-3">
                <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=2D2D2D&color=fff" alt="Admin" />
                </div>
                <div>
                    <p className="text-sm font-medium">Admin User</p>
                    <p className="text-xs text-gray-500">Store Owner</p>
                </div>
            </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 md:ml-64 p-8">
        
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <h2 className="text-3xl font-serif text-charcoal">Orders</h2>
            <div className="flex gap-2">
                 <button className="flex items-center gap-2 px-4 py-2 bg-white border border-beige-border rounded-md text-sm font-medium hover:bg-gray-50 transition">
                    <Download size={16} /> Export
                 </button>
            </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-t-xl border border-beige-border border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Left: Dropdowns */}
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
                <div className="relative group">
                    <select className="appearance-none pl-3 pr-8 py-2 bg-beige-light border border-beige-border rounded-md text-sm text-charcoal outline-none focus:ring-1 focus:ring-charcoal cursor-pointer min-w-[140px]">
                        <option value="">Payment Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="failed">Failed</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative group">
                    <select className="appearance-none pl-3 pr-8 py-2 bg-beige-light border border-beige-border rounded-md text-sm text-charcoal outline-none focus:ring-1 focus:ring-charcoal cursor-pointer min-w-[150px]">
                        <option value="">Fulfillment Status</option>
                        <option value="fulfilled">Fulfilled</option>
                        <option value="unfulfilled">Unfulfilled</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Right: Search */}
            <div className="relative w-full md:w-64">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search orders..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-[#EBE7DE] rounded-md text-sm focus:ring-1 focus:ring-charcoal outline-none transition-all"
                />
            </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-b-xl border border-beige-border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-beige-lighter2 text-charcoal border-b border-beige-border">
                        <tr>
                            <th className="px-6 py-4 font-semibold w-24">Order ID</th>
                            <th className="px-6 py-4 font-semibold">Date</th>
                            <th className="px-6 py-4 font-semibold">Customer</th>
                            <th className="px-6 py-4 font-semibold">Payment</th>
                            <th className="px-6 py-4 font-semibold">Fulfillment</th>
                            <th className="px-6 py-4 font-semibold text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-beige-border">
                        {MOCK_ORDERS.filter(o => 
                            o.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            o.id.includes(searchTerm)
                        ).map((order, i) => (
                            <tr key={i} className="hover:bg-cream transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-medium text-charcoal">{order.id}</td>
                                <td className="px-6 py-4 text-gray-500">{order.date}</td>
                                <td className="px-6 py-4 text-charcoal font-medium">{order.customer}</td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={order.payment} type="payment" />
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={order.fulfillment} type="fulfillment" />
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-charcoal">{order.total}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Pagination Footer (Optional visual touch) */}
            <div className="px-6 py-4 border-t border-beige-border bg-beige-light flex justify-between items-center text-xs text-gray-500">
                <span>Showing 1-8 of 124 orders</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-beige-border bg-white rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
                    <button className="px-3 py-1 border border-beige-border bg-white rounded hover:bg-gray-50">Next</button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default AdminOrders;