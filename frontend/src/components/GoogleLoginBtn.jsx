
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const GoogleLoginBtn = () => {
    const navigate = useNavigate();

    const handleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post('/auth/google', {
                token: credentialResponse.credential
            });
            
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user)); // Store user info if needed

            if (res.data.user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/');
            }
            // Trigger a custom event or reload to update UI components like Navbar
            window.dispatchEvent(new Event("storage"));
            window.location.reload(); 
        } catch (err) {
            console.error('Google Login Failed Backend:', err);
            alert('Google Login Failed: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleError = () => {
        console.log('Google Login Failed');
        alert('Google Login Failed');
    };

    return (
        <div className="flex justify-center mt-4 w-full">
            <GoogleLogin
                onSuccess={handleSuccess}
                onError={handleError}
                theme="filled_blue"
                shape="pill"
                width="100%"
            />
        </div>
    );
};

export default GoogleLoginBtn;
