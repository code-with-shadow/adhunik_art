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
  ChevronDown,
  Download,
  Mail,
  MapPin
} from 'lucide-react';

// --- Components (Reused) ---

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

// --- Mock Data ---
const MOCK_CUSTOMERS = [
    { id: 1, name: "Alice Smith", email: "alice@example.com", city: "New York", country: "USA", orders: 5, spent: "$4,500", status: "Active" },
    { id: 2, name: "John Doe", email: "john.doe@example.com", city: "London", country: "UK", orders: 4, spent: "$4,500", status: "Active" },
    { id: 3, name: "Emma Wilson", email: "emma.w@example.com", city: "Berlin", country: "Germany", orders: 3, spent: "$4,500", status: "Inactive" },
    { id: 4, name: "Anna Smith", email: "anna@example.com", city: "New York", country: "USA", orders: 3, spent: "$14,500", status: "Active" },
    { id: 5, name: "Michael Brown", email: "m.brown@example.com", city: "Toronto", country: "Canada", orders: 5, spent: "$10,000", status: "Active" },
    { id: 6, name: "Manuel Smith", email: "nanna@example.com", city: "New York", country: "USA", orders: 3, spent: "$3,500", status: "Inactive" },
    { id: 7, name: "Ayenk Smith", email: "niena@example.com", city: "New York", country: "USA", orders: 7, spent: "$10,000", status: "Active" },
    { id: 8, name: "Alvea Smith", email: "alvea@example.com", city: "New York", country: "USA", orders: 2, spent: "$4,300", status: "Active" },
    { id: 9, name: "Robert Jones", email: "rob.j@example.com", city: "Sydney", country: "Australia", orders: 3, spent: "$4,500", status: "Active" },
    { id: 10, name: "Sarah Miller", email: "sarah.m@example.com", city: "Paris", country: "France", orders: 1, spent: "$4,500", status: "New" },
];

const AdminCustomers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans text-charcoal">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-[#F9F7F2] border-r border-[#EBE7DE] fixed h-full hidden md:flex flex-col z-20">
        <div className="p-8">
            <h1 className="text-2xl font-serif text-charcoal">Artisan Canvas</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin/dashboard" />
            <SidebarItem icon={Package} label="Products" to="/admin/products" />
            <SidebarItem icon={ShoppingCart} label="Orders" to="/admin/orders" />
            <SidebarItem icon={Users} label="Customers" active={true} to="/admin/customers" />
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
            <h2 className="text-3xl font-serif text-charcoal">Customers</h2>
            <div className="flex gap-2">
                 <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EBE7DE] rounded-md text-sm font-medium hover:bg-gray-50 transition">
                    <Download size={16} /> Export CSV
                 </button>
            </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white p-4 rounded-t-xl border border-[#EBE7DE] border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Left: Dropdowns */}
            <div className="flex gap-3 w-full md:w-auto overflow-x-auto">
                <div className="relative group">
                    <select className="appearance-none pl-3 pr-8 py-2 bg-[#F9F7F2] border border-[#EBE7DE] rounded-md text-sm text-charcoal outline-none focus:ring-1 focus:ring-charcoal cursor-pointer min-w-[140px]">
                        <option value="">Status (All)</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="new">New</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>

                <div className="relative group">
                    <select className="appearance-none pl-3 pr-8 py-2 bg-[#F9F7F2] border border-[#EBE7DE] rounded-md text-sm text-charcoal outline-none focus:ring-1 focus:ring-charcoal cursor-pointer min-w-[150px]">
                        <option value="">Country (All)</option>
                        <option value="usa">USA</option>
                        <option value="uk">UK</option>
                        <option value="germany">Germany</option>
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Right: Search */}
            <div className="relative w-full md:w-64">
                <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-[#EBE7DE] rounded-md text-sm focus:ring-1 focus:ring-charcoal outline-none transition-all"
                />
            </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-b-xl border border-[#EBE7DE] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-[#F4F1EA] text-charcoal border-b border-[#EBE7DE]">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Customer Name</th>
                            <th className="px-6 py-4 font-semibold">Email Address</th>
                            <th className="px-6 py-4 font-semibold">City</th>
                            <th className="px-6 py-4 font-semibold">Country</th>
                            <th className="px-6 py-4 font-semibold text-center">Total Orders</th>
                            <th className="px-6 py-4 font-semibold text-right">Total Spent</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBE7DE]">
                        {MOCK_CUSTOMERS.filter(c => 
                            c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            c.email.toLowerCase().includes(searchTerm.toLowerCase())
                        ).map((customer, i) => (
                            <tr key={i} className="hover:bg-[#FDFBF7] transition-colors group cursor-pointer">
                                <td className="px-6 py-4 font-medium text-charcoal">{customer.name}</td>
                                <td className="px-6 py-4 text-gray-500 flex items-center gap-2">
                                    <Mail size={14} className="text-gray-300" />
                                    {customer.email}
                                </td>
                                <td className="px-6 py-4 text-charcoal">{customer.city}</td>
                                <td className="px-6 py-4 text-charcoal">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-gray-300" />
                                        {customer.country}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="bg-gray-100 text-gray-700 py-1 px-3 rounded-full text-xs font-medium">
                                        {customer.orders}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-charcoal">{customer.spent}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-[#EBE7DE] bg-[#F9F7F2] flex justify-between items-center text-xs text-gray-500">
                <span>Showing {MOCK_CUSTOMERS.length} customers</span>
                <div className="flex gap-2">
                    <button className="px-3 py-1 border border-[#EBE7DE] bg-white rounded hover:bg-gray-50 disabled:opacity-50">Prev</button>
                    <button className="px-3 py-1 border border-[#EBE7DE] bg-white rounded hover:bg-gray-50">Next</button>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
};

export default AdminCustomers;