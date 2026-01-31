import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import service from '../backend/config'; // Your Appwrite Service
import { Query } from 'appwrite';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Palette, 
  Settings, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Box,
  ChevronRight,
  Loader2
} from 'lucide-react';

// --- Sidebar Component ---
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

// --- Simple CSS Bar Chart Component ---
const SalesChart = ({ data }) => {
    const maxVal = Math.max(...data.map(d => d.value), 100); 
    return (
        <div className="flex items-end justify-between h-40 gap-2 mt-4 px-2">
            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-2 w-full group">
                    <div className="relative w-full flex justify-end flex-col h-full">
                         <div 
                            className="bg-charcoal opacity-80 hover:opacity-100 transition-all rounded-t-sm w-full mx-auto max-w-[30px]"
                            style={{ height: `${(item.value / maxVal) * 100}%` }}
                         ></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium uppercase">{item.label}</span>
                </div>
            ))}
        </div>
    );
};

// --- Helper: Status Badge ---
const StatusBadge = ({ status }) => {
    const s = status ? status.toLowerCase() : 'pending';
    let styles = "bg-gray-50 text-gray-600 border-gray-200";
  
    if (s === 'completed' || s === 'paid' || s === 'fulfilled') {
        styles = "bg-green-100 text-green-700 border-green-200";
    } else if (s === 'pending') {
        styles = "bg-amber-100 text-amber-700 border-amber-200";
    } else if (s === 'failed' || s === 'cancelled') {
        styles = "bg-red-100 text-red-700 border-red-200";
    } else if (s === 'shipped') {
        styles = "bg-blue-100 text-blue-700 border-blue-200";
    }
  
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${styles} capitalize`}>
        {status || 'Unknown'}
      </span>
    );
};

const AdminDashboard = () => {
  const [stats, setStats] = useState({
      totalRevenue: 0,
      activeInventoryValue: 0,
      openOrders: 0,
      totalOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [graphData, setGraphData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setLastUpdated(new Date().toLocaleString('en-US', { 
                month: 'long', day: 'numeric', year: 'numeric', 
                hour: 'numeric', minute: 'numeric', hour12: true 
            }));

            // --- 1. OPEN ORDERS ---
            let openOrdersCount = 0;
            try {
                const openOrdersReq = await service.getOrders([
                    Query.equal('ordercomplete', 'no') 
                ]);
                openOrdersCount = openOrdersReq.total;
            } catch (err) {
                openOrdersCount = 0; 
            }

            // --- 2. ACTIVE INVENTORY VALUE ---
            const inventoryReq = await service.getPaintings([
                Query.equal('isSold', false),
                Query.limit(100) 
            ]);
            
            const inventoryValue = inventoryReq.documents.reduce((acc, item) => {
                const originalPrice = parseFloat(item.priceusd) || 0;
                const discount = parseFloat(item.discountusd) || 0;
                const finalPrice = discount > 0 
                    ? originalPrice - (originalPrice * discount / 100) 
                    : originalPrice;
                return acc + finalPrice;
            }, 0);


            // --- 3. TOTAL REVENUE (30d) ---
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const revenueReq = await service.getOrders([
                Query.equal('status', 'Paid'),
                Query.greaterThanEqual('$createdAt', thirtyDaysAgo.toISOString()),
                Query.limit(100)
            ]);

            const totalRevenue30d = revenueReq.documents.reduce((acc, order) => {
                return acc + (parseFloat(order.amount) || 0);
            }, 0);


            // --- 4. RECENT ORDERS (Last 5) ---
            const recentReq = await service.getOrders([
                Query.orderDesc('$createdAt'),
                Query.limit(5)
            ]);


            // --- 5. GRAPH DATA ---
            const chartData = [
                { label: 'Jul', value: 1200 },
                { label: 'Aug', value: 2100 },
                { label: 'Sep', value: 800 },
                { label: 'Oct', value: 1600 },
                { label: 'Nov', value: 2400 },
                { label: 'Dec', value: totalRevenue30d || 500 }
            ];

            setStats({
                totalRevenue: totalRevenue30d,
                activeInventoryValue: inventoryValue,
                openOrders: openOrdersCount,
                totalOrders: recentReq.total
            });
            setRecentOrders(recentReq.documents);
            setGraphData(chartData);

        } catch (error) {
            console.error("Dashboard Error:", error);
        } finally {
            setLoading(false);
        }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
      if (!dateString) return "N/A";
      return new Date(dateString).toLocaleDateString("en-US", {
          month: 'short', day: 'numeric'
      });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex font-sans text-charcoal">
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#F9F7F2] border-r border-[#EBE7DE] fixed h-full hidden md:flex flex-col z-20">
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        
        <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-serif text-charcoal">Dashboard</h2>
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                Last updated: {lastUpdated}
            </div>
        </div>

        {loading ? (
             <div className="h-96 flex items-center justify-center">
                 <Loader2 className="animate-spin h-10 w-10 text-charcoal opacity-50" />
             </div>
        ) : (
            <>
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* 1. Revenue */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Revenue (30d)</h3>
                            <div className="p-2 bg-green-50 rounded-full text-green-600"><DollarSign size={20} /></div>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal">${stats.totalRevenue.toLocaleString()}</p>
                        <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><TrendingUp size={12} /> +12% from last month</p>
                    </div>

                    {/* 2. Inventory Value */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Inventory Value</h3>
                            <div className="p-2 bg-blue-50 rounded-full text-blue-600"><Palette size={20} /></div>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal">${stats.activeInventoryValue.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-2">Total USD value (after discounts)</p>
                    </div>

                    {/* 3. Open Orders */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Open Orders</h3>
                            <div className="p-2 bg-amber-50 rounded-full text-amber-600"><AlertCircle size={20} /></div>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal">{stats.openOrders}</p>
                        <p className="text-xs text-amber-600 mt-2">{stats.openOrders === 0 ? "All caught up!" : "Requires attention"}</p>
                    </div>

                    {/* 4. Total Orders */}
                    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sales</h3>
                            <div className="p-2 bg-purple-50 rounded-full text-purple-600"><Box size={20} /></div>
                        </div>
                        <p className="text-3xl font-serif font-bold text-charcoal">{stats.totalOrders}</p>
                        <p className="text-xs text-gray-400 mt-2">Lifetime orders processed</p>
                    </div>
                </div>

                {/* Main Layout: Graph Left, Table Right */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Left Column: Graph */}
                    <div className="lg:col-span-1 space-y-8">
                        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm h-full">
                            <h3 className="text-lg font-serif font-bold text-charcoal mb-6">Sales Overview</h3>
                            <SalesChart data={graphData} />
                        </div>
                    </div>

                    {/* Right Column: Recent Orders Table */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden h-full">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-serif font-bold text-charcoal">Recent Orders</h3>
                                <Link to="/admin/orders" className="text-xs font-medium text-gray-500 hover:text-charcoal flex items-center group">
                                    View All <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform"/>
                                </Link>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-charcoal border-b border-gray-200 text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold">ID</th>
                                            <th className="px-6 py-3 font-semibold">Date</th>
                                            <th className="px-6 py-3 font-semibold">Customer</th>
                                            <th className="px-6 py-3 font-semibold">Status</th>
                                            <th className="px-6 py-3 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {recentOrders.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="p-6 text-sm text-gray-400 text-center">No recent orders.</td>
                                            </tr>
                                        ) : (
                                            recentOrders.map((order) => {
                                                 const orderTotal = parseFloat(order.amount) || 0;
                                                 const currency = orderTotal > 5000 ? '₹' : '$';

                                                return (
                                                    <tr key={order.$id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 font-medium text-charcoal truncate max-w-[80px]" title={order.$id}>
                                                            #{order.$id.substring(0, 8)}...
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-500">
                                                            {formatDate(order.$createdAt)}
                                                        </td>
                                                        <td className="px-6 py-4 text-charcoal font-medium">
                                                            {order.customerName || "Guest"}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <StatusBadge status={order.status} />
                                                        </td>
                                                        <td className="px-6 py-4 text-right font-medium text-charcoal font-serif">
                                                            {currency}{orderTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;