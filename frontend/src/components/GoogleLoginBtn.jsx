
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
            let errorMessage = 'Google Login Failed';
            
            if (err.response) {
                if (typeof err.response.data === 'object' && err.response.data.message) {
                    errorMessage += ': ' + err.response.data.message;
                    if (err.response.data.error) errorMessage += ' (' + err.response.data.error + ')';
                } else if (typeof err.response.data === 'string') {
                    // Likely HTML error from Vercel
                    const div = document.createElement('div');
                    div.innerHTML = err.response.data;
                    const text = div.textContent || div.innerText || '';
                    errorMessage += ': ' + text.substring(0, 100) + '...';
                } else {
                    errorMessage += ': ' + err.message;
                }
            } else {
                errorMessage += ': ' + err.message;
            }
            
            alert(errorMessage);
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
