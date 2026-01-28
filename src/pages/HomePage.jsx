import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchCategoryPaintings } from '../store/shopSlice';
import { Loader2 } from 'lucide-react';

// Import the new ProductCard
import ProductCard from '../components/ProductCard.jsx';
import heroImage from '../assets/hero.jpeg';

const SectionRow = ({ title, linkTo, paintings, loading }) => {
  if (loading) return (
      <section className="py-12 flex justify-center border-b border-gray-100">
        <Loader2 className="animate-spin h-8 w-8 text-charcoal" />
      </section>
  );

  if (!paintings || paintings.length === 0) return null;

  return (
    <section className="py-10 border-b border-gray-100 last:border-0">
      <div className="flex items-end justify-between mb-6 px-1">
        <h2 className="text-2xl md:text-3xl font-serif text-charcoal">{title}</h2>
        <Link to={linkTo} className="text-sm font-medium text-gray-500 hover:text-charcoal underline decoration-gray-300 underline-offset-4 transition">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10">
        {paintings.slice(0, 6).map((painting) => (
          /* 👇 FIX: No Link here anymore. ProductCard handles it. */
          <ProductCard key={painting.$id} painting={painting} />
        ))}
      </div>
    </section>
  );
};

const HomePage = () => {
  const dispatch = useDispatch();
  const { Abstract, Landscape, Portrait } = useSelector((state) => state.shop.categories);

  useEffect(() => {
    dispatch(fetchCategoryPaintings({ category: 'Abstract', offset: 0 }));
    dispatch(fetchCategoryPaintings({ category: 'Landscape', offset: 0 }));
    dispatch(fetchCategoryPaintings({ category: 'Portrait', offset: 0 }));
  }, [dispatch]);

  return (
    <div className="bg-[#FDFBF7] min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden bg-gray-200">
        <img
          src={heroImage}
          fetchPriority="high"
          loading="eager"
          alt="Gallery Interior"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 drop-shadow-md">
                Curated Excellence for Your Home
            </h1>
            <Link to="/shop" className="bg-white text-charcoal px-8 py-3 font-medium text-sm tracking-widest hover:bg-gray-100 transition rounded-sm">
                EXPLORE COLLECTION
            </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-4">
        <SectionRow title="New Arrivals" linkTo="/shop" paintings={Abstract?.items} loading={Abstract?.loading} />
        <SectionRow title="Abstract Art" linkTo="/shop" paintings={Portrait?.items || Abstract?.items} loading={Portrait?.loading} />
        <SectionRow title="Large Statement Pieces" linkTo="/shop" paintings={Landscape?.items} loading={Landscape?.loading} />
      </div>
    </div>
  );
};

export default HomePage;