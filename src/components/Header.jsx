import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import authService from '../backend/auth';
import { Menu, X, UserCircle, LayoutDashboard } from 'lucide-react'; // Added LayoutDashboard icon
import cartImage from '../assets/cart2.png';

const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get data from Redux Store
  const authStatus = useSelector((state) => state.auth.status);
  const userData = useSelector((state) => state.auth.userData); 
  const cartItems = useSelector((state) => state.cart.cartItems); 

  // 👇 ADMIN CHECK LOGIC
  const ADMIN_EMAIL = "s9618137@gmail.com";
  const isAdmin = userData?.email === ADMIN_EMAIL;

  const navItems = [
    { name: 'Home', slug: '/' },
    { name: 'Shop', slug: '/shop' },
    { name: 'About', slug: '/about' },
    { name: 'Oders', slug: '/orders' },
  ];

  const handleLogout = () => {
    authService.logout().then(() => {
      dispatch(logout());
      navigate('/login');
      setIsMobileMenuOpen(false);
    });
  };

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* 1. Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="text-2xl font-serif font-bold text-charcoal tracking-tight">
              Artisan<span className="text-gold">Canvas</span>
            </Link>
          </div>

          {/* 2. Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 items-center">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.slug}
                className="text-gray-500 hover:text-charcoal px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                {item.name}
              </Link>
            ))}
            
            {/* 👇 UPDATED ADMIN LINK: Points to /admin (Dashboard) */}
            {isAdmin && (
                <Link 
                    to="/admin" 
                    className="flex items-center gap-2 text-charcoal hover:bg-gray-50 px-3 py-2 text-sm font-bold border border-charcoal rounded-md transition-colors"
                >
                    <LayoutDashboard size={16} />
                    Dashboard
                </Link>
            )}
          </nav>

          {/* 3. Right Side Icons (Cart & Auth) */}
          <div className="hidden md:flex items-center space-x-6">
            
            {/* Cart Icon */}
            <Link to="/checkout" className="relative text-gray-400 hover:text-charcoal transition">
              <img src={cartImage} alt="Cart" className="h-7 w-7 hover:opacity-80 transition" />
              {authStatus && cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              )}
            </Link>

            {/* Auth Section */}
            {authStatus ? (
              <div className="flex items-center gap-4">
                  {/* Show Email */}
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <UserCircle className="h-4 w-4"/>
                      {userData?.email}
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="bg-charcoal text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-opacity-90 transition"
                  >
                    Logout
                  </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                  <Link to="/login" className="text-charcoal hover:text-gold font-medium text-sm pt-2">Log in</Link>
                  <Link to="/signup" className="bg-charcoal text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-opacity-90">Sign up</Link>
              </div>
            )}
          </div>

          {/* 4. Mobile Menu Button */}
          <div className="flex items-center md:hidden">
             {/* Mobile Cart */}
             <Link to="/checkout" className="mr-4 relative text-gray-400 hover:text-charcoal">
              <img src={cartImage} alt="Cart" className="h-6 w-6 hover:opacity-80 transition" />
              {authStatus && cartItems?.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {cartItems.length}
                </span>
              )}
            </Link>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-400 hover:text-charcoal p-2"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 5. Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            
            {/* Show Email in Mobile Menu */}
            {authStatus && (
                <div className="px-3 py-2 text-sm text-gray-500 font-medium border-b border-gray-50 mb-2">
                    Signed in as: <br/> <span className="text-charcoal">{userData?.email}</span>
                </div>
            )}

            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.slug}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-charcoal hover:bg-gray-50"
              >
                {item.name}
              </Link>
            ))}
            
            {/* 👇 UPDATED MOBILE ADMIN LINK */}
            {isAdmin && (
                <Link 
                    to="/admin" 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="flex items-center gap-2 px-3 py-2 text-base font-bold text-charcoal bg-gray-50"
                >
                    <LayoutDashboard size={18} />
                    Admin Dashboard
                </Link>
            )}
            
            <div className="mt-4 pt-4 border-t border-gray-100">
                {authStatus ? (
                    <button onClick={handleLogout} className="w-full text-left block px-3 py-2 text-base font-medium text-red-600 hover:bg-gray-50">
                        Logout
                    </button>
                ) : (
                    <>
                        <Link to="/login" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50">Log in</Link>
                        <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 text-base font-medium text-gold hover:bg-gray-50">Sign up</Link>
                    </>
                )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;