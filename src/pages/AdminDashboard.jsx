import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Palette, 
  Settings, 
  Search, 
  Bell, 
  MoreHorizontal,
  TrendingUp
} from 'lucide-react';

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, to = "#" }) => (
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

const StatCard = ({ title, value, subtext }) => (
  <div className="bg-beige-lighter2 p-6 rounded-lg border border-beige-border shadow-sm">
    <h3 className="text-sm font-medium text-gray-500 mb-2">{title}</h3>
    <p className="text-3xl font-serif text-charcoal mb-1">{value}</p>
    {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
  </div>
);

const StatusBadge = ({ status }) => {
  const styles = {
    Paid: "bg-green-100 text-green-700 border-green-200",
    Unfulfilled: "bg-amber-100 text-amber-700 border-amber-200",
    Pending: "bg-gray-100 text-gray-700 border-gray-200",
  };
  
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.Pending}`}>
      {status}
    </span>
  );
};

// --- Mock Chart Component (Pure SVG for speed) ---
const SimpleLineChart = () => (
  <div className="w-full h-64 flex items-end justify-between space-x-1 pt-8 relative overflow-hidden">
    {/* Background Grid Lines */}
    <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-300 pointer-events-none pb-6">
        <div className="border-b border-gray-100 w-full h-0"></div>
        <div className="border-b border-gray-100 w-full h-0"></div>
        <div className="border-b border-gray-100 w-full h-0"></div>
        <div className="border-b border-gray-100 w-full h-0"></div>
        <div className="border-b border-gray-100 w-full h-0"></div>
    </div>
    
    {/* The Curve */}
    <svg className="absolute inset-0 w-full h-full pb-6" preserveAspectRatio="none">
        <defs>
            <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2D2D2D" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#2D2D2D" stopOpacity="0" />
            </linearGradient>
        </defs>
        <path 
            d="M0,200 C150,180 300,180 450,140 S750,100 900,80 S1200,40 1400,10 V250 H0 Z" 
            fill="url(#gradient)" 
        />
        <path 
            d="M0,200 C150,180 300,180 450,140 S750,100 900,80 S1200,40 1400,10" 
            fill="none" 
            stroke="#2D2D2D" 
            strokeWidth="2" 
            vectorEffect="non-scaling-stroke"
        />
    </svg>
    
    {/* Y-Axis Labels overlay */}
    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] text-gray-400 pb-6 pr-2 bg-white/50 backdrop-blur-[1px]">
        <span>$12,500</span>
        <span>$9,900</span>
        <span>$6,000</span>
        <span>$3,500</span>
        <span>0</span>
    </div>
  </div>
);

const AdminDashboard = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-cream flex font-sans text-charcoal">
      
      {/* --- SIDEBAR --- */}
      <aside className="w-64 bg-beige-light border-r border-beige-border fixed h-full hidden md:flex flex-col">
        <div className="p-8">
            <h1 className="text-2xl font-serif text-charcoal">Artisan Canvas</h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" active={true} to="/admin/dashboard" />
            <SidebarItem icon={Package} label="Products" to="/admin/products" />
            <SidebarItem icon={ShoppingCart} label="Orders" to="/admin/orders" />
            <SidebarItem icon={Users} label="Customers" to="/admin/customers" />
            <SidebarItem icon={Palette} label="Upload" to="/admin/upload" />
            <SidebarItem icon={Settings} label="Settings" to="#" />
        </nav>
        
        <div className="p-4 border-t border-beige-border">
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
      <main className="flex-1 md:ml-64">
        
        {/* Top Header (Mobile menu would go here) */}
        <header className="h-16 bg-white/50 backdrop-blur-sm border-b border-beige-border sticky top-0 z-10 px-8 flex items-center justify-between">
            <h2 className="text-xl font-serif">Dashboard</h2>
            <div className="flex items-center space-x-4">
                <div className="relative">
                    <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        className="pl-9 pr-4 py-2 bg-[#F4F1EA] border-none rounded-full text-sm focus:ring-1 focus:ring-charcoal outline-none w-64 transition-all"
                    />
                </div>
                <button className="p-2 text-gray-400 hover:text-charcoal transition relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
                </button>
            </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
            
            {/* 1. Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Sales" value="$12,500" />
                <StatCard title="Open Orders" value="8" />
                <StatCard title="Active Inventory Value" value="$45,000" />
                <StatCard title="Low Stock" value="0" />
            </div>

            {/* 2. Chart Section */}
            <div className="bg-white p-8 rounded-xl border border-beige-border shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-medium">Sales - Last 30 Days</h3>
                        <div className="flex items-center text-sm text-green-600 mt-1">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            <span>+12.5% from last month</span>
                        </div>
                    </div>
                    <select className="bg-beige-light border-none text-sm rounded-md px-3 py-1 text-gray-600 outline-none cursor-pointer">
                        <option>Last 30 Days</option>
                        <option>Last 7 Days</option>
                        <option>This Year</option>
                    </select>
                </div>
                <SimpleLineChart />
            </div>

            {/* 3. Recent Orders Table */}
            <div className="bg-white rounded-xl border border-beige-border shadow-sm overflow-hidden">
                <div className="px-8 py-6 border-b border-beige-border flex justify-between items-center">
                    <h3 className="text-lg font-medium">Recent Orders</h3>
                    <Link to="/admin/orders" className="text-sm text-gray-500 hover:text-charcoal underline">View All</Link>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-beige-light text-gray-500">
                            <tr>
                                <th className="px-8 py-4 font-medium">Order ID</th>
                                <th className="px-8 py-4 font-medium">Date</th>
                                <th className="px-8 py-4 font-medium">Customer</th>
                                <th className="px-8 py-4 font-medium">Total</th>
                                <th className="px-8 py-4 font-medium">Status</th>
                                <th className="px-8 py-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-beige-border">
                            {[
                                { id: "1013001", date: "2023-06-27", customer: "Customer A", total: "$450.00", paid: "Paid", fulfillment: "Unfulfilled" },
                                { id: "1013002", date: "2023-06-26", customer: "Customer B", total: "$120.00", paid: "Paid", fulfillment: "Unfulfilled" },
                                { id: "1013003", date: "2023-06-25", customer: "Customer C", total: "$850.00", paid: "Pending", fulfillment: "Unfulfilled" },
                                { id: "1013004", date: "2023-06-24", customer: "Customer D", total: "$35.00", paid: "Paid", fulfillment: "Fulfilled" },
                            ].map((order, i) => (
                                <tr key={i} className="hover:bg-cream transition-colors">
                                    <td className="px-8 py-4 font-medium text-charcoal">#{order.id}</td>
                                    <td className="px-8 py-4 text-gray-500">{order.date}</td>
                                    <td className="px-8 py-4 text-charcoal">{order.customer}</td>
                                    <td className="px-8 py-4 font-medium">{order.total}</td>
                                    <td className="px-8 py-4 space-x-2">
                                        <StatusBadge status={order.paid} />
                                        <StatusBadge status={order.fulfillment} />
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <button className="text-gray-400 hover:text-charcoal p-1">
                                            <MoreHorizontal className="h-5 w-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;