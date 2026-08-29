import {useContext, useState} from "react";
import axios from "axios";
import {UserContext} from "./UserContext";
import Avatar from "./Avatar";
import avatarPresets from "./avatarPresets";

export default function Account({onBack, onLogout}) {
    const {id, username, setUsername, avatar, setAvatar} = useContext(UserContext);

    const [usernameInput, setUsernameInput] = useState(username || '');
    const [usernameMessage, setUsernameMessage] = useState('');

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    const [avatarMessage, setAvatarMessage] = useState('');

    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');

    async function saveAvatar(avatarValue) {
        setAvatarMessage('');
        try {
            const {data} = await axios.put('/profile/avatar', {avatar: avatarValue});
            setAvatar(data.avatar);
            setAvatarMessage('Avatar updated');
        } catch (err) {
            setAvatarMessage(err.response?.data?.message || 'Could not update avatar');
        }
    }

    function handleAvatarFile(ev) {
        const file = ev.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                // Crop to a centered square, then scale down, so the saved
                //  avatar stays small no matter how big the original photo was
                const size = 128;
                const minSide = Math.min(img.width, img.height);
                const sx = (img.width - minSide) / 2;
                const sy = (img.height - minSide) / 2;

                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                canvas.getContext('2d').drawImage(img, sx, sy, minSide, minSide, 0, 0, size, size);

                saveAvatar(canvas.toDataURL('image/jpeg', 0.8));
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    }

    async function handleUsernameSubmit(ev) {
        ev.preventDefault();
        setUsernameMessage('');
        try {
            const {data} = await axios.put('/profile/username', {username: usernameInput});
            setUsername(data.username);
            setUsernameMessage('Username updated');
        } catch (err) {
            setUsernameMessage(err.response?.data?.message || 'Could not update username');
        }
    }

    async function handlePasswordSubmit(ev) {
        ev.preventDefault();
        setPasswordMessage('');

        if (newPassword !== confirmNewPassword) {
            setPasswordMessage("New passwords don't match");
            return;
        }

        try {
            await axios.put('/profile/password', {currentPassword, newPassword});
            setPasswordMessage('Password updated');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } catch (err) {
            setPasswordMessage(err.response?.data?.message || 'Could not update password');
        }
    }

    function toggleDarkMode() {
        const next = !darkMode;
        setDarkMode(next);
        localStorage.setItem('darkMode', next);
        document.documentElement.classList.toggle('dark', next);
    }

    return (
        <div className="h-screen overflow-y-auto bg-blue-50 dark:bg-gray-900 flex justify-center py-8 px-4">
            <div className="w-full max-w-md">

                <div className="flex items-center justify-between mb-6">
                    <button onClick={onBack} className="text-sm text-gray-600 dark:text-gray-300">&larr; Back to chat</button>
                    <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Account</h1>
                    <div className="w-16"></div>
                </div>

                {/* Avatar */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 flex items-center justify-center">
                            <div className="scale-150">
                                <Avatar userId={id} username={username} avatar={avatar} online={true} />
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-gray-100">{username}</p>
                            <label className="text-sm text-blue-600 cursor-pointer">
                                Upload photo
                                <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                            </label>
                        </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Or pick an avatar:</p>
                    <div className="flex flex-wrap gap-2">
                        {avatarPresets.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => saveAvatar(`preset:${preset.id}`)}
                                className={"w-9 h-9 rounded-full flex items-center justify-center " + preset.color}
                            >
                                {preset.emoji}
                            </button>
                        ))}
                    </div>
                    {avatarMessage && <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{avatarMessage}</p>}
                </div>

                {/* Dark mode */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 flex items-center justify-between">
                    <span className="text-gray-800 dark:text-gray-100">Dark mode</span>
                    <button
                        onClick={toggleDarkMode}
                        className={"w-11 h-6 rounded-full relative transition-colors " + (darkMode ? 'bg-blue-600' : 'bg-gray-300')}
                    >
                        <span className={"absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition-transform " + (darkMode ? 'translate-x-5' : 'translate-x-0')}></span>
                    </button>
                </div>

                {/* Change username */}
                <form onSubmit={handleUsernameSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Username</p>
                    <input
                        value={usernameInput}
                        onChange={ev => setUsernameInput(ev.target.value)}
                        className="w-full border rounded-sm px-2 py-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    {usernameMessage && <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">{usernameMessage}</p>}
                    <button className="bg-blue-600 text-white text-sm rounded-sm px-3 py-1">Save username</button>
                </form>

                {/* Change password */}
                <form onSubmit={handlePasswordSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 mb-2">Change password</p>
                    <input
                        value={currentPassword}
                        onChange={ev => setCurrentPassword(ev.target.value)}
                        type="password"
                        placeholder="Current password"
                        className="w-full border rounded-sm px-2 py-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <input
                        value={newPassword}
                        onChange={ev => setNewPassword(ev.target.value)}
                        type="password"
                        placeholder="New password"
                        className="w-full border rounded-sm px-2 py-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    <input
                        value={confirmNewPassword}
                        onChange={ev => setConfirmNewPassword(ev.target.value)}
                        type="password"
                        placeholder="Confirm new password"
                        className="w-full border rounded-sm px-2 py-1 mb-2 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                    />
                    {passwordMessage && <p className="text-sm mb-2 text-gray-600 dark:text-gray-300">{passwordMessage}</p>}
                    <button className="bg-blue-600 text-white text-sm rounded-sm px-3 py-1">Update password</button>
                </form>

                <button
                    onClick={onLogout}
                    className="w-full text-center text-sm bg-white dark:bg-gray-800 text-red-600 rounded-lg p-3"
                >
                    Log out
                </button>

            </div>
        </div>
    );
}