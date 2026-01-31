import React, { memo, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';
import service from '../backend/config';

const ProductCard = memo(({ painting }) => {
  const [likes, setLikes] = useState(painting.like || 0);

  // 1. Logic to get the thumbnail URL
  const imageUrl = useMemo(() => {
    if (!painting.imageUrl) return null;
    return service.getThumbnail(painting.imageUrl);
  }, [painting.imageUrl]);

  // 2. 💰 PRICE CALCULATION 
  // Requirement: Use discountusd for the percentage, apply to both prices.
  
  const discountPercent = painting.discountusd || 0;

  // USD Calculation
  const originalUSD = painting.priceusd || 0;
  const finalUSD = discountPercent > 0 
      ? originalUSD - (originalUSD * discountPercent / 100) 
      : originalUSD;

  // INR Calculation
  const originalINR = painting.pricein || 0;
  const finalINR = discountPercent > 0 
      ? originalINR - (originalINR * discountPercent / 100) 
      : originalINR;

  return (
    <Link to={`/product/${painting.$id}`} className="group cursor-pointer block relative h-full">
      <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
        
        {/* Image Container */}
        <div className="w-full mb-4 relative">
          <div className="bg-[#f6f3ea] rounded-md p-3 flex items-center justify-center relative overflow-hidden">
             {/* SOLD OUT Badge Overlay */}
             {painting.isSold && (
                <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                    <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 uppercase tracking-widest shadow-sm border border-white/20">
                        Sold
                    </span>
                </div>
             )}
            
            <div className="bg-white rounded-sm shadow-inner border-4 border-frame p-1 w-full aspect-[4/3] overflow-hidden flex items-center justify-center">
              <OptimizedImage
                src={imageUrl}
                alt={painting.title}
                containerClassName="w-full h-full"
                className={`object-cover object-center w-full h-full transition-transform duration-700 group-hover:scale-105 ${painting.isSold ? 'grayscale' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="space-y-2 flex-grow flex flex-col justify-end">
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-sm font-semibold text-charcoal truncate font-serif tracking-wide">{painting.title}</h3>
                <p className="text-xs text-gray-500 capitalize mt-1">
                    {painting.medium || painting.category || "Original Art"}
                </p>
            </div>
          </div>

          <div className="flex items-end justify-between pt-3 border-t border-gray-100 mt-2">
            
            {/* LEFT: Discount Badge (Based on discountusd) */}
            <div>
                {discountPercent > 0 ? (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-sm border border-red-100">
                        {discountPercent}% OFF
                    </span>
                ) : (
                    // Spacer if no discount
                    <span className="block h-6"></span> 
                )}
            </div>

            {/* RIGHT: Dual Prices (Bigger & Stacked) */}
            <div className="flex flex-col items-end text-right">
                
                {/* USD Price (Primary/Big) */}
                <div className="flex items-baseline gap-2">
                    {discountPercent > 0 && (
                        <span className="text-xs text-gray-400 line-through decoration-red-300">
                            ${originalUSD?.toLocaleString('en-US')}
                        </span>
                    )}
                    <span className="text-xl text-charcoal font-bold font-serif leading-none">
                        ${finalUSD?.toLocaleString('en-US')}
                    </span>
                </div>

                {/* INR Price (Secondary/Medium) */}
                <div className="flex items-baseline gap-2 mt-1">
                     {discountPercent > 0 && (
                        <span className="text-[10px] text-gray-400 line-through">
                            ₹{originalINR?.toLocaleString('en-IN')}
                        </span>
                    )}
                    <span className="text-sm text-gray-600 font-semibold font-serif">
                        ₹{finalINR?.toLocaleString('en-IN')}
                    </span>
                </div>

            </div>
          </div>
        </div>
      </div>
    </Link>
  );
});

ProductCard.displayName = 'ProductCard';
export default ProductCard;