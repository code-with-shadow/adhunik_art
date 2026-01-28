import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { removeFromCart, clearCart } from "../store/cartSlice";
import functionService from "../backend/payment_func"; 
import authService from "../backend/auth";
import service from "../backend/config"; 
import OptimizedImage from "../components/OptimizedImage";
import { Loader2, ShieldCheck, Trash2, ShoppingBag, ChevronLeft } from 'lucide-react';
import { COUNTRIES, SHIPPING_RATES } from '../constants/countries';

const Checkout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // 1. Get Cart Items
  const cartItems = useSelector(state => state.cart.cartItems);
  
  const [user, setUser] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [shippingCost, setShippingCost] = useState(0);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [useExistingAddress, setUseExistingAddress] = useState(null);
  
  // 2. Calculate Totals with Discount Support
  const subtotal = cartItems.reduce((sum, item) => {
    const originalPrice = Number(item.price);
    const discount = item.discount ? parseInt(item.discount) : 0;
    const finalPrice = discount > 0 
      ? originalPrice - (originalPrice * discount / 100)
      : originalPrice;
    return sum + finalPrice;
  }, 0);
  const totalPrice = subtotal + shippingCost;

  // Shipping State
  const [shippingInfo, setShippingInfo] = useState({
    firstName: '', lastName: '', address: '', country: '', state: '', city: '', phone: '', email: '', zipCode: ''
  });

  // 3. Check Auth & Address Modal
  useEffect(() => {
    const checkAuth = async () => {
        try {
            const userData = await authService.getCurrentUser();
            if (!userData) {
                navigate('/login');
            } else {
                setUser(userData);
                
                // Auto-populate country and calculate shipping
                let cost = 0;
                const userCountry = userData.country || '';
                if (userCountry) {
                    cost = SHIPPING_RATES[userCountry] || SHIPPING_RATES["Other"];
                }
                
                // Pre-fill email, name, and country
                setShippingInfo(prev => ({ 
                    ...prev, 
                    email: userData.email, 
                    firstName: userData.name.split(' ')[0],
                    lastName: userData.name.split(' ')[1] || '',
                    country: userCountry
                }));
                
                setShippingCost(cost);

                // If user has saved address, show modal
                if (userData.address && userData.address.trim()) {
                    setShowAddressModal(true);
                }
            }
        } catch (error) {
            console.error(error);
        }
    };
    checkAuth();
  }, [navigate]);

  // 4. Handle Address Modal (Use existing or enter new)
  const handleAddressModalChoice = async (useExisting) => {
    if (useExisting && user.address) {
      // Parse saved address (assuming it's stored as a string)
      const [firstName, lastName, address, city, state, zipCode, phone] = user.address.split('|');
      setShippingInfo(prev => ({
        ...prev,
        firstName: firstName || prev.firstName,
        lastName: lastName || '',
        address: address || '',
        city: city || '',
        state: state || '',
        zipCode: zipCode || '',
        phone: phone || ''
      }));
    }
    setShowAddressModal(false);
  };

  // 5. Save address after order (update user schema)
  const saveAddressToProfile = async () => {
    if (!user) return;
    const addressString = `${shippingInfo.firstName}|${shippingInfo.lastName}|${shippingInfo.address}|${shippingInfo.city}|${shippingInfo.state}|${shippingInfo.zipCode}|${shippingInfo.phone}`;
    try {
      await authService.updateUserAddress(user.$id, addressString);
    } catch (err) {
      console.warn("Could not save address to profile:", err);
    }
  };

  // 6. Handle Country & Shipping Cost
  const handleCountryChange = (e) => {
    const selectedCountry = e.target.value;
    let cost = 0;
    if (selectedCountry) {
        cost = SHIPPING_RATES[selectedCountry] || SHIPPING_RATES["Other"];
    }
    setShippingInfo({ ...shippingInfo, country: selectedCountry });
    setShippingCost(cost);
  };

  // 7. Handle Remove Item
  const handleRemoveItem = (id) => {
      dispatch(removeFromCart(id));
  };

  // 8. Handle PayPal Approval
  const handleApprove = async (data, actions) => {
    setProcessing(true);
    try {
      // Save address to user profile before payment
      await saveAddressToProfile();

      const result = await functionService.verifyPayment({
        orderID: data.orderID,
        userId: user.$id,
        totalPaid: totalPrice,
        items: cartItems.map(item => item.$id) 
      });

      if (result.success) {
        dispatch(clearCart()); 
        navigate('/success', { state: { orderId: result.orderId } });
      } else {
        alert("Payment Verification Failed: " + result.message);
      }
    } catch (error) {
      console.error("Payment Error", error);
      alert("An error occurred during payment processing.");
    } finally {
      setProcessing(false);
    }
  };

  // --- EMPTY CART STATE ---
  if (cartItems.length === 0) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
              <ShoppingBag className="h-16 w-16 text-gray-300 mb-4"/>
              <h2 className="text-2xl font-serif text-charcoal mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-6">Looks like you haven't added any art yet.</p>
              <button 
                onClick={() => navigate('/shop')} 
                className="px-6 py-3 bg-charcoal text-white rounded-sm font-medium hover:bg-gray-800 transition"
              >
                Continue Shopping
              </button>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full animate-in fade-in">
            <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Shipping Address</h2>
            <p className="text-gray-600 mb-6">We found a saved address from your previous order. Would you like to use it?</p>
            
            {user?.address && (
              <div className="bg-gray-50 p-4 rounded-md mb-6 border border-gray-200 space-y-2">
                <p className="text-sm text-charcoal font-medium">
                  {user.address.split('|')[0]} {user.address.split('|')[1]}
                </p>
                <p className="text-sm text-gray-600">{user.address.split('|')[2]}</p>
                <p className="text-sm text-gray-600">
                  {user.address.split('|')[3]}, {user.address.split('|')[4]} {user.address.split('|')[5]}
                </p>
                {user.address.split('|')[6] && (
                  <p className="text-sm text-gray-600">
                    Phone: {user.address.split('|')[6]}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => handleAddressModalChoice(true)}
                className="flex-1 bg-charcoal text-white py-3 rounded-sm font-medium hover:bg-gray-800 transition"
              >
                Use This Address
              </button>
              <button
                onClick={() => handleAddressModalChoice(false)}
                className="flex-1 border-2 border-charcoal text-charcoal py-3 rounded-sm font-medium hover:bg-gray-50 transition"
              >
                Enter New Address
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        
        {/* 👇 NEW BACK BUTTON */}
        <button 
            onClick={() => navigate(-1)} 
            className="group flex items-center text-sm text-gray-500 hover:text-charcoal transition mb-8"
        >
            <ChevronLeft className="h-4 w-4 mr-1 transition-transform group-hover:-translate-x-1" />
            Back
        </button>

        <div className="mb-10 text-center md:text-left">
           <h1 className="text-3xl font-serif text-charcoal">Checkout</h1>
        </div>

        <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
          
          {/* LEFT COLUMN: Order Summary */}
          <section className="lg:col-span-5 order-2 lg:order-1 mt-10 lg:mt-0">
             <div className="bg-white p-6 shadow-sm border border-gray-100 rounded-sm">
                <h2 className="text-xl font-serif text-charcoal mb-6">Order Summary ({cartItems.length})</h2>
                
                <div className="space-y-6 mb-6">
                    {cartItems.map((item) => {
                        const originalPrice = Number(item.price);
                        const discount = item.discount ? parseInt(item.discount) : 0;
                        const finalPrice = discount > 0 
                          ? originalPrice - (originalPrice * discount / 100)
                          : originalPrice;
                        
                        return (
                        <div key={item.$id} className="flex gap-4 py-4 border-b border-gray-50 last:border-0 relative group">
                            
                            <div className="w-20 flex-shrink-0 overflow-hidden rounded-sm  ">
                                <OptimizedImage
                                  src={service.getThumbnail(item.imageUrl)} 
                                  alt={item.title}
                                  className="w-full h-auto object-cover block border"
                                />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-medium text-charcoal text-sm">{item.title}</h3>
                                    <button 
                                        onClick={() => handleRemoveItem(item.$id)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                
                                {/* Price with Discount */}
                                <div className="flex items-center gap-2 mt-2">
                                    {discount > 0 && (
                                        <>
                                            <p className="text-xs text-gray-400 line-through decoration-gray-400">
                                                ${originalPrice.toLocaleString()}
                                            </p>
                                            <span className="text-red-600 text-xs font-bold">{discount}% OFF</span>
                                        </>
                                    )}
                                    <p className="font-serif font-bold text-sm text-charcoal">
                                        ${finalPrice.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        );
                    })}
                </div>

                <div className="space-y-4 py-6 border-t border-gray-100">
                    <div className="flex justify-between text-base text-gray-600">
                        <p>Subtotal</p>
                        <p>${subtotal.toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between text-base text-gray-600">
                        <p>Shipping {shippingInfo.country && `(${shippingInfo.country})`}</p>
                        <p className={shippingCost === 0 ? "text-gray-400 italic" : "text-charcoal font-medium"}>
                            {shippingInfo.country ? `$${shippingCost.toFixed(2)}` : "--"}
                        </p>
                    </div>
                </div>

                <div className="flex justify-between py-6 text-xl font-serif font-bold text-charcoal border-t border-gray-100">
                    <p>Total</p>
                    <p>${totalPrice.toLocaleString()}</p>
                </div>
             </div>
          </section>

          {/* RIGHT COLUMN: Checkout Form */}
          <section className="lg:col-span-7 order-1 lg:order-2">
            <h2 className="text-2xl font-serif text-charcoal mb-6">Shipping Address</h2>
            
            <form className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="First Name" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.firstName}
                        onChange={(e) => setShippingInfo({...shippingInfo, firstName: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Last Name" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.lastName}
                        onChange={(e) => setShippingInfo({...shippingInfo, lastName: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <select 
                            className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition appearance-none"
                            value={shippingInfo.country}
                            onChange={handleCountryChange}
                        >
                            <option value="" disabled>Select Country</option>
                            {COUNTRIES.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                           <svg className="fill-current h-4 w-4" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <input 
                        type="text" placeholder="State / Province" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.state}
                        onChange={(e) => setShippingInfo({...shippingInfo, state: e.target.value})}
                    />
                </div>

                <input 
                    type="text" placeholder="Street Address" 
                    className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                    value={shippingInfo.address}
                    onChange={(e) => setShippingInfo({...shippingInfo, address: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="City" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.city}
                        onChange={(e) => setShippingInfo({...shippingInfo, city: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Zip / Postal Code" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.zipCode}
                        onChange={(e) => setShippingInfo({...shippingInfo, zipCode: e.target.value})}
                    />
                </div>

                <div className="space-y-4">
                    <input 
                        type="tel" placeholder="Phone" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.phone}
                        onChange={(e) => setShippingInfo({...shippingInfo, phone: e.target.value})}
                    />
                    <input 
                        type="email" placeholder="Email address" 
                        className="w-full border border-gray-300 p-3 rounded-sm bg-[#FDFBF7] focus:bg-white focus:border-charcoal outline-none transition"
                        value={shippingInfo.email}
                        onChange={(e) => setShippingInfo({...shippingInfo, email: e.target.value})}
                    />
                </div>

                <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-charcoal mb-4">Payment Method</h3>
                    
                    {paymentMethod === 'paypal' ? (
                         !shippingInfo.country ? (
                            <div className="bg-yellow-50 text-yellow-800 p-3 text-sm rounded-sm text-center">
                                Please select a <strong>Country</strong> to calculate shipping before paying.
                            </div>
                         ) : (
                            <div className="relative z-0">
                                {processing ? (
                                    <div className="text-center py-4 bg-gray-50 rounded-md">
                                        <Loader2 className="animate-spin h-6 w-6 mx-auto mb-2 text-charcoal"/>
                                        <p className="text-sm text-gray-600">Processing secure transaction...</p>
                                    </div>
                                ) : (
                                    <PayPalButtons 
                                        key={`${shippingInfo.country}-${totalPrice}`} 
                                        style={{ layout: "vertical", shape: "rect", height: 48 }}
                                        createOrder={(data, actions) => {
                                            return actions.order.create({
                                                purchase_units: [{
                                                    description: `Art Order - Shipping to ${shippingInfo.country}`,
                                                    amount: { 
                                                        value: totalPrice.toFixed(2)
                                                    }
                                                }]
                                            });
                                        }}
                                        onApprove={handleApprove}
                                        onError={(err) => {
                                            console.error("PayPal Error:", err);
                                            alert("Payment could not be processed.");
                                        }}
                                    />
                                )}
                            </div>
                         )
                    ) : (
                        <div className="p-4 bg-gray-50 rounded-sm border border-gray-200 text-sm text-gray-600">
                             Direct card payments are disabled. Please select PayPal to pay with Credit/Debit card securely.
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs mt-4">
                    <ShieldCheck className="h-3 w-3"/>
                    <span>Secure SSL Encrypted Transaction</span>
                </div>

            </form>
          </section>

        </div>
      </div>
    </div>
  );
};

export default Checkout;