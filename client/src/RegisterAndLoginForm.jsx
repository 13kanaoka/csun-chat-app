import {useState, useContext} from "react";
import axios from "axios"
import {UserContext} from "./UserContext.jsx";
import './index.css'

export default function RegisterAndLoginForm() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');
    const [errorMessage, setErrorMessage] = useState('');
    const {setUsername:setLoggedInUsername, setId, setAvatar} = useContext(UserContext);

    // Event when user submits credentials
    async function handleSubmit(ev) {
        // Prevent page from refreshing
        ev.preventDefault();
        setErrorMessage('');

        // Use axios to send HTTP request to backend /register or /login and
        //  responds with a JWT cookie and JSON. App saves username and id globally
        //  using UserContext. User is then automatically 'logged in' on front end
        const url = isLoginOrRegister === 'register' ? 'register' : 'login';

        try{
        const {data} = await axios.post(url, {username, password});
        setLoggedInUsername(username);
        setId(data.userId);
        setAvatar(data.avatar || '');
        }

        catch(error){
            setErrorMessage(error.response?.data?.message || 'Something went wrong, please try again');
        };

    }

    // Login/Register page HTML/CSS
    return (
        <div className="login-container">

            <form  action="#" className="login-form" onSubmit={handleSubmit}>
               
               <div className="input-wrapper">

                <input value={username}
                       onChange={ev => setUsername(ev.target.value)}
                       type="text"
                       placeholder="Username"
                       className="input-field"/>

                <i className="material-symbols-rounded">person</i>
                       
                </div>
                

                <div className="input-wrapper">

                <input value={password} 
                       onChange={ev => setPassword(ev.target.value)} 
                       type="password" 
                       placeholder="Password" 
                       className="input-field"/>

                <i className="material-symbols-rounded">lock</i>

               </div>

                {errorMessage && (
                    <p className="text-red-600 text-sm text-center mb-2">{errorMessage}</p>
                )}

                <button className="login-button">
                    {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
                </button>
                
            
                
                <div className="text-center mt-2">
                    {isLoginOrRegister === 'register' && (


                        <p className="signup-text">
                        Already a member? <a href="#" onClick={() => {setIsLoginOrRegister('login'); setErrorMessage('');}}>Login here</a>
                        </p>


                    )}
                    {isLoginOrRegister === 'login' && (


                        <p className="signup-text">
                            Don't have an account? <a href="#" onClick={() => {setIsLoginOrRegister('register'); setErrorMessage('');}}>Register</a>
                        </p>


                    )}
                </div>


            </form>

            <div className="mt-4 text-center text-sm text-gray-600 bg-white/80 rounded-lg px-4 py-3">
                <p className="font-semibold text-gray-800">Here for a demo?</p>
                <p className="mb-1">Use logins:</p>
                <div className="flex justify-center gap-8">
                    <div>
                        <div className="font-mono font-semibold text-gray-800">U: demo1</div>
                        <div className="font-mono">P: pass</div>
                    </div>
                    <div>
                        <div className="font-mono font-semibold text-gray-800">demo2</div>
                        <div className="font-mono">pass</div>
                    </div>
                </div>
            </div>

        </div>
    );
}