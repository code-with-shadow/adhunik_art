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
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow h-full">
        <div className="w-full mb-4">
          <div className="bg-[#f6f3ea] rounded-md p-3 flex items-center justify-center">
            <div className="bg-white rounded-sm shadow-inner border-4 border-frame p-1 w-full aspect-[4/3] overflow-hidden flex items-center justify-center">
              <OptimizedImage
                src={imageUrl}
                alt={painting.title}
                containerClassName="w-full h-full"
                className="object-cover object-center w-full h-full"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-charcoal truncate">{painting.title}</h3>
          {painting.artist && (
            <p className="text-xs text-gray-500">{painting.artist}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-charcoal font-bold font-serif">{`$${finalPrice?.toLocaleString('en-IN')}`}</p>
            {discount > 0 && (
              <p className="text-xs text-gray-400 line-through">{`$${originalPrice?.toLocaleString('en-IN')}`}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;