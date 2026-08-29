import axios from "axios";
import { useEffect } from "react";
import { UserContextProvider } from "./UserContext";
import Routes from "./Routes";

function App() {
  axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4040';
  axios.defaults.withCredentials = true;

  // Apply the saved dark mode preference on every page load, not just when
  //  the toggle in Account.jsx is clicked
  useEffect(() => {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    document.documentElement.classList.toggle('dark', darkMode);
  }, []);

  return (
    // UserContextProvider provides all children components with user information
    <UserContextProvider>
      <Routes/>
    </UserContextProvider>

  )
}

export default App
