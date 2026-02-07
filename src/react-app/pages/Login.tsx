import { useState } from 'react';
import { useNavigate } from 'react-router';
// Note: React Router v7 might use 'react-router' or 'react-router-dom'. 
// App.tsx uses 'react-router'.
import { authService } from '../services/AuthService';
import { Lock, User as UserIcon } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const user = authService.login(username, password);
        if (user) {
            if (user.role === 'admin') {
                navigate('/');
            } else {
                navigate('/billing');
            }
        } else {
            setError('Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 p-8 text-center text-white flex flex-col items-center">
                    <div className="w-20 h-20 mb-4 flex items-center justify-center">
                        <img src="/vk-logo.png" alt="VK Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-4xl font-bold mb-2 tracking-tight">VKINFOTECH</h1>
                    <p className="opacity-90 font-medium">Billing & Inventory System Login</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center font-medium border border-red-200">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Username</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter username"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter password"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-transform active:scale-95 shadow-lg"
                        >
                            Sign In
                        </button>

                        <div className="text-center text-xs text-gray-400 mt-4">
                            <p>© 2026 VKINFOTECH. All rights reserved.</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
