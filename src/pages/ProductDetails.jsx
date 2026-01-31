import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import service from '../backend/config';
import { addToCart } from '../store/cartSlice';
import { useAuthCheck } from '../hooks/useAuthCheck';
import OptimizedImage from '../components/OptimizedImage';
import { Loader2, ChevronRight, ShoppingBag, CreditCard, ZoomIn, X, Palette, Heart, Truck, Lock, Info } from 'lucide-react';

const ProductDetails = () => {
  const { paintingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { checkAuth } = useAuthCheck();

  // 1. Auth & Location Logic
  const userData = useSelector((state) => state.auth.userData);
  const isUserFromIndia = userData?.country?.toLowerCase() === 'india';

  const [painting, setPainting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // 2. Fetch Data
  useEffect(() => {
    const fetchPainting = async () => {
      setLoading(true);
      try {
        const data = await service.getPainting(paintingId);
        if (!data) setError("Painting not found.");
        else {
          setPainting(data);
          setLikes(data.like || 0);
        }
      } catch (err) {
        setError("Failed to load painting details.");
      } finally {
        setLoading(false);
      }
    };
    if (paintingId) fetchPainting();
  }, [paintingId]);

  // 3. Price Calculation Logic (Dynamic)
  const currencySymbol = isUserFromIndia ? "₹" : "$";
  const rawPrice = isUserFromIndia ? (painting?.pricein || 0) : (painting?.priceusd || 0);
  const discountVal = isUserFromIndia ? (painting?.discountin || 0) : (painting?.discountusd || 0);
  
  const finalPrice = discountVal > 0 
    ? rawPrice - (rawPrice * discountVal / 100) 
    : rawPrice;

  // 4. Handlers
  const handleAddToCart = () => {
    if (!checkAuth()) return;
    if (painting.isSold) return;
    
    dispatch(addToCart({
        ...painting,
        finalPrice: finalPrice,
        currencySymbol: currencySymbol
    }));
    alert(`${painting.title} added to your cart!`);
  };

  const handleBuyNow = () => {
    if (!checkAuth()) return;
    if (painting.isSold) return;
    
    dispatch(addToCart({
        ...painting,
        finalPrice: finalPrice,
        currencySymbol: currencySymbol
    }));
    navigate('/checkout');
  };

  const handleLike = async () => {
    if (!painting) return;
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likes + 1 : likes - 1;
    setLikes(newLikeCount);
    setIsLiked(newIsLiked);
    try { await service.updateLikeCount(painting.$id, newLikeCount); } 
    catch (error) { setLikes(likes); setIsLiked(isLiked); }
  };

  // Helper to format date
  const formatDate = (dateString) => {
      if(!dateString) return '';
      return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF7]"><Loader2 className="animate-spin h-10 w-10 text-charcoal" /></div>;
  if (error || !painting) return <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-sans text-charcoal">

      {/* --- 🔭 FULL SCREEN LIGHTBOX (High Res) --- */}
      {isFullScreen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setIsFullScreen(false)}>
          <button className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-all z-[110]">
            <X size={32} />
          </button>
          <img 
            src={service.getFileView(painting.imageUrl)} // High Res View
            alt={painting.title} 
            className="max-h-[95vh] max-w-[95vw] object-contain shadow-2xl rounded-sm" 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        {/* Breadcrumbs */}
        <nav className="flex items-center text-sm text-gray-500 mb-8 space-x-2">
          <Link to="/" className="hover:text-charcoal transition">Home</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/shop" className="hover:text-charcoal transition">Shop</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-charcoal font-medium truncate">{painting.title}</span>
        </nav>

        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 items-start">
          {/* ---- LEFT: Image ---- */}
          <div className="flex flex-col space-y-8">
            <div 
              className="aspect-w-4 aspect-h-5 w-full overflow-hidden bg-gray-100 rounded-sm relative group cursor-zoom-in border border-gray-200 shadow-sm"
              onClick={() => setIsFullScreen(true)}
            >
              <OptimizedImage src={service.getThumbnail(painting.imageUrl)} alt={painting.title} className="w-full h-full" priority={true} />
              
              {painting.isSold && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="bg-red-600 text-white px-6 py-2 font-bold text-xl uppercase tracking-widest border-2 border-white">Sold Out</span>
                  </div>
              )}

              {!painting.isSold && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 text-charcoal px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg translate-y-4 group-hover:translate-y-0 transition-all">
                    <ZoomIn size={16} /> Click to Zoom
                    </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-gray-200 p-8 rounded-sm shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2 text-charcoal border-b border-gray-100 pb-3">
                <Palette size={20} className="text-gold" /> About the Artwork
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {painting.description || "No description available."}
              </p>
            </div>
          </div>

          {/* ---- RIGHT: Details ---- */}
          <div className="mt-10 lg:mt-0 flex flex-col sticky top-24">
            <h1 className="text-4xl font-serif font-bold mb-2 text-charcoal leading-tight">{painting.title}</h1>
            <p className="text-sm text-gray-500 mb-6">Listed on {formatDate(painting.$createdAt)}</p>

            {/* 📋 SPECIFICATIONS GRID (Updated with all fields) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
               
               {/* 1. Dimensions */}
               {painting.width && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Width</p>
                       <p className="font-serif font-bold text-charcoal">{painting.width}"</p>
                   </div>
               )}
               {painting.height && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Height</p>
                       <p className="font-serif font-bold text-charcoal">{painting.height}"</p>
                   </div>
               )}
               {painting.length && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Length</p>
                       <p className="font-serif font-bold text-charcoal">{painting.length}"</p>
                   </div>
               )}

               {/* 2. Style & Type */}
               {painting.medium && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Medium</p>
                       <p className="font-serif font-bold text-charcoal capitalize truncate" title={painting.medium}>{painting.medium}</p>
                   </div>
               )}
               {painting.style && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Style</p>
                       <p className="font-serif font-bold text-charcoal capitalize truncate" title={painting.style}>{painting.style}</p>
                   </div>
               )}
               {painting.category && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Category</p>
                       <p className="font-serif font-bold text-charcoal capitalize truncate" title={painting.category}>{painting.category}</p>
                   </div>
               )}

               {/* 3. Logistics */}
               {painting.weight && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Weight</p>
                       <p className="font-serif font-bold text-charcoal">{painting.weight}</p>
                   </div>
               )}
               {painting.shippingZone && (
                   <div className="bg-gray-50 p-3 rounded border border-gray-200 text-center col-span-2 sm:col-span-2">
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Shipping Zone</p>
                       <p className="font-serif font-bold text-charcoal capitalize">{painting.shippingZone}</p>
                   </div>
               )}
            </div>

            {/* 💰 Price Section */}
            <div className="mb-6 p-5 bg-white border border-gray-100 rounded-md shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-3 flex-wrap">
                  {discountVal > 0 && (
                    <span className="text-red-600 font-bold text-xl">{discountVal}% OFF</span>
                  )}
                  {discountVal > 0 && (
                    <span className="text-gray-400 text-lg line-through decoration-gray-400">
                      {currencySymbol}{rawPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-3xl font-serif font-bold text-charcoal">
                    {currencySymbol}{finalPrice.toLocaleString()}
                  </span>
                </div>
                
                <button onClick={handleLike} className="group flex items-center gap-2 focus:outline-none" title={isLiked ? "Unlike" : "Like"}>
                    <Heart size={24} className={`transition-all ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'}`} />
                    <span className="text-sm font-bold text-gray-500">{likes}</span>
                </button>
              </div>
            </div>

            {/* Status & Buttons */}
            <div className="space-y-4 mb-8 text-sm">
              {painting.isSold ? (
                   <div className="flex items-center gap-2 font-bold px-3 py-4 rounded-sm bg-red-50 text-red-700 border border-red-100 justify-center">
                        <Lock size={20} /> SOLD OUT
                   </div>
              ) : (
                  <>
                    <div className={`flex items-center gap-2 font-medium px-3 py-2 rounded-sm ${isUserFromIndia ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-700"}`}>
                        <Truck size={18} />
                        {isUserFromIndia ? "Cash on Delivery (COD) Available" : "International Shipping"}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button onClick={handleAddToCart} className="flex-1 border-2 border-charcoal text-charcoal py-4 rounded-sm font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                        <ShoppingBag size={20} /> Add to Cart
                        </button>
                        <button onClick={handleBuyNow} className="flex-1 bg-charcoal text-white py-4 rounded-sm font-bold hover:bg-black transition flex items-center justify-center gap-2">
                        <CreditCard size={20} /> Buy Now
                        </button>
                    </div>
                  </>
              )}
            </div>

            {/* Authenticity Note */}
            <div className="text-xs text-gray-400 flex items-start gap-2 mt-4 border-t border-gray-100 pt-4">
                <Info size={16} className="flex-shrink-0" />
                <p>Includes Certificate of Authenticity. All artworks are original and unique.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;