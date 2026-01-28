import React, { useState } from 'react';
import authService from '../backend/auth';
import { Link, useNavigate } from 'react-router-dom';
import { login as authLogin } from '../store/authSlice';
import { useDispatch } from 'react-redux';
import { Loader2, User, Mail, Lock, Globe } from 'lucide-react';
import { COUNTRIES } from '../constants/countries';

const Signup = () => {
    const navigate = useNavigate();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const [registerData, setRegisterData] = useState({
        name: "",
        email: "",
        password: "",
        country: "India" // Default selection
    });

    const create = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // This calls our updated createAccount method in auth.js
            const userData = await authService.createAccount(registerData);
            if (userData) {
                const currentUser = await authService.getCurrentUser();
                if (currentUser) dispatch(authLogin(currentUser));
                navigate("/");
            }
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    };

    return (
        <div className='flex items-center justify-center min-h-screen bg-[#FDFBF7]'>
            <div className='w-full max-w-md bg-white p-8 rounded-xl shadow-sm border border-gray-100'>
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-serif text-charcoal">Join the Gallery</h1>
                    <p className="text-gray-500 text-sm mt-2">Create an account to start collecting.</p>
                </div>

                {error && <p className="text-red-600 mt-4 text-center text-sm bg-red-50 p-2 rounded">{error}</p>}

                <form onSubmit={create} className='space-y-5'>
                    
                    {/* Name Input */}
                    <div className="relative">
                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            placeholder="Full Name"
                            name="name"
                            value={registerData.name}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 border border-gray-200 rounded-sm focus:border-charcoal outline-none bg-gray-50 focus:bg-white transition"
                            required
                        />
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            placeholder="Email Address"
                            type="email"
                            name="email"
                            value={registerData.email}
                            onChange={handleChange}
                            autoComplete="email"
                            className="w-full pl-10 p-3 border border-gray-200 rounded-sm focus:border-charcoal outline-none bg-gray-50 focus:bg-white transition"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <input
                            type="password"
                            placeholder="Password"
                            name="password"
                            value={registerData.password}
                            onChange={handleChange}
                            autoComplete="new-password"
                            className="w-full pl-10 p-3 border border-gray-200 rounded-sm focus:border-charcoal outline-none bg-gray-50 focus:bg-white transition"
                            required
                        />
                    </div>

                    {/* Country Dropdown */}
                    <div className="relative">
                        <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <select
                            name="country"
                            value={registerData.country}
                            onChange={handleChange}
                            className="w-full pl-10 p-3 border border-gray-200 rounded-sm focus:border-charcoal outline-none bg-gray-50 focus:bg-white transition appearance-none cursor-pointer text-gray-700"
                        >
                            {COUNTRIES.map((country) => (
                                <option key={country} value={country}>{country}</option>
                            ))}
                        </select>
                        {/* Custom Arrow Icon for Select */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-charcoal text-white py-3 rounded-sm font-medium hover:bg-black transition-all flex justify-center items-center tracking-wide"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : "Create Account"}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-gray-600">
                    Already have an account?&nbsp;
                    <Link to="/login" className="font-medium text-charcoal hover:underline decoration-gold underline-offset-4">
                        Sign In
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;