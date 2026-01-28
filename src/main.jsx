import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import store from './store/store.js';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

// 👇 1. Import PayPal Provider
import { PayPalScriptProvider } from "@paypal/react-paypal-js";

import AuthLayout from './components/AuthLayout.jsx';

// --- LAZY LOAD PAGES (Performance Optimization) ---
const HomePage = React.lazy(() => import('./pages/HomePage.jsx'));
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Signup = React.lazy(() => import('./pages/Signup.jsx'));
const Shop = React.lazy(() => import('./pages/Shop.jsx'));
const ProductDetails = React.lazy(() => import('./pages/ProductDetails.jsx'));
const Checkout = React.lazy(() => import('./pages/Checkout.jsx'));
const AdminUpload = React.lazy(() => import('./pages/AdminUpload.jsx'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard.jsx'));
const AdminProducts = React.lazy(() => import('./pages/AdminProducts.jsx'));
const AdminOders = React.lazy(() => import('./pages/AdminOders.jsx'));
const AdminCustomers = React.lazy(() => import('./pages/AdminCustomers.jsx'));

// About Page - Simple Component (no separate file needed)
const About = () => (
  <div className="min-h-screen bg-[#FDFBF7] px-4 py-12">
    <div className="max-w-4xl mx-auto">
      <h1 className="text-4xl font-serif text-charcoal mb-6">About Artisan Canvas</h1>
      <p className="text-gray-600 text-lg leading-relaxed mb-4">
        Welcome to Artisan Canvas, your destination for curated fine art and contemporary paintings.
      </p>
      <p className="text-gray-600 text-lg leading-relaxed">
        We believe in supporting artists and bringing exceptional artwork into homes and spaces worldwide.
      </p>
    </div>
  </div>
);

// Simple Loading Spinner for Lazy Pages
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-[#FDFBF7]">
     <div className="animate-spin h-10 w-10 border-4 border-charcoal border-t-transparent rounded-full"></div>
  </div>
);

// 👇 2. Define PayPal Options
const initialPayPalOptions = {
    "client-id": "test", // ⚠️ REPLACE "test" WITH YOUR REAL PAYPAL CLIENT ID WHEN READY
    currency: "USD",
    intent: "capture",
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      // 1. Public Routes
      { 
        path: "/", 
        element: (
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        ) 
      },
      { 
        path: "/shop", 
        element: (
          <Suspense fallback={<PageLoader />}>
            <Shop />
          </Suspense>
        ) 
      },
      { 
        path: "/about", 
        element: <About />
      },
      { 
        path: "/product/:paintingId", 
        element: (
          <Suspense fallback={<PageLoader />}>
            <ProductDetails />
          </Suspense>
        ) 
      },

      // 2. Auth Routes (Accessible ONLY if NOT logged in)
      { 
        path: "/login", 
        element: (
          <AuthLayout authentication={false}>
            <Suspense fallback={<PageLoader />}>
               <Login />
            </Suspense>
          </AuthLayout>
        )
      },
      { 
        path: "/signup", 
        element: (
          <AuthLayout authentication={false}>
             <Suspense fallback={<PageLoader />}>
                <Signup />
             </Suspense>
          </AuthLayout>
        )
      },

      // 3. Protected Routes (Accessible ONLY if logged in)
      { 
        path: "/checkout", 
        element: (
            // 👇 SECURITY: Redirects to Login if not authenticated
            <AuthLayout authentication={true}>
              <Suspense fallback={<PageLoader />}>
                  <Checkout />
              </Suspense>
            </AuthLayout>
        ) 
      },

      // 4. Admin Routes (Accessible ONLY if Logged In + Is Admin)
      { 
        path: "/admin", 
        element: (
            // 👇 SECURITY: Redirects to Home if not Admin
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </AuthLayout>
        ) 
      },
      { 
        path: "/admin/dashboard", 
        element: (
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminDashboard />
              </Suspense>
            </AuthLayout>
        ) 
      },
      { 
        path: "/admin/upload", 
        element: (
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminUpload />
              </Suspense>
            </AuthLayout>
        ) 
      },
      { 
        path: "/admin/products", 
        element: (
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminProducts />
              </Suspense>
            </AuthLayout>
        ) 
      },
      { 
        path: "/admin/orders", 
        element: (
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminOders />
              </Suspense>
            </AuthLayout>
        ) 
      },
      { 
        path: "/admin/customers", 
        element: (
            <AuthLayout authentication={true} adminOnly={true}>
              <Suspense fallback={<PageLoader />}>
                <AdminCustomers />
              </Suspense>
            </AuthLayout>
        ) 
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* 👇 3. Wrap Router with PayPalScriptProvider */}
      <PayPalScriptProvider options={initialPayPalOptions}>
        <RouterProvider router={router} />
      </PayPalScriptProvider>
    </Provider>
  </React.StrictMode>,
);