import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import service from '../backend/config';
import { Loader2, UploadCloud, Image as ImageIcon, Ruler, LayoutDashboard, Package, ShoppingCart, Users, Palette, Settings } from 'lucide-react';
import imageCompression from 'browser-image-compression';

// --- Sidebar Component ---
const SidebarItem = ({ icon: Icon, label, to = "#", active }) => (
  <Link to={to} className={`flex items-center space-x-3 px-4 py-3 rounded-md transition-all duration-200 group ${active ? 'bg-[#EAE5D8] text-charcoal font-medium' : 'text-gray-500 hover:bg-[#F5F2EB] hover:text-charcoal'}`}>
    <Icon size={20} className={active ? 'text-charcoal' : 'text-gray-400 group-hover:text-charcoal'} />
    <span>{label}</span>
  </Link>
);

const AdminUpload = () => {
    const { register, handleSubmit, reset, watch, setValue } = useForm();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();
    
    // Check if we are in Edit Mode
    const editModeProduct = location.state?.product;

    // Load data if editing
    useEffect(() => {
        if (editModeProduct) {
            // Fill form with existing data
            const fields = ['title', 'price', 'category', 'medium', 'style', 'shippingZone', 'width', 'height', 'length', 'weight', 'description'];
            fields.forEach(field => setValue(field, editModeProduct[field]));
            
            // Handle Discount (Ensure it's a number in the input)
            if (editModeProduct.discount) {
                setValue('discount', parseInt(editModeProduct.discount)); 
            }

            // Set existing image preview
            if (editModeProduct.imageUrl) {
                setPreview(service.getThumbnail(editModeProduct.imageUrl));
            }
        }
    }, [editModeProduct, setValue]);

    const imageFile = watch('image');
    useEffect(() => {
        if (imageFile && imageFile[0]) {
            const file = imageFile[0];
            setPreview(URL.createObjectURL(file));
        }
    }, [imageFile]);

    const submitHandler = async (data) => {
        setLoading(true);
        setError(null);
        try {
            let fileId = editModeProduct ? editModeProduct.imageUrl : null;

            // 1. Image Upload Logic
            if (data.image && data.image[0]) {
                const rawFile = data.image[0];
                const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" };
                
                try {
                    const compressedFile = await imageCompression(rawFile, options);
                    // Create a new File object from the compressed blob
                    const compressedFileObj = new File([compressedFile], rawFile.name, { type: "image/webp" });
                    const uploadedFile = await service.uploadFile(compressedFileObj);
                    fileId = uploadedFile.$id;
                } catch (err) {
                    console.warn("Compression failed, uploading original", err);
                    const uploadedFile = await service.uploadFile(rawFile);
                    fileId = uploadedFile.$id;
                }
            }

            // 2. Prepare Payload (CORRECTED TYPES)
            const payload = {
                title: data.title,
                price: parseFloat(data.price), // Double
                
                // 👇 FIX: Send Discount as Integer (Number), NOT String
                discount: data.discount ? parseInt(data.discount) : 0, 

                category: data.category || "",
                description: data.description || "",
                imageUrl: fileId,
                medium: data.medium || "",
                style: data.style || "",
                width: data.width || "",
                height: data.height || "",
                length: data.length || "",
                weight: data.weight || "",
                shippingZone: data.shippingZone || "",
                
                // Keep existing values or defaults
                isSold: editModeProduct ? Boolean(editModeProduct.isSold) : false,
                like: editModeProduct ? parseInt(editModeProduct.like || 0) : 0
            };

            // 3. Send to Backend
            if (editModeProduct) {
                await service.updatePainting(editModeProduct.$id, payload);
            } else {
                await service.createPainting(payload);
            }
            
            navigate('/admin/products');
        } catch (err) {
            console.error("Operation failed", err);
            setError(err.message || "Failed to save product.");
        } finally {
            setLoading(false);
        }
    };

    // UI Styles
    const inputClass = "w-full bg-gray-50 border border-gray-200 text-charcoal p-3 rounded-sm focus:bg-white focus:border-charcoal focus:ring-0 outline-none transition-all duration-200 placeholder:text-gray-400";
    const labelClass = "block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2";

    return (
        <div className="min-h-screen bg-cream flex font-sans text-charcoal">
            {/* Sidebar */}
            <aside className="w-64 bg-beige-light border-r border-beige-border fixed h-full hidden md:flex flex-col z-20">
                <div className="p-8"><h1 className="text-2xl font-serif text-charcoal">Artisan Canvas</h1></div>
                <nav className="flex-1 px-4 space-y-2">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/admin" />
                    <SidebarItem icon={Package} label="Products" to="/admin/products" />
                    <SidebarItem icon={ShoppingCart} label="Orders" to="/admin/orders" />
                    <SidebarItem icon={Users} label="Customers" to="/admin/customers" />
                    <SidebarItem icon={Palette} label="Upload" active={true} to="/admin/upload" />
                    <SidebarItem icon={Settings} label="Settings" />
                </nav>
            </aside>

            <main className="flex-1 md:ml-64 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-serif text-charcoal mb-2">
                            {editModeProduct ? "Edit Masterpiece" : "Curate New Artwork"}
                        </h1>
                    </div>
                    
                    {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md text-sm text-center font-medium border border-red-100">{error}</div>}

                    <form onSubmit={handleSubmit(submitHandler)} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                             
                             {/* LEFT: Image Upload */}
                             <div className="p-8 md:col-span-1 bg-gray-50/50">
                                <label className={labelClass}>Artwork Image</label>
                                <div className={`relative border-2 border-dashed rounded-lg transition-all duration-200 aspect-[4/5] flex flex-col items-center justify-center text-center p-4 ${preview ? 'border-gray-300 bg-white' : 'border-gray-300 hover:border-charcoal hover:bg-white'}`}>
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="w-full h-full object-contain rounded-md" />
                                    ) : (
                                        <div className="text-center">
                                            <UploadCloud className="mx-auto h-8 w-8 text-gray-400" />
                                            <span className="text-xs text-gray-500 block mt-2">Click to upload</span>
                                        </div>
                                    )}
                                    <input type="file" accept="image/*" {...register("image", { required: !editModeProduct })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                </div>
                             </div>

                             {/* RIGHT: Details */}
                             <div className="p-8 md:col-span-2 space-y-6">
                                
                                <div>
                                    <label className={labelClass}>Title</label>
                                    <input {...register("title", { required: true })} className={inputClass} placeholder="e.g. Sunset Boulevard" />
                                </div>

                                {/* Price & Discount Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Price ($)</label>
                                        <input {...register("price", { required: true })} type="number" step="0.01" className={inputClass} placeholder="0.00" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Discount (%)</label>
                                        <input 
                                            {...register("discount")} 
                                            type="number" 
                                            min="0" 
                                            max="100" 
                                            className={inputClass} 
                                            placeholder="0" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Category</label>
                                        <select {...register("category", { required: true })} className={inputClass}>
                                            <option value="">Select...</option>
                                            <option value="Abstract">Abstract</option>
                                            <option value="Landscape">Landscape</option>
                                            <option value="Portrait">Portrait</option>
                                            <option value="Modern">Modern</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Medium</label>
                                        <select {...register("medium", { required: true })} className={inputClass}>
                                            <option value="">Select...</option>
                                            <option value="Oil">Oil</option>
                                            <option value="Acrylic">Acrylic</option>
                                            <option value="Watercolor">Watercolor</option>
                                            <option value="Mixed Media">Mixed Media</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                    <div>
                                        <label className={labelClass}>Style</label>
                                        <input {...register("style")} placeholder="e.g. Impressionist" className={inputClass} />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Shipping Zone</label>
                                        <input {...register("shippingZone")} placeholder="e.g. Global / USA" className={inputClass} />
                                    </div>
                                </div>

                                {/* Dimensions & Weight */}
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <label className={`${labelClass} flex items-center gap-2`}>
                                        <Ruler size={14} /> Dimensions (cm) & Weight
                                    </label>
                                    <div className="grid grid-cols-4 gap-3">
                                        <div><input {...register("width")} placeholder="W" className={`${inputClass} bg-white text-center px-1`} /></div>
                                        <div><input {...register("height")} placeholder="H" className={`${inputClass} bg-white text-center px-1`} /></div>
                                        <div><input {...register("length")} placeholder="L" className={`${inputClass} bg-white text-center px-1`} /></div>
                                        <div><input {...register("weight")} placeholder="Kg" className={`${inputClass} bg-white text-center px-1`} /></div>
                                    </div>
                                </div>

                                <div>
                                    <label className={labelClass}>Description</label>
                                    <textarea {...register("description")} rows="3" placeholder="Story behind the art..." className={`${inputClass} resize-none`} />
                                </div>
                                
                                <button type="submit" disabled={loading} className="w-full bg-charcoal text-white py-4 text-sm font-bold tracking-widest uppercase hover:bg-black transition-all flex items-center justify-center">
                                    {loading ? <Loader2 className="animate-spin inline mr-2"/> : (editModeProduct ? "Update Artwork" : "Publish to Gallery")}
                                </button>
                             </div>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
};
export default AdminUpload;