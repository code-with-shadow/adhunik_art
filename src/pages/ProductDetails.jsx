import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import service from '../backend/config';
import { addToCart } from '../store/cartSlice';
import { useAuthCheck } from '../hooks/useAuthCheck';
import OptimizedImage from '../components/OptimizedImage';
import {
  Loader2,
  ChevronRight,
  ShoppingBag,
  CreditCard,
  ZoomIn,
  X,
  Palette,
  Heart,
  Truck,
  AlertCircle,
  User,
} from 'lucide-react';

const ProductDetails = () => {
  const { paintingId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { checkAuth } = useAuthCheck();

  // User & Auth Check
  const userData = useSelector((state) => state.auth.userData);
  const isUserFromIndia = userData?.country?.toLowerCase() === 'india';

  const [painting, setPainting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // ❤️ Local State for Likes
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  // 1. Fetch Painting Data
  useEffect(() => {
    const fetchPainting = async () => {
      setLoading(true);
      try {
        const data = await service.getPainting(paintingId);
        if (!data) {
          setError("Painting not found.");
        } else {
          setPainting(data);
          setLikes(data.like || 0); // Initialize likes
        }
      } catch (err) {
        console.error("Error fetching painting:", err);
        setError("Failed to load painting details.");
      } finally {
        setLoading(false);
      }
    };

    if (paintingId) {
      fetchPainting();
    }
  }, [paintingId]);

  // 2. Handlers
  const handleAddToCart = () => {
    if (!checkAuth()) return;
    if (!painting) return;
    dispatch(addToCart(painting));
    alert(`${painting.title} added to your cart!`);
  };

  const handleBuyNow = () => {
    if (!checkAuth()) return;
    if (!painting) return;
    dispatch(addToCart(painting));
    navigate('/checkout');
  };

  // ❤️ Handle Like Click
  const handleLike = async () => {
    if (!painting) return;

    // Optimistic Update
    const newIsLiked = !isLiked;
    const newLikeCount = newIsLiked ? likes + 1 : likes - 1;

    setLikes(newLikeCount);
    setIsLiked(newIsLiked);

    // Update Backend silently
    try {
      await service.updateLikeCount(painting.$id, newLikeCount);
    } catch (error) {
      console.error("Failed to update like count", error);
      setLikes(likes); // Revert on error
      setIsLiked(isLiked);
    }
  };

  const getImageSource = () => {
    if (!painting?.imageUrl) return null;
    return service.getThumbnail(painting.imageUrl);
  };

  // 3. Price Calculation
  const originalPrice = painting?.price || 0;
  const discountPercent = painting?.discount ? parseInt(painting.discount) : 0;
  const finalPrice = discountPercent > 0
    ? originalPrice - (originalPrice * discountPercent / 100)
    : originalPrice;

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#FDFBF7]"><Loader2 className="animate-spin h-10 w-10 text-charcoal" /></div>;
  if (error || !painting) return <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-red-600">{error}</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-sans text-charcoal">

      {/* --- FULL SCREEN LIGHTBOX --- */}
      {isFullScreen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setIsFullScreen(false)}>
          <button className="absolute top-6 right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all">
            <X size={32} />
          </button>
          <img src={getImageSource()} alt={painting.title} className="max-h-[90vh] max-w-[90vw] object-contain shadow-2xl rounded-sm" />
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

        {/* Main Content Grid */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-16 items-start">

          {/* ---- LEFT COLUMN: Image & Descriptions ---- */}
          <div className="flex flex-col space-y-8">
            {/* 1. Main Image */}
            <div
              className="aspect-w-4 aspect-h-5 w-full overflow-hidden bg-gray-100 rounded-sm relative group cursor-zoom-in border border-gray-200 shadow-sm"
              onClick={() => setIsFullScreen(true)}
            >
              <OptimizedImage src={getImageSource()} alt={painting.title} className="w-full h-full" priority={true} />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white/90 text-charcoal px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all">
                  <ZoomIn size={16} /> Click to Expand
                </div>
              </div>
            </div>

            {/* 2. Description Box */}
            <div className="bg-white border border-gray-200 p-8 rounded-sm shadow-sm">
              <h3 className="font-serif font-bold text-lg mb-4 flex items-center gap-2 text-charcoal border-b border-gray-100 pb-3">
                <Palette size={20} className="text-gold" /> About the Artwork
              </h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line text-sm md:text-base">
                {painting.description || "No description available for this masterpiece."}
              </p>
            </div>

            {/* 3. Artist Box */}
            <div className="bg-white border border-gray-200 p-6 rounded-sm shadow-sm flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-gray-400">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-charcoal">About the Artist</h3>
                <p className="text-gray-600 text-sm mt-2 leading-relaxed">
                  This unique piece is crafted with passion and precision. (Artist profile coming soon).
                </p>
              </div>
            </div>

          </div>

          {/* ---- RIGHT COLUMN: Details & Purchase ---- */}
          <div className="mt-10 lg:mt-0 flex flex-col sticky top-24">

            {/* Title */}
            <h1 className="text-4xl font-serif font-bold mb-6 text-charcoal leading-tight">{painting.title}</h1>

            {/* ✨ DETAILED SPECIFICATIONS GRID */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">

              {/* Width */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Width</p>
                <p className="text-sm font-serif font-bold text-charcoal">{painting.width}"</p>
              </div>

              {/* Height */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Height</p>
                <p className="text-sm font-serif font-bold text-charcoal">{painting.height}"</p>
              </div>

              {/* Length (Depth) */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Depth</p>
                <p className="text-sm font-serif font-bold text-charcoal">{painting.length || "1"}"</p>
              </div>

              {/* Weight */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Weight</p>
                <p className="text-sm font-serif font-bold text-charcoal">{painting.weight || "0"} kg</p>
              </div>

              {/* Medium (Spans 2 cols on mobile) */}
              <div className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Medium</p>
                <p className="text-sm font-serif font-bold text-charcoal truncate">{painting.medium}</p>
              </div>

              {/* Style (Spans 2 cols on mobile) */}
              <div className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Style</p>
                <p className="text-sm font-serif font-bold text-charcoal truncate">{painting.style || "Contemporary"}</p>
              </div>

              {/* Category */}
              <div className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Category</p>
                <p className="text-sm font-serif font-bold text-charcoal truncate">{painting.category}</p>
              </div>

              {/* Shipping */}
              <div className="col-span-2 bg-gradient-to-br from-gray-50 to-gray-100 p-3 rounded-md border border-gray-200 text-center">
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Shipping</p>
                <p className="text-sm font-serif font-bold text-charcoal truncate">{painting.shippingZone || "Global"}</p>
              </div>
            </div>

            {/* Price Section with Likes */}
            <div className="mb-6 p-5 bg-white border border-gray-100 rounded-md shadow-sm">
              <div className="flex items-center justify-between">
                {/* Left: Price */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  {discountPercent > 0 && (
                    <span className="text-red-600 font-bold text-xl">{discountPercent}% OFF</span>
                  )}
                  {discountPercent > 0 && (
                    <span className="text-gray-400 text-lg line-through decoration-gray-400">
                      ${originalPrice.toLocaleString()}
                    </span>
                  )}
                  <span className="text-3xl font-serif font-bold text-charcoal">
                    ${finalPrice.toLocaleString()}
                  </span>
                </div>
                {/* ❤️ CLICKABLE LOVE BUTTON (Icon Only + Count) */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleLike}
                    className="group flex items-center gap-2 focus:outline-none transition-transform active:scale-95"
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <div className={`p-2 rounded-full transition-all duration-300 
                            ${isLiked
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-100 text-gray-400 group-hover:bg-red-50 group-hover:text-red-500'
                      }`}
                    >
                      <Heart
                        size={24}
                        className={`transition-all duration-300 ${isLiked ? 'fill-current scale-110' : ''}`}
                      />
                    </div>
                    <span className={`text-sm font-bold transition-colors ${isLiked ? 'text-charcoal' : 'text-gray-400'}`}>
                      {likes}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* COD & Policy & Like Button */}
            <div className="space-y-4 mb-8 text-sm">

              {/* COD Status */}
              <div className={`flex items-center gap-2 font-medium px-3 py-2 rounded-sm ${isUserFromIndia ? "bg-green-50 text-green-700 border border-green-100" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
                <Truck size={18} />
                {isUserFromIndia
                  ? "Cash on Delivery (COD) Available in India"
                  : "Standard International Shipping"}
              </div>

              {/* Return Policy */}
              <div className="flex items-start gap-2 text-red-700 bg-red-50/80 p-3 rounded-sm border border-red-100 leading-snug">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Not Returnable.</strong> Returnable only if defective or damaged on arrival.
                </span>
              </div>



            </div>

            {/* Purchase Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button onClick={handleAddToCart} className="flex-1 border-2 border-charcoal text-charcoal py-4 rounded-sm font-bold hover:bg-gray-50 transition flex items-center justify-center gap-2">
                <ShoppingBag size={20} /> Add to Cart
              </button>
              <button onClick={handleBuyNow} className="flex-1 bg-charcoal text-white py-4 rounded-sm font-bold hover:bg-black transition flex items-center justify-center gap-2">
                <CreditCard size={20} /> Buy Now
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;