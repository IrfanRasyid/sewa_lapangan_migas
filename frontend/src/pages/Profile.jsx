import { useState, useEffect } from 'react';
import api from '../api/axios';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const [userRes, bookingsRes] = await Promise.all([
        api.get('/users/me'),
        api.get('/bookings/my')
      ]);
      
      setUser(userRes.data.data);
      setName(userRes.data.data.name);
      setPhone(userRes.data.data.phone || '');
      setBookings(bookingsRes.data.data);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      setError("Failed to load profile data.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const payload = { name, phone };
      if (password) {
        payload.password = password;
      }

      const res = await api.put('/users/me', payload);
      setUser(res.data.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      setPassword(''); // Clear password field
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.response?.data?.error || "Failed to update profile.");
    }
  };

  if (loading) return (
    <div className="text-center mt-10 flex justify-center">
      <OrbitProgress variant="track-disc" color="#3184cc" size="medium" text="" textColor="" />
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* User Details Section */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-4">Personal Information</h2>
            
            {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>}
            {success && <div className="bg-green-100 text-green-700 p-3 rounded mb-4 text-sm">{success}</div>}

            {!isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500 block">Name</label>
                  <p className="font-medium text-lg">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block">Email</label>
                  <p className="font-medium text-lg">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500 block">Phone</label>
                  <p className="font-medium text-lg">{user?.phone || '-'}</p>
                </div>
                
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-4 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password (Optional)</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Leave blank to keep current"
                    minLength={6}
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button 
                    type="submit" 
                    className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
                  >
                    Save
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditing(false);
                      setName(user?.name);
                      setPhone(user?.phone || '');
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-md hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Booking History Section */}
        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <h2 className="text-xl font-bold mb-6">Booking History</h2>
            
            {bookings.length === 0 ? (
              <div className="text-center py-10 text-gray-500">
                You haven't made any bookings yet.
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{booking.field?.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.start_time).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                          {new Date(booking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase mb-2 ${
                          booking.status === 'paid' ? 'bg-green-100 text-green-800' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          booking.status === 'canceled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {booking.status}
                        </span>
                        <p className="font-bold text-gray-900">Rp {booking.total_price.toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
