import React, { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import service from '../backend/config';
import { Heart } from 'lucide-react';

const ProductCard = memo(({ painting }) => {
  const [likes, setLikes] = useState(painting.like || 0);
  const [isLiked, setIsLiked] = useState(false);

  // ⚡ Logic to get the thumbnail URL
  const imageUrl = useMemo(() => {
    if (!painting.imageUrl) return null;
    return service.getThumbnail(painting.imageUrl);
  }, [painting.imageUrl]);

  // 💰 Price Calculation
  const discount = painting.discount || 0;
  const originalPrice = painting.price;
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

  // ❤️ Like Handler
  const handleLike = (e) => {
    e.preventDefault(); // Prevent opening product details
    e.stopPropagation();

    const newLikeCount = isLiked ? likes - 1 : likes + 1;
    setLikes(newLikeCount);
    setIsLiked(!isLiked);

    // Update Database silently
    service.updateLikeCount(painting.$id, newLikeCount);
  };

  return (
    <Link to={`/product/${painting.$id}`} className="group cursor-pointer block relative">

      {/* Image Container */}
      <div className="aspect-[4/5] w-full overflow-hidden bg-gray-100 mb-3 relative rounded-sm">
        <OptimizedImage
          src={imageUrl}
          alt={painting.title}
          containerClassName="w-full h-full"
          className="group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors pointer-events-none" />

        {/* Discount Badge */}
        {discount > 0 && !painting.isSold && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider z-10 rounded-sm">
            {discount}% OFF
          </div>
        )}

        {/* Sold Badge */}
        {painting.isSold && (
          <div className="absolute top-2 right-2 bg-charcoal text-white text-xs px-2 py-1 uppercase font-bold tracking-widest z-10">
            Sold
          </div>
        )}


      </div>

      {/* Text Details */}
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-charcoal truncate pr-2 group-hover:text-gold transition-colors">
          {painting.title}
        </h3>

        <div className="flex items-center gap-2">
          {/* Final Price */}
          <p className="text-sm text-charcoal font-bold font-serif">
            ${finalPrice?.toLocaleString()}
          </p>

          {/* Original Price (Strikethrough) */}
          {discount > 0 && (
            <p className="text-xs text-gray-400 line-through decoration-gray-400">
              ${originalPrice?.toLocaleString()}
            </p>
          )}
        </div>


        {/* ❤️ Like Button Overlay */}
        <button
          onClick={handleLike}
          className="absolute bottom-1 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-sm transition-all z-20 group/heart flex flex-col items-center justify-center min-w-[40px]"
        >
          <Heart
            size={18}
            className={`transition-colors ${isLiked ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover/heart:text-red-400'}`}
          />
          <span className="text-[9px] font-bold text-gray-500 mt-0.5">{likes}</span>
        </button>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;