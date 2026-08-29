import avatarPresets from "./avatarPresets";

export default function Avatar({userId,username, online, avatar}){
    username = username || '';

    const colors =['bg-teal-200', 'bg-red-200', 'bg-green-200', 'bg-purple-200',
                    'bg-blue-200', 'bg-yellow-200'];
    const userIdBase10 = parseInt(userId,16);
    const colorIndex = userIdBase10 % colors.length;
    const color = colors[colorIndex];

    // avatar can be: a "preset:<id>" string, an uploaded photo (data url), or empty
    const preset = typeof avatar === 'string' && avatar.startsWith('preset:') 
        ? avatarPresets.find(p => String(p.id) === avatar.split(':')[1])
        : null;

    return(
        <div className="w-8 h-8 relative">
            <div className={"w-full h-full rounded-full flex items-center justify-center overflow-hidden " + (preset ? preset.color : color)}>
                {preset ? (
                    <span className="text-center w-full">{preset.emoji}</span>
                ) : avatar ? (
                    <img src={avatar} alt={username} className="w-full h-full object-cover" />
                ) : (
                    <div className="text-center w-full opacity-70">{username[0]}</div>
                )}
            </div>
            {online &&  (
                <div className = "absolute w-3 h-3 bg-green-400 bottom-0 right-0 rounded-full border border-white"></div>
            )}
            {!online && (
                <div className = "absolute w-3 h-3 bg-gray-400 bottom-0 right-0 rounded-full border border-white"></div>
            )}
        </div>
    );
}