const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bcrypt = require('bcryptjs')
const User = require('./models/User');
const Message =  require('./models/Message');
const ws = require('ws');
const fs = require('fs');
const path = require('path');

// Dotenv (.env) files contain sensitive keys
dotenv.config();

// Attempt to connect to MongoDB
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // exit the process if db fails to connect
  }
})();

// Retrieve 
const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(10);

// Initialize Express.js app
const app = express();
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving static files from:', path.join(__dirname, 'uploads'));
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    credentials: true,
    origin: process.env.CLIENT_URL,
}));

async function getUserDataFromRequest(req) {
    return new Promise ((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) throw err;
                resolve(userData);
            });
        } else {
            reject('no token');
        }
    });

}

app.get('/test', (req, res) => {
    res.json('test ok');
});

app.get('/messages/:userId', async (req,res) => {
    const {userId} = req.params;
    const userData = await getUserDataFromRequest(req);
    const ourUserId = userData.userId;
    const messages = await Message.find({
        sender:{$in:[userId,ourUserId]},
        recipient:{$in:[userId,ourUserId]},
    }).sort({createdAt: 1})
    .exec();
    res.json(messages);
});

app.get('/people', async (req,res) => {
    const users = await User.find({}, {'_id':1,username:1,avatar:1});
    res.json(users);
});

// Form submitted from UserContext.jsx 
app.get('/profile', async (req, res) => {
    // Check if user is storing login cookie containing token 
    const token = req.cookies?.token;

    // If user has cookie, verify using JSON Web Token secrey key and 
    //  respond to front end with user data {username, userID}
    if (token) {
        jwt.verify(token, jwtSecret, {}, async (err, userData) => {
            if (err) throw err;
            const user = await User.findById(userData.userId, {username:1, avatar:1});
            res.json({userId: userData.userId, username: user.username, avatar: user.avatar})
        });
    } else {
       // If user has no token, then they are not logged in and respond 
       //  to front end with HTTP status of '401 Unauthorized'
       res.status(401).json('no token'); 
    }
});

app.put('/profile/avatar', async (req, res) => {
    try {
        const userData = await getUserDataFromRequest(req);
        const {avatar} = req.body;

        // reject anything asurdly so we don't bloat the database
        if (typeof avatar === 'string' && avatar.length > 300 * 1024) {
            res.status(413).json({message: 'Image is too large'});
            return;
        }

        await User.findByIdAndUpdate(userData.userId, {avatar: avatar || ''});
        res.json({avatar: avatar || ''});
    } catch (err) {
        res.status(401).json({message: 'Not logged in'});
    }
});

app.put('/profile/username', async (req, res) => {
    try {
        const userData = await getUserDataFromRequest(req);
        const {username} = req.body

        if (!username || !username.trim()) {
            res.status(400).json({message: 'Username cannot be empty'});
            return;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userData.userId,
            {username: username.trim()},
            {new: true, runValidators: true}
        );

        jwt.sign({userId: updatedUser._id, username: updatedUser.username}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: 'none', secure: true}).json({
                userId: updatedUser._id, username: updatedUser.username,
            });
        });
    } catch (err) {
        if (err.code === 11000) {
            res.status(409).json({message: 'Username already exists'});
            return;
        }
        res.status(400).json({message: 'Could not update username'})
    }
});

app.put('/profile/password', async (req, res) => {
    try {
        const userData = await getUserDataFromRequest(req);
        const {currentPassword, newPassword} = req.body;

        if (!currentPassword || !newPassword) {
            res.status(400).json({message: 'Both current and new password are required'});
            return;
        }

        const user = await User.findById(userData.userId);
        const currentOk = bcrypt.compareSync(currentPassword, user.password);

        if (!currentOk) {
            res.status(401).json({message: "current password is incorrect"});
            return;
        }

        user.password = bcrypt.hashSync(newPassword, bcryptSalt);
        await user.save();

        res.json({message: 'Password updated'});
    } catch (err) {
        res.status(400).json({message: 'Could not update password'});
    }
});

// Permanently delete the logged-in user's account and their messages
app.delete('/profile', async (req, res) => {
    try {
        const userData = await getUserDataFromRequest(req);

        await Message.deleteMany({
            $or: [{sender: userData.userId}, {recipient: userData.userId}],
        });
        await User.findByIdAndDelete(userData.userId);

        res.cookie('token', '', {sameSite: 'none', secure: true}).json({message: 'Account deleted'});
    } catch (err) {
        res.status(401).json({message: 'Not logged in'});
    }
});

app.post('/logout', (req,res) => {
    res.cookie('token', '', {sameSite:'none', secure:true}).json('ok');
});

// Form submitted from RegisterAndLoginForm.jsx when user logs in
app.post('/login', async (req, res) => {
    // Retrieve username and password input by user
    const {username, password} = req.body;

    // Find user in database
    const foundUser = await User.findOne({username});

    // Decrypt hashed password (only if a user was found, to avoid comparing against undefined)
    const passOk = foundUser && bcrypt.compareSync(password, foundUser.password);

    // If either the username doesn't exist or the password doesn't match, respond with
    //  the same generic error so we don't reveal which one was wrong
    if (!foundUser || !passOk) {
        res.status(401).json({message: 'Invalid username or password'});
        return;
    }

    // Sign JSON Web Token and respond to front end with a cookie containing token
    //  that 'logs in' user
    jwt.sign({userId:foundUser._id, username}, jwtSecret, {}, (err, token) => {
        res.cookie('token', token, {sameSite: 'none', secure: true}).json({
            userId: foundUser._id, username, avatar: foundUser.avatar,
        });
    });
});

// Form submitted from RegisterAndLoginForm.jsx when user registers
app.post('/register', async (req, res) => {
    // Retrieve username and password input by user
    const {username, password} = req.body;

    // Create user
    try {
        // Hash password using bcrypt Salt key generated earlier
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
        
        // Create user
        const createdUser = await User.create({
            username:username,
            password:hashedPassword
            
        });

        // Sign JSON Web Token with secret key and respond to front end with cookie 
        //  containing token and HTTP status of '201 Created'
        jwt.sign({userId: createdUser._id, username}, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, {sameSite: 'none', secure: true}).status(201).json({
                userId: createdUser._id, username, avatar: createdUser.avatar,
            });
        });
    } catch(err) {
        // Mongo duplicate key error: username is already taken
        if (err.code === 11000) {
            res.status(409).json({message: 'Username already exists'});
            return;
        }
        // Any other failure creating the user
        res.status(500).json({message: 'Something went wrong, please try again'});
    }
});

const server = app.listen(process.env.PORT || 4040);

    function notifyAboutOnlinePeople() {
        [...wss.clients].forEach(client => {
            client.send(JSON.stringify({
                online: [...wss.clients].map(c => ({userId:c.userId, username:c.username, avatar:c.avatar})), 
            }));
        });
    }

const wss = new ws.WebSocketServer({server});
wss.on('connection', (connection, req)=> {

    connection.isAlive = true;

    connection.timer = setInterval(() => {
        connection.ping();
        connection.deathTimer = setTimeout(() => {
            connection.isAlive = false;
            clearInterval(connection.timer);
            connection.terminate();
            notifyAboutOnlinePeople();
            console.log('dead');
        }, 1000);
    }, 5000);

    connection.on('pong', () => {
        clearTimeout(connection.deathTimer);
    });

    //read username and id from the cookie for this connection
    const cookies = req.headers.cookie;
    if(cookies){
        const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='));
        if(tokenCookieString){
            const token = tokenCookieString.split('=')[1];
            if(token){
                jwt.verify(token, jwtSecret, {}, async (err, userData) => {
                    if(err) throw err;
                    const user = await User.findById(userData.userId, {username:1, avatar:1});
                    connection.userId = userData.userId;
                    connection.username = user.username;
                    connection.avatar = user.avatar;
                    notifyAboutOnlinePeople();
                });
            }
        }
    }

    connection.on('message', async (message) => {
        const messageData = JSON.parse(message.toString());
        const {recipient, text, file} = messageData;
        let filename = null;
        if (file?.data) {
            console.log('size', file.data.length);
            const parts = file.name.split('.');
            const ext = parts[parts.length - 1];
            filename = Date.now() + '.' + ext;
            const path = __dirname + '/uploads/' + filename;
            const bufferData = new Buffer(file.data.split(',')[1], 'base64');
            fs.writeFile(path, bufferData, () => {
                console.log('file saved:' + path);
            });
        }
        if (recipient && (text || file)) {
            const MessageDoc = await Message.create({
                sender:connection.userId,
                recipient,
                text,
                file: file ? filename : null,
            });
            console.log('created message');
            [...wss.clients]
                .filter(c => c.userId === recipient)
                .forEach(c => c.send(JSON.stringify({
                    text,
                    sender:connection.userId,
                    recipient,
                    _id:MessageDoc._id,
                })));
        }
    });

    //notify everyone about online people (when someone connects)
    notifyAboutOnlinePeople();
});
 

