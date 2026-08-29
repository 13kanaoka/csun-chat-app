// a small set of built-in avatar options so people don't have to upload a photo
// each one is stored on the user document as teh string "preset:<id>"

const avatarPresets = [
    { id: 0, emoji: '🐱', color: 'bg-orange-200' },
    { id: 1, emoji: '🐶', color: 'bg-yellow-200' },
    { id: 2, emoji: '🦊', color: 'bg-red-200' },
    { id: 3, emoji: '🐼', color: 'bg-gray-200' },
    { id: 4, emoji: '🐸', color: 'bg-green-200' },
    { id: 5, emoji: '🐵', color: 'bg-amber-200' },
    { id: 6, emoji: '🐧', color: 'bg-blue-200' },
    { id: 7, emoji: '🦁', color: 'bg-purple-200' },
];

export default avatarPresets;