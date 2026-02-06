import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Booking from './pages/Booking';
import AdminDashboard from './pages/AdminDashboard';
import AdminUsers from './pages/AdminUsers';

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!googleClientId) {
      console.error("VITE_GOOGLE_CLIENT_ID is missing in environment variables.");
  }

  return (
    <GoogleOAuthProvider clientId={googleClientId || "missing-client-id"}>
      <Router>
        <div className="min-h-screen bg-gray-100">
          <Navbar />
          {/* Debug warning for missing Client ID (Only visible if missing) */}
          {!googleClientId && (
             <div className="bg-red-500 text-white text-center p-2 fixed top-0 left-0 w-full z-50">
                Critical Error: Google Client ID is missing. Please check Vercel Environment Variables (VITE_GOOGLE_CLIENT_ID).
             </div>
          )}
          <main className="container mx-auto px-4 py-8 mt-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/booking/:fieldId" element={<Booking />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
            </Routes>
          </main>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
