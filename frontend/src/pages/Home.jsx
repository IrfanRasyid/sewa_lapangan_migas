import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OrbitProgress } from 'react-loading-indicators';
import api from '../api/axios';
import Modal from '../components/Modal';

const Home = () => {
  const [fields, setFields] = useState([]);
  const [fieldBookings, setFieldBookings] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // User bookings state
  const [myBookings, setMyBookings] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const fetchFieldsAndBookings = async () => {
      try {
        const res = await api.get('/fields/');
        const fieldsData = res.data.data;
        setFields(fieldsData);

        // Fetch bookings for each field
        const bookingsMap = {};
        await Promise.all(fieldsData.map(async (field) => {
            try {
                const bookingRes = await api.get(`/fields/${field.id}/bookings`);
                bookingsMap[field.id] = bookingRes.data.data;
            } catch (err) {
                console.error(`Failed to fetch bookings for field ${field.id}:`, err);
                bookingsMap[field.id] = [];
            }
        }));
        setFieldBookings(bookingsMap);

      } catch (err) {
        console.error("Failed to fetch fields:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFieldsAndBookings();

    // Check login status and fetch user bookings
    const token = localStorage.getItem('token');
    if (token) {
        setIsLoggedIn(true);
        fetchMyBookings();
    }
  }, []);

  const fetchMyBookings = async () => {
      try {
          const res = await api.get('/bookings/my');
          setMyBookings(res.data.data);
      } catch (err) {
          console.error("Failed to fetch my bookings", err);
          // Optional: Handle 401 by setting isLoggedIn(false)
          if (err.response && err.response.status === 401) {
              localStorage.removeItem('token');
              setIsLoggedIn(false);
          }
      }
  };

  const getSlotStatus = (fieldId, hour) => {
    const bookings = fieldBookings[fieldId] || [];
    const now = new Date();
    
    // Use selectedDate for the slot
    // Use local date components to avoid timezone issues with toISOString()
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slotStart = new Date(`${dateStr}T${hour.toString().padStart(2, '0')}:00:00`);
    const slotEnd = new Date(slotStart.getTime() + 2 * 60 * 60 * 1000); // +2 hours

    // Check if past (only if selected date is today)
    const nowYear = now.getFullYear();
    const nowMonth = String(now.getMonth() + 1).padStart(2, '0');
    const nowDay = String(now.getDate()).padStart(2, '0');
    const nowDateStr = `${nowYear}-${nowMonth}-${nowDay}`;
    
    const isToday = dateStr === nowDateStr;
    if (isToday && slotStart < now) return 'past';
    
    // If selected date is in the past (before today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(selectedDate);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < today) return 'past';

    // Check if booked
    const isBooked = bookings.some(b => {
        const bookingStart = new Date(b.start_time);
        const bookingEnd = new Date(b.end_time);
        
        // Check overlap
        // Simple overlap check: (StartA < EndB) and (EndA > StartB)
        return (slotStart < bookingEnd) && (slotEnd > bookingStart) && b.status !== 'canceled';
    });

    return isBooked ? 'booked' : 'available';
  };

  // Generate next 30 days
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        days.push(date);
    }
    return days;
  };

  // Filter bookings into Upcoming and Past
  const now = new Date();
  const upcomingBookings = myBookings.filter(b => new Date(b.end_time) > now).sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const pastBookings = myBookings.filter(b => new Date(b.end_time) <= now).sort((a, b) => new Date(b.start_time) - new Date(a.start_time));

  if (loading) return (
    <div className="text-center mt-10 flex justify-center">
      <OrbitProgress variant="track-disc" color="#3184cc" size="medium" text="" textColor="" />
    </div>
  );

  // Use the first field as the featured single field
  const field = fields.length > 0 ? fields[0] : null;

  return (
    <div>
      {/* Hero Section */}
      <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
        {/* Left Content */}
        <div className="w-full md:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-24 bg-white py-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Lapangan Migas 61<br />
            <span className="text-blue-600">Bulutangkis Premium</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-md">
            Lapangan bulutangkis indoor berkualitas tinggi dengan fasilitas lengkap. Ideal untuk latihan pribadi atau olahraga bersama teman.
          </p>
          <div className="flex space-x-4">
            {field ? (
                <a 
                    href="#jadwal"
                    className="bg-blue-600 text-white px-8 py-3 rounded-md font-medium hover:bg-blue-700 transition"
                >
                    Lihat Jadwal
                </a>
            ) : (
                <button disabled className="bg-gray-400 text-white px-8 py-3 rounded-md font-medium cursor-not-allowed">
                    Lihat Jadwal
                </button>
            )}
            <a 
                href="#tentang"
                className="bg-white text-blue-600 border border-blue-600 px-8 py-3 rounded-md font-medium hover:bg-blue-50 transition"
            >
                Hubungi Kami
            </a>
          </div>
        </div>

        {/* Right Image */}
        <div className="hidden md:block w-full md:w-1/2 bg-gray-200">
          <img 
            src={field?.image_url || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"} 
            alt="Badminton Court" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* User Bookings Section - Only visible if logged in and has bookings */}
      {isLoggedIn && myBookings.length > 0 && (
          <div className="py-12 bg-gray-50 border-b border-gray-200">
              <div className="container mx-auto px-6">
                  <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">Jadwal Booking Kamu</h2>
                  
                  <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10">
                    {/* Upcoming Bookings */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-6 text-blue-600 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Booking Akan Datang
                        </h3>
                        {upcomingBookings.length > 0 ? (
                            <div className="space-y-4">
                                {upcomingBookings.map(booking => (
                                    <div key={booking.id} className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r-lg">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="font-bold text-gray-800">{booking.field?.name}</h4>
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {new Date(booking.start_time).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                                </p>
                                                <p className="text-lg font-semibold text-blue-700 mt-1">
                                                    {new Date(booking.start_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} - 
                                                    {new Date(booking.end_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                                booking.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                <p>Tidak ada booking yang akan datang.</p>
                                <a href="#jadwal" className="text-blue-600 hover:underline text-sm mt-2 inline-block">Booking sekarang</a>
                            </div>
                        )}
                    </div>

                    {/* Past Bookings */}
                    <div className="bg-white rounded-xl shadow-md p-6">
                        <h3 className="text-xl font-bold mb-6 text-gray-600 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                            Riwayat Selesai
                        </h3>
                        {pastBookings.length > 0 ? (
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {pastBookings.map(booking => (
                                    <div key={booking.id} className="border border-gray-200 p-4 rounded-lg hover:bg-gray-50 transition">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <h4 className="font-medium text-gray-800">{booking.field?.name}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(booking.start_time).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                                                    booking.status === 'paid' ? 'bg-green-100 text-green-700' :
                                                    booking.status === 'canceled' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-700'
                                                }`}>
                                                    {booking.status === 'paid' ? 'Selesai' : booking.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                <p>Belum ada riwayat booking.</p>
                            </div>
                        )}
                    </div>
                  </div>
              </div>
          </div>
      )}

      {/* About Section */}
      <div 
        id="tentang" 
        className="py-20 relative bg-cover bg-center"
        style={{ backgroundImage: `url(${field?.images || "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop"})` }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        <div className="container mx-auto px-6 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Tentang Lapangan Kami</h2>
                <p className="text-lg text-gray-200 max-w-3xl mx-auto">
                    Lapangan bulutangkis indoor yang siap memberikan pengalaman bermain terbaik untuk Anda.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                {/* Facilities Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-10 shadow-xl">
                    <h3 className="text-2xl font-bold text-gray-900 mb-8">Fasilitas Lengkap</h3>
                    <ul className="space-y-4">
                        {[
                            "Pencahayaan LED terang dan merata",
                            "Net standar",
                            "Kamar ganti bersih",
                            "Lokasi strategis dan mudah diakses"
                        ].map((item, index) => (
                            <li key={index} className="flex items-start">
                                <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                <span className="text-gray-700 text-lg">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Information Card */}
                <div className="bg-blue-600/95 backdrop-blur-sm rounded-2xl p-10 text-white shadow-xl">
                    <h3 className="text-2xl font-bold mb-8">Informasi Penting</h3>
                    
                    <div className="space-y-6">
                        <div>
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Harga Sewa</p>
                            <div className="flex items-baseline">
                                <span className="text-4xl font-bold">{field ? `Rp ${field.price_per_hour.toLocaleString('id-ID')}` : 'Rp 35.000'}</span>
                                <span className="text-blue-100 ml-2">/ jam</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Minimal Booking</p>
                            <p className="text-xl font-medium">2 jam (1 sesi)</p>
                        </div>

                        <div>
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Pembayaran</p>
                            <p className="text-xl font-medium">QRIS</p>
                        </div>

                        <div className="pt-4 border-t border-blue-500">
                            <p className="text-blue-100 text-sm font-semibold uppercase tracking-wider mb-1">Catatan</p>
                            <p className="text-lg">Reservasi H-1 untuk memastikan ketersediaan</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Schedule Section */}
      {field && (
        <div id="jadwal" className="py-20 bg-gray-50">
            <div className="container mx-auto px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">Jadwal Ketersediaan</h2>
                
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
                        <h4 className="text-xl font-semibold mb-6 text-gray-800 flex items-center">
                            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            Jadwal Lapangan
                        </h4>

                        {/* Date Selector */}
                        <div className="mb-8 overflow-x-auto pb-4 w-full">
                            <div className="flex space-x-3">
                                {getNext30Days().map((date, index) => {
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    const dayName = date.toLocaleDateString('id-ID', { weekday: 'short' });
                                    const dayNumber = date.getDate();
                                    
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 flex flex-col items-center min-w-[60px] p-3 rounded-xl transition border ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105' 
                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                            }`}
                                        >
                                            <span className="text-xs font-medium uppercase mb-1">{dayName}</span>
                                            <span className="text-xl font-bold">{dayNumber}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {[7, 9, 11, 13, 15, 17, 19].map(hour => {
                                const status = getSlotStatus(field.id, hour);
                                let statusClass = 'bg-gray-100 border-gray-200 text-gray-400';
                                let statusText = 'Selesai';
                                let icon = (
                                    <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                );
                                
                                if (status === 'available') {
                                    statusClass = 'bg-white border-green-500 text-green-600 hover:bg-green-50 cursor-pointer shadow-sm';
                                    statusText = 'Tersedia';
                                    icon = (
                                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    );
                                } else if (status === 'booked') {
                                    statusClass = 'bg-red-50 border-red-200 text-red-500';
                                    statusText = 'Booked';
                                    icon = (
                                        <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    );
                                }

                                return (
                                    <div key={hour} className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center ${statusClass} transition duration-300`}>
                                        <span className="text-xl font-bold mb-1">{hour.toString().padStart(2, '0')}:00</span>
                                        {icon}
                                        <span className="text-xs font-semibold uppercase tracking-wide">{statusText}</span>
                                    </div>
                                );
                            })}
                        </div>
                        
                        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex flex-wrap gap-6 justify-center md:justify-start bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-white"></div>
                                    <span className="text-sm font-medium text-gray-700">Tersedia</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-red-100 border-2 border-red-200"></div>
                                    <span className="text-sm font-medium text-gray-700">Terisi</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full bg-gray-200 border-2 border-gray-300"></div>
                                    <span className="text-sm font-medium text-gray-700">Selesai</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => {
                                    if (!isLoggedIn) {
                                        setModal({
                                            isOpen: true,
                                            title: 'Login Diperlukan',
                                            message: 'Silakan login terlebih dahulu untuk memesan lapangan.',
                                            type: 'warning',
                                            confirmText: 'Login',
                                            cancelText: 'Batal',
                                            onConfirm: () => navigate('/login')
                                        });
                                    } else {
                                        navigate(`/booking/${field.id}`);
                                    }
                                }}
                                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg"
                            >
                                Booking Sekarang
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      {/* Contact Section */}
      <div id="kontak" className="py-20 bg-white">
        <div className="container mx-auto px-6">
            <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Hubungi Kami</h2>
                <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                    Kami siap membantu Anda. Jangan ragu untuk menghubungi kami untuk pertanyaan atau pemesanan.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-center">
                <div className="p-6 bg-gray-50 rounded-xl col-span-1 md:col-span-3 lg:col-span-1">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Alamat</h3>
                    <p className="text-gray-600 mb-4">Jl. Komp. Migas III No.69, RT.8/RW.1, Palmerah, Kec. Palmerah, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11480</p>
                    <div className="w-full rounded-xl overflow-hidden shadow-sm">
                        <iframe 
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d350.5930439186147!2d106.78659504379742!3d-6.196572271986091!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f7ed08db612d%3A0x8173f677f6b4f1fb!2sGOR%20Bulu%20Tangkis!5e0!3m2!1sen!2sid!4v1769878432866!5m2!1sen!2sid" 
                            width="100%" 
                            height="200" 
                            style={{border:0}} 
                            allowFullScreen="" 
                            loading="lazy" 
                            referrerPolicy="no-referrer-when-downgrade"
                        ></iframe>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl flex flex-col justify-center items-center h-full">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Telepon/WhatsApp</h3>
                    <p className="text-gray-600">+62 812 3456 7890</p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl flex flex-col justify-center items-center h-full">
                    <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Email</h3>
                    <p className="text-gray-600">info@bulutangkiscourt.com</p>
                </div>
            </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
