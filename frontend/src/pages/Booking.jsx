import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';
import api from '../api/axios';
import { QRCodeSVG } from 'qrcode.react';
import Modal from '../components/Modal';

const Booking = () => {
  const { fieldId } = useParams();
  const [field, setField] = useState(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isMemberBooking, setIsMemberBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [bookingData, setBookingData] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', action: null });
  const navigate = useNavigate();

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
    if (modal.action) modal.action();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        setModal({
            isOpen: true,
            title: 'Login Diperlukan',
            message: 'Anda harus login untuk mengakses halaman booking.',
            type: 'warning',
            confirmText: 'Login',
            cancelText: 'Kembali',
            onConfirm: () => navigate('/login'),
            action: () => navigate('/')
        });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchField = async () => {
      try {
        const res = await api.get(`/fields/${fieldId}`);
        setField(res.data.data);
      } catch (err) {
        console.error("Failed to fetch field:", err);
        setError("Failed to load field details.");
      } finally {
        setLoading(false);
      }
    };
    fetchField();
  }, [fieldId]);

  const handleBooking = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
        setModal({
            isOpen: true,
            title: 'Login Diperlukan',
            message: 'Silakan login terlebih dahulu untuk memesan lapangan.',
            type: 'warning',
            confirmText: 'Login',
            cancelText: 'Batal',
            onConfirm: () => navigate('/login')
        });
        return;
    }
    setError('');

    if (!date || !time) {
        setError("Please select date and time.");
        return;
    }

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hour duration

    try {
        const payload = {
            field_id: parseInt(fieldId),
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_member_booking: isMemberBooking
        };

        const res = await api.post('/bookings/', payload);
        setBookingData(res.data.data);
        setShowPayment(true);
    } catch (err) {
        console.error("Booking failed:", err);
        setError(err.response?.data?.error || "Booking failed. Please try again.");
        if (err.response?.status === 401) {
            setModal({
                isOpen: true,
                title: 'Login Required',
                message: 'Please login to book a field.',
                type: 'error',
                action: () => navigate('/login')
            });
        }
    }
  };

  const handleUploadProof = async () => {
    if (!paymentProof) {
        setModal({
            isOpen: true,
            title: 'File Required',
            message: 'Please select a file first.',
            type: 'error'
        });
        return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('proof', paymentProof);

    try {
        await api.post(`/bookings/${bookingData.id}/payment-proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        setModal({
            isOpen: true,
            title: 'Berhasil',
            message: 'Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.',
            type: 'success',
            action: () => navigate('/profile')
        });
    } catch (err) {
        console.error("Upload failed:", err);
        setModal({
            isOpen: true,
            title: 'Gagal',
            message: 'Gagal mengupload bukti pembayaran.',
            type: 'error'
        });
    } finally {
        setUploading(false);
    }
  };

  if (loading) return (
    <div className="text-center mt-10 flex justify-center">
      <OrbitProgress variant="track-disc" color="#3184cc" size="medium" text="" textColor="" />
    </div>
  );

  if (!field) return <div className="text-center mt-10 text-red-500">{error || "Field not found"}</div>;

  if (showPayment && bookingData) {
    return (
      <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10 text-center">
        <Modal 
          isOpen={modal.isOpen} 
          onClose={closeModal} 
          title={modal.title} 
          message={modal.message} 
          type={modal.type} 
        />
        <h2 className="text-2xl font-bold mb-4">Payment Required</h2>
        <p className="mb-4">Scan the QRIS code below to pay Rp {bookingData.total_price.toLocaleString()}</p>
        
        <div className="flex justify-center mb-6">
          <QRCodeSVG value={`QRIS-PAYLOAD-${bookingData.id}-${bookingData.total_price}`} size={200} />
        </div>
        
        <p className="text-sm text-gray-500 mb-6">Silahkan scan QRIS di atas untuk melakukan pembayaran</p>
        
        <div className="space-y-4 text-left">
          <div>
              <label className="block text-gray-700 mb-2 font-medium">Upload Bukti Pembayaran</label>
              <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setPaymentProof(e.target.files[0])}
                  className="w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
              />
          </div>

          <button 
            onClick={handleUploadProof}
            disabled={uploading || !paymentProof}
            className={`w-full py-2 rounded-md transition font-medium ${
                uploading || !paymentProof 
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {uploading ? 'Mengupload...' : 'Kirim Bukti Pembayaran'}
          </button>
          
          <button 
            onClick={() => setShowPayment(false)}
            className="w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-50 transition"
          >
            Batal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-md mt-10">
      <Modal 
        isOpen={modal.isOpen} 
        onClose={closeModal} 
        title={modal.title} 
        message={modal.message} 
        type={modal.type} 
      />
      <h2 className="text-2xl font-bold mb-6">Booking {field.name}</h2>
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
      <form onSubmit={handleBooking}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Select Date</label>
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
            min={(() => {
                const d = new Date();
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            })()}
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Select Time</label>
          <select 
            value={time} 
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          >
            <option value="">Select Time Slot (2 Hours Session)</option>
            {[...Array(7)].map((_, i) => {
                const hour = i * 2 + 7; // 7, 9, 11, 13, 15, 17, 19
                const timeStr = `${hour.toString().padStart(2, '0')}:00`;
                const nextHourStr = `${(hour+2).toString().padStart(2, '0')}:00`;
                
                // Disable past times
                let isDisabled = false;
                if (date) {
                    const selectedDate = new Date(date);
                    const today = new Date();
                    const isToday = selectedDate.toDateString() === today.toDateString();
                    
                    if (isToday) {
                        const currentHour = today.getHours();
                        // Disable if the session start time has passed
                        if (hour <= currentHour) {
                            isDisabled = true;
                        }
                    }
                }

                return (
                    <option key={timeStr} value={timeStr} disabled={isDisabled}>
                        {timeStr} - {nextHourStr} {isDisabled ? '(Passed)' : ''}
                    </option>
                );
            })}
          </select>
        </div>
        <div className="mb-6 bg-gray-50 p-4 rounded-md">
            <div className="flex items-center mb-4 pb-4 border-b border-gray-200">
                <input
                    id="member-booking"
                    type="checkbox"
                    checked={isMemberBooking}
                    onChange={(e) => setIsMemberBooking(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="member-booking" className="ml-2 text-sm font-medium text-gray-900">
                    Booking Member Sebulan (4 Sesi)
                </label>
            </div>
            
            <div className="flex justify-between mb-2">
                <span>Price per session (2 hours):</span>
                <span>Rp {(field.price_per_hour * 2).toLocaleString()}</span>
            </div>
            {isMemberBooking && (
                <div className="flex justify-between mb-2 text-blue-600">
                    <span>Member Package (4 weeks):</span>
                    <span>x 4</span>
                </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total {isMemberBooking ? '(4 Sessions)' : '(1 Session)'}:</span>
                <span>Rp {(field.price_per_hour * 2 * (isMemberBooking ? 4 : 1)).toLocaleString()}</span>
            </div>
        </div>
        <button 
          type="submit" 
          className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 transition"
        >
          Confirm Booking
        </button>
      </form>
    </div>
  );
};

export default Booking;
