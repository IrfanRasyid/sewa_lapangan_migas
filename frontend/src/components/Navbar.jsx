import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let isAdmin = false;

  if (token) {
    try {
        const decoded = jwtDecode(token);
        isAdmin = decoded.role === 'admin';
    } catch (e) {
        // Invalid token
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 relative z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          <Link to="/" className="flex items-center text-2xl font-bold text-blue-600 whitespace-nowrap" onClick={closeMenu}>
            <svg className="w-8 h-8 mr-2 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              <path d="M12 15V5" />
              <path d="M9.5 15L7 5" />
              <path d="M14.5 15l2.5-10" />
              <path d="M7 5c2.5-1.5 7.5-1.5 10 0" />
            </svg>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMenu}
              className="text-gray-900 focus:outline-none"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-900 font-medium hover:text-blue-600">Beranda</Link>
            <a href="#tentang" className="text-gray-900 font-medium hover:text-blue-600">Tentang</a>
            <a href="#jadwal" className="text-gray-900 font-medium hover:text-blue-600">Jadwal</a>
            <a href="#kontak" className="text-gray-900 font-medium hover:text-blue-600">Kontak</a>
            
            {token ? (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                {isAdmin ? (
                  <Link to="/admin" className="text-gray-900 font-medium hover:text-blue-600">Admin</Link>
                ) : (
                  <Link to="/profile" className="text-gray-900 font-medium hover:text-blue-600">Profile</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="text-gray-900 font-medium hover:text-red-600"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4 pl-4 border-l border-gray-200">
                <Link to="/login" className="text-gray-900 font-medium hover:text-blue-600">Login</Link>
                <Link to="/register" className="bg-blue-600 text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 absolute w-full left-0 shadow-lg">
          <div className="flex flex-col px-6 py-4 space-y-4">
            <Link to="/" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Beranda</Link>
            <a href="#tentang" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Tentang</a>
            <a href="#jadwal" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Jadwal</a>
            <a href="#kontak" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Kontak</a>
            
            <div className="border-t border-gray-100 pt-4">
              {token ? (
                <div className="flex flex-col space-y-4">
                  {isAdmin ? (
                    <Link to="/admin" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Admin</Link>
                  ) : (
                    <Link to="/profile" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Profile</Link>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="text-left text-gray-900 font-medium hover:text-red-600"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  <Link to="/login" className="text-gray-900 font-medium hover:text-blue-600" onClick={closeMenu}>Login</Link>
                  <Link to="/register" className="bg-blue-600 text-center text-white px-5 py-2 rounded-md font-medium hover:bg-blue-700 transition" onClick={closeMenu}>
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
