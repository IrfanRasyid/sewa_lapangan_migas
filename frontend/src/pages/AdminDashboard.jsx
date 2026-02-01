import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', action: null });
  const [selectedProof, setSelectedProof] = useState(null);
  const navigate = useNavigate();

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    if (modal.action) modal.action();
  };

  const closeProofModal = () => {
    setSelectedProof(null);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await api.get('/admin/bookings');
        setBookings(res.data.data);
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        if (err.response?.status === 403) {
            setModal({
                isOpen: true,
                title: 'Access Denied',
                message: 'Admin only area.',
                type: 'error',
                action: () => navigate('/profile') // Redirect to profile instead of dashboard which is deleted
            });
        } else if (err.response?.status === 401) {
            navigate('/login');
        } else {
            setError("Failed to load bookings.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [navigate]);

  const handleUpdateStatus = async (id, newStatus) => {
    if (!window.confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
        await api.put(`/admin/bookings/${id}/status`, { status: newStatus });
        // Update local state
        setBookings(bookings.map(b => b.id === id ? { ...b, status: newStatus } : b));
        setModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Status updated successfully!',
            type: 'success'
        });
    } catch (err) {
        console.error("Failed to update status:", err);
        setModal({
            isOpen: true,
            title: 'Gagal',
            message: 'Failed to update status.',
            type: 'error'
        });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) return <div className="text-center mt-10">Loading admin dashboard...</div>;

  return (
    <div className="max-w-6xl mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <button 
              onClick={() => navigate('/admin/users')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow"
          >
              Manage Users
          </button>
      </div>

      <Modal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />

      {/* Proof Modal */}
      {selectedProof && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={closeProofModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4">Payment Proof</h3>
            <div className="flex justify-center bg-gray-100 p-4 rounded min-h-[200px] items-center">
              <img 
                src={selectedProof} 
                alt="Payment Proof" 
                className="max-w-full max-h-[70vh] object-contain"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Load+Error';
                }}
              />
            </div>
            <div className="mt-4 flex justify-end">
               <a 
                  href={selectedProof} 
                  download="payment_proof"
                  className="bg-blue-600 text-white px-4 py-2 rounded mr-2 hover:bg-blue-700"
                >
                  Download
               </a>
              <button 
                onClick={closeProofModal}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">All Bookings Management</h3>
        {bookings.length === 0 ? (
          <p className="text-gray-500">No bookings found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proof</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{booking.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-bold">{booking.user_name}</div>
                        <div className="text-xs text-gray-500">{booking.user_email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.field_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{new Date(booking.start_time).toLocaleDateString()}</div>
                        <div className="text-xs">
                            {new Date(booking.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                            {new Date(booking.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Rp {booking.total_price.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {booking.proof_url ? (
                            <button 
                                onClick={() => {
                                    const url = booking.proof_url.startsWith('data:') || booking.proof_url.startsWith('http') 
                                        ? booking.proof_url 
                                        : `${import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:7860'}${booking.proof_url}`;
                                    setSelectedProof(url);
                                }}
                                className="text-blue-600 hover:text-blue-800 underline bg-transparent border-none cursor-pointer"
                            >
                                View Proof
                            </button>
                        ) : (
                            <span className="text-gray-400">No proof</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${booking.status === 'paid' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          booking.status === 'canceled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {booking.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {booking.status === 'pending' && (
                            <div className="flex space-x-2">
                                <button 
                                    onClick={() => handleUpdateStatus(booking.id, 'paid')}
                                    className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded"
                                >
                                    Approve (Paid)
                                </button>
                                <button 
                                    onClick={() => handleUpdateStatus(booking.id, 'canceled')}
                                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                                >
                                    Reject
                                </button>
                            </div>
                        )}
                        {booking.status === 'paid' && (
                            <button 
                                onClick={() => handleUpdateStatus(booking.id, 'canceled')}
                                className="text-red-600 hover:text-red-900"
                            >
                                Cancel Booking
                            </button>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
