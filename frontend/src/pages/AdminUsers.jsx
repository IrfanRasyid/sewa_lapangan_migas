import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });
    
    // Edit Profile State
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({ name: '', email: '', phone: '', role: '' });

    // Change Password State
    const [isPasswordOpen, setIsPasswordOpen] = useState(false);
    const [passwordUser, setPasswordUser] = useState(null);
    const [passwordData, setPasswordData] = useState({ password: '', confirmPassword: '' });

    const navigate = useNavigate();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.data);
        } catch (err) {
            console.error("Failed to fetch users:", err);
            setModal({ isOpen: true, title: 'Error', message: 'Failed to fetch users', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser(user);
        setEditFormData({ 
            name: user.name, 
            email: user.email, 
            phone: user.phone || '', 
            role: user.role 
        });
        setIsEditOpen(true);
    };

    const handlePasswordClick = (user) => {
        setPasswordUser(user);
        setPasswordData({ password: '', confirmPassword: '' });
        setIsPasswordOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.put(`/admin/users/${editingUser.id}`, editFormData);
            setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...res.data.data } : u));
            setIsEditOpen(false);
            setModal({ isOpen: true, title: 'Success', message: 'User updated successfully', type: 'success' });
        } catch (err) {
            setModal({ isOpen: true, title: 'Error', message: err.response?.data?.message || 'Failed to update user', type: 'error' });
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordData.password !== passwordData.confirmPassword) {
            setModal({ isOpen: true, title: 'Error', message: 'Passwords do not match', type: 'error' });
            return;
        }
        try {
            await api.put(`/admin/users/${passwordUser.id}/password`, { password: passwordData.password });
            setIsPasswordOpen(false);
            setModal({ isOpen: true, title: 'Success', message: 'Password updated successfully', type: 'success' });
        } catch (err) {
            setModal({ isOpen: true, title: 'Error', message: err.response?.data?.message || 'Failed to update password', type: 'error' });
        }
    };

    if (loading) return <div className="text-center mt-10">Loading users...</div>;

    return (
        <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
                <button 
                    onClick={() => navigate('/admin')}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
                >
                    Back to Dashboard
                </button>
            </div>

            <Modal 
                isOpen={modal.isOpen} 
                onClose={() => setModal({ ...modal, isOpen: false })} 
                title={modal.title} 
                message={modal.message} 
                type={modal.type} 
            />

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    <div className="text-sm text-gray-500">ID: {user.id}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-900">{user.email}</div>
                                    <div className="text-sm text-gray-500">{user.phone || '-'}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    <button 
                                        onClick={() => handleEditClick(user)}
                                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => handlePasswordClick(user)}
                                        className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded"
                                    >
                                        Password
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit User Modal */}
            {isEditOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Edit User</h2>
                        <form onSubmit={handleEditSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                                <input 
                                    type="text" 
                                    value={editFormData.name} 
                                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                                <input 
                                    type="email" 
                                    value={editFormData.email} 
                                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                                <input 
                                    type="text" 
                                    value={editFormData.phone} 
                                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Role</label>
                                <select 
                                    value={editFormData.role} 
                                    onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                >
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsEditOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Change Password Modal */}
            {isPasswordOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-bold mb-4">Change Password for {passwordUser?.name}</h2>
                        <form onSubmit={handlePasswordSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.password} 
                                    onChange={(e) => setPasswordData({...passwordData, password: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Confirm New Password</label>
                                <input 
                                    type="password" 
                                    value={passwordData.confirmPassword} 
                                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button 
                                    type="button"
                                    onClick={() => setIsPasswordOpen(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    Change Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;
