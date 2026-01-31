import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js"; 
import { removeFromCart, clearCart, syncCartAvailability } from "../store/cartSlice.js";
import authService from "../backend/auth.js";
import service from "../backend/config.js"; 
import conf from "../conf/conf.js"; 
import { Query } from 'appwrite';
import OptimizedImage from "../components/OptimizedImage";
import { Loader2, Trash2, ShoppingBag, ChevronLeft, AlertTriangle, Truck } from 'lucide-react';
import { COUNTRIES, SHIPPING_RATES_USD, SHIPPING_RATES_INR } from '../constants/countries.js';

// 💱 Approximate Exchange Rate
const EXCHANGE_RATE = 84; 

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 1. Get Cart Items
  const cartItems = useSelector(state => state.cart.cartItems);
  
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [checkingStock, setCheckingStock] = useState(true);
  const [shippingCost, setShippingCost] = useState(0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  // We use "USD" internally for PayPal to avoid 422 Errors
  const [displayCurrency, setDisplayCurrency] = useState("USD"); 

  const [shippingInfo, setShippingInfo] = useState({
    firstName: '', lastName: '', address: '', country: '', state: '', city: '', phone: '', email: '', zipCode: ''
  });

  // --- 🔄 LIVE STOCK CHECK (The UI Updater) ---
  // This function fetches the latest DB status and forces Redux to update.
  // It does NOT process payments. It only updates the UI.
  const verifyStock = useCallback(async () => {
    if (cartItems.length === 0) {
        setCheckingStock(false);
        return;
    }
    
    // Don't set full page loading, just background check
    try {
        const ids = cartItems.map(item => item.$id);
        const response = await service.getPaintings([
            Query.equal('$id', ids)
        ]);

        if (response.documents.length > 0) {
            // This updates Redux -> Which triggers the React UI to re-render -> Showing "SOLD" overlay
            dispatch(syncCartAvailability(response.documents));
        }
    } catch (error) {
        console.error("Stock check failed:", error);
    } finally {
        setCheckingStock(false);
    }
  }, [cartItems, dispatch]);

  // Run verifyStock once when page loads
  useEffect(() => {
    verifyStock();
  }, [dispatch]); 


  // 2. PRICE CALCULATION
  const getItemPrice = (item, isIndia) => {
      // If sold, it costs 0
      if (item.isSold) return 0;

      const originalPrice = isIndia ? (item.pricein || 0) : (item.priceusd || 0);
      const discountPercent = item.discountusd || 0; 
      let finalPrice = originalPrice;
      if (discountPercent > 0) {
          finalPrice = originalPrice - (originalPrice * discountPercent / 100);
      }
      return finalPrice;
  };

  const isIndia = shippingInfo.country === "India";
  
  // Only include UNSOLD items in total
  const availableItems = cartItems.filter(item => !item.isSold);
  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item, isIndia), 0);
  const finalShippingCost = availableItems.length > 0 ? shippingCost : 0;
  const totalPrice = subtotal + finalShippingCost;
  const currencySymbol = isIndia ? "₹" : "$";


  // 3. AUTH & SETUP
  useEffect(() => {
    const checkAuth = async () => {
        try {
            const userData = await authService.getCurrentUser();
            if (!userData) {
                navigate('/login');
            } else {
                setUser(userData);
                const userCountry = userData.country || '';
                let cost = 0;
                
                if (userCountry) {
                    if (userCountry === "India") {
                        cost = SHIPPING_RATES_INR["India"] || 0;
                        setDisplayCurrency("INR");
                    } else {
                        cost = SHIPPING_RATES_USD[userCountry] || SHIPPING_RATES_USD["Other"];
                        setDisplayCurrency("USD");
                    }
                }
                
                setShippingInfo(prev => ({ 
                    ...prev, 
                    email: userData.email, 
                    firstName: userData.name.split(' ')[0],
                    lastName: userData.name.split(' ')[1] || '',
                    country: userCountry
                }));
                setShippingCost(cost);
                if (userData.address && userData.address.trim()) setShowAddressModal(true);
            }
        } catch (error) { console.error(error); }
    };
    checkAuth();
  }, [navigate]);

  const handleAddressModalChoice = async (useExisting) => {
    if (useExisting && user.address) {
      const [firstName, lastName, address, city, state, zipCode, phone] = user.address.split('|');
      setShippingInfo(prev => ({ ...prev, firstName, lastName, address, city, state, zipCode, phone }));
    }
    setShowAddressModal(false);
  };

  const saveAddressToProfile = async () => {
    if (!user) return;
    const addressString = `${shippingInfo.firstName}|${shippingInfo.lastName}|${shippingInfo.address}|${shippingInfo.city}|${shippingInfo.state}|${shippingInfo.zipCode}|${shippingInfo.phone}`;
    try { await authService.updateUserAddress(user.$id, addressString); } 
    catch (err) { console.warn("Could not save address:", err); }
  };

  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    let cost = 0;
    if (selectedCountry === "India") {
        cost = SHIPPING_RATES_INR["India"] || 0;
        setDisplayCurrency("INR");
    } else {
        cost = SHIPPING_RATES_USD[selectedCountry] || SHIPPING_RATES_USD["Other"];
        setDisplayCurrency("USD");
    }
    setShippingInfo({ ...shippingInfo, country: selectedCountry });
    setShippingCost(cost);
  };

  const handleRemoveItem = (id) => dispatch(removeFromCart(id));

  // --- 4. CASH ON DELIVERY (COD) ---
  const handleCODOrder = async () => {
    setProcessing(true);
    try {
        await saveAddressToProfile();
        
        await service.createCODOrder({
            userId: user.$id,
            items: availableItems.map(item => item.$id),
            customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
            email: shippingInfo.email,
            shippingDetails: shippingInfo
        });

        dispatch(clearCart());
        navigate('/orders'); // Go to Orders page
    } catch (error) {
        console.error("COD Error:", error);
        alert(`Order Failed: ${error.message}`);
        // ⚠️ FORCE UI UPDATE: If failed because sold, this updates the UI to show red SOLD badge
        await verifyStock(); 
    } finally {
        setProcessing(false);
    }
  };

  // --- 5. PAYPAL HANDLER ---
  const handleApprove = async (data, actions) => {
    setProcessing(true);
    try {
      await saveAddressToProfile();
      const orderID = data.orderID;
      
      const chargedAmount = isIndia ? (totalPrice / EXCHANGE_RATE).toFixed(2) : totalPrice.toFixed(2);

      const result = await service.verifyPayment({
        orderID: orderID,
        userId: user.$id,
        items: availableItems.map(item => item.$id),
        shippingDetails: shippingInfo,
        customerName: `${shippingInfo.firstName} ${shippingInfo.lastName}`,
        email: shippingInfo.email,
        totalPaid: chargedAmount,
        currency: "USD" 
      });

      if (result.success) {
        dispatch(clearCart()); 
        navigate('/orders', { state: { orderId: result.orderId } });
      } else {
        // Backend returned success: false
        throw new Error(result.message || "Payment verification failed.");
      }
    } catch (error) {
      console.error("Payment Error:", error);
      alert(`Payment could not be processed: ${error.message}`);
      
      // ⚠️ FORCE UI UPDATE
      // This fetches the DB status. If it says "Sold", Redux updates, and the UI immediately turns grey/red.
      await verifyStock(); 
      
    } finally {
      setProcessing(false);
    }
  };

  // --- RENDER ---
  if (cartItems.length === 0) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4"/>
              <h2 className="text-2xl font-serif text-charcoal mb-2">Your cart is empty</h2>
              <button onClick={() => navigate('/shop')} className="px-6 py-3 bg-charcoal text-white rounded-sm font-medium hover:bg-gray-800 transition">Continue Shopping</button>
          </div>
      );
  }

  // Calculate amount to send to PayPal (Always USD to prevent 422)
  const paymentAmountUSD = isIndia ? (totalPrice / EXCHANGE_RATE).toFixed(2) : totalPrice.toFixed(2); 

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      {/* ... Address Modal ... */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Shipping Address</h2>
            <p className="text-gray-600 mb-6">We found a saved address from your previous order. Would you like to use it?</p>
            {user?.address && (
              <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200 space-y-2">
                <p className="text-sm text-charcoal font-medium">{user.address.split('|')[0]} {user.address.split('|')[1]}</p>
                <p className="text-sm text-gray-600">{user.address.split('|')[2]}, {user.address.split('|')[3]}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => handleAddressModalChoice(true)} className="flex-1 bg-charcoal text-white py-3 rounded-sm font-medium hover:bg-gray-800 transition">Use This Address</button>
              <button onClick={() => handleAddressModalChoice(false)} className="flex-1 border-2 border-charcoal text-charcoal py-3 rounded-sm font-medium hover:bg-gray-50 transition">Enter New Address</button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate(-1)} className="group flex items-center text-sm text-gray-500 hover:text-charcoal transition mb-8">
            <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" /> Back
        </button>

        <div className="mb-10 text-center md:text-left">
           <h1 className="text-3xl font-serif text-charcoal">Checkout</h1>
           {checkingStock && <p className="text-sm text-gray-500 flex items-center gap-2 mt-2"><Loader2 className="animate-spin h-4 w-4"/> Updating availability...</p>}
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          
          {/* LEFT: Order Summary */}
          <section className="lg:col-span-5 order-2 lg:order-1 mt-10 lg:mt-0">
             <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-sm">
                <h2 className="text-xl font-serif text-charcoal mb-6">Order Summary ({cartItems.length})</h2>
                <div className="space-y-6 mb-6">
                    {cartItems.map((item) => {
                         const itemPrice = getItemPrice(item, isIndia);
                         const isSold = item.isSold; 
                        return (
                        <div key={item.$id} className={`flex gap-4 py-4 border-b border-gray-50 last:border-0 relative group ${isSold ? 'opacity-60 grayscale' : ''}`}>
                            <div className="w-20 flex-shrink-0 overflow-hidden rounded-sm relative">
                                <OptimizedImage src={service.getThumbnail(item.imageUrl)} alt={item.title} className="w-full h-auto object-cover block border" />
                                {isSold && (
                                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                        <span className="text-[10px] font-bold text-white bg-red-600 px-2 py-1">SOLD</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-charcoal text-sm">{item.title}</h3>
                                    {/* 🔴 1. RED TRASH ICON */}
                                    <button onClick={() => handleRemoveItem(item.$id)} className="text-gray-400 hover:text-red-600 transition p-1"><Trash2 className="h-4 w-4" /></button>
                                </div>
                                {isSold ? (
                                    <div className="mt-2 text-xs text-red-600 font-bold flex items-center gap-1">
                                        <AlertTriangle size={12} />
                                        Sold Out - Please remove
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 mt-2">
                                        <p className="font-serif font-bold text-sm text-charcoal">{currencySymbol}{itemPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        );
                    })}
                </div>

                {availableItems.length > 0 ? (
                    <>
                        <div className="space-y-4 py-6 border-t border-gray-100">
                            <div className="flex justify-between text-base text-gray-600"><p>Subtotal</p><p>{currencySymbol}{subtotal.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                            <div className="flex justify-between text-base text-gray-600"><p>Shipping</p><p>{shippingInfo.country ? `${currencySymbol}${shippingCost.toFixed(2)}` : "--"}</p></div>
                        </div>
                        <div className="flex justify-between py-6 text-xl font-serif font-bold text-charcoal border-t border-gray-100"><p>Total</p><p>{currencySymbol}{totalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}</p></div>
                    </>
                ) : (
                    <div className="p-4 bg-red-50 text-red-700 text-center text-sm border border-red-100 rounded-sm">
                        All items are sold out. Remove them to continue.
                    </div>
                )}
             </div>
          </section>

          {/* RIGHT: Form Section */}
          <section className="lg:col-span-7 order-1 lg:order-2">
            <h2 className="text-2xl font-serif text-charcoal mb-6">Shipping Address</h2>
            <form className="space-y-6">
                {/* ... (Form Inputs unchanged) ... */}
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="First Name" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.firstName} onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}/>
                    <input type="text" placeholder="Last Name" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.lastName} onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}/>
                </div>
                <div className="grid grid-cols-2 gap-4">
                     <select className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.country} onChange={handleCountryChange}>
                        <option value="" disabled>Select Country</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                     </select>
                     <input type="text" placeholder="State" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.state} onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}/>
                </div>
                <input type="text" placeholder="Address" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.address} onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}/>
                <div className="grid grid-cols-2 gap-4">
                     <input type="text" placeholder="City" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.city} onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}/>
                     <input type="text" placeholder="Zip Code" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.zipCode} onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}/>
                </div>
                <div className="space-y-4">
                     <input type="tel" placeholder="Phone" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.phone} onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}/>
                     <input type="email" placeholder="Email" className="w-full border border-gray-300 p-3 rounded-sm" value={shippingInfo.email} onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}/>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-charcoal mb-4">Payment Method</h3>
                    
                    {availableItems.length === 0 ? (
                         <div className="bg-gray-100 text-gray-500 p-4 text-center rounded-sm">
                            Payment unavailable (Items sold out)
                         </div>
                    ) : !shippingInfo.country ? (
                        <div className="bg-yellow-50 text-yellow-800 p-3 text-sm rounded-sm text-center">Please select a <strong>Country</strong> to calculate shipping.</div>
                    ) : (
                        <div className="space-y-4">
                            
                            {/* 🟡 3. COD BUTTON (INDIA ONLY) */}
                            {shippingInfo.country === 'India' && (
                                <button 
                                    type="button" 
                                    onClick={handleCODOrder}
                                    disabled={processing}
                                    className="w-full bg-[#FFC439] hover:bg-[#F4BB2E] text-charcoal font-bold py-3 rounded-sm shadow-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {processing ? <Loader2 className="animate-spin h-5 w-5" /> : <><Truck size={20}/> Place Order (Cash on Delivery)</>}
                                </button>
                            )}

                            {/* PayPal Button */}
                            <div className="relative z-0">
                                {processing && shippingInfo.country !== 'India' ? (
                                    <div className="text-center py-4 bg-gray-50 rounded-md"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2"/><p>Processing...</p></div>
                                ) : (
                                    // Always force USD context for PayPal script to avoid 422 error
                                    <PayPalScriptProvider options={{ "client-id": conf.appwritePaypalClientId, currency: "USD", intent: "capture" }}>
                                        <PayPalButtons 
                                            style={{ layout: "vertical", shape: "rect", height: 48 }}
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    purchase_units: [{
                                                        description: `Art Order - Shipping to ${shippingInfo.country}`,
                                                        amount: { currency_code: "USD", value: paymentAmountUSD }
                                                    }]
                                                });
                                            }}
                                            onApprove={handleApprove}
                                            onError={(err) => { 
                                                console.error(err); 
                                                alert("Payment failed. Updating stock status...");
                                                verifyStock(); // ⚠️ FORCE UI UPDATE ON ERROR
                                            }}
                                        />
                                    </PayPalScriptProvider>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Checkout;