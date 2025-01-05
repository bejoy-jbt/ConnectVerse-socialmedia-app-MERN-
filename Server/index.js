const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");
const session = require("express-session");
const EmployeeModel = require('./models/Employee');
const axios = require('axios');
const ChatMessage = require("./models/ChatMessage");


/*import dotenv from "dotenv";
import Conversation from "./models/conversation.model.js";
import Message from "./models/message.model.js";
*/


require('dotenv').config(); // Load environment variables
const nodemailer = require("nodemailer");
const crypto = require("crypto");



// Session setup
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' } // Use HTTPS in production
}));

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST','PUT'],
    credentials: true, // Allow cookies (session management)
}));


app.use(cors({
    origin: 'http://localhost:5173', // Frontend URL
    methods: ['GET', 'POST', 'PUT'], // Allow the necessary methods
    credentials: true, // Ensure that cookies/session data are sent with the request
}));

// Serve static files (for profile pictures)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/employee", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("Connected to MongoDB"))
    .catch(error => console.log("Error connecting to MongoDB:", error));

// Ensure 'uploads' directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname) // Save with timestamp
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, and GIF are allowed.'), false);
    }
};

const upload = multer({ storage, fileFilter });

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Helper function to generate a random token for password reset
const generateToken = () => crypto.randomBytes(32).toString("hex");

// Temporary storage for reset tokens (use a database in production)
const resetTokens = new Map();

// Routes

// Login route
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    EmployeeModel.findOne({ name: username })
        .then(user => {
            if (!user) {
                return res.status(404).json("User not found");
            }
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) {
                    return res.status(500).json({ error: "Error comparing passwords" });
                }
                if (!isMatch) {
                    return res.status(401).json("Invalid credentials");
                }
                req.session.user = { id: user._id };
                res.json("success");
            });
        })
        .catch(err => res.status(500).json({ error: "Server error" }));
});

app.post('/register', upload.single('profilePicture'), async (req, res) => {
    const { name, email, password, bio } = req.body;
    const profilePicture = req.file ? `uploads/${req.file.filename}` : null;

    try {
        // Check if the username already exists
        const existingUser = await EmployeeModel.findOne({ name }); // Check by 'name' (username)
        if (existingUser) {
            return res.status(400).json({ error: "Username already taken. Please choose another one." });
        }

        // Check if the email already exists (optional, if you want email uniqueness as well)
       

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new EmployeeModel({
            name,
            email,
            password: hashedPassword,
            bio,
            profilePicture
        });

        // Save user to the database
        await newUser.save();
        res.json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Error registering user" });
    }
});


// Profile route
app.get('/profile', async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const user = await EmployeeModel.findById(req.session.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload profile picture route
app.post('/upload-profile-picture', upload.single('profilePicture'), async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    console.log("Uploaded file:", req.file); // Debug uploaded file
  
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }
  
      // Define profile picture path
      const profilePicturePath = path.join('uploads', req.file.filename);
  
      // Update user in the database
      const updatedUser = await EmployeeModel.findByIdAndUpdate(
        req.session.user.id,
        { profilePicture: profilePicturePath },
        { new: true } // Return the updated document
      ).select('-password'); // Exclude password from the response
  
      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }
  
      res.json({ message: "Profile picture updated", profilePicture: updatedUser.profilePicture });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res.status(500).json({ error: "Server error" });
    }
  });


// Search route
app.get("/search", (req, res) => {
    const { name } = req.query;
    EmployeeModel.find({ name: { $regex: name, $options: 'i' } })
        .then(users => res.json(users))
        .catch(err => res.status(500).json({ error: "Server error" }));
});

// forgot password
app.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
        // Log received email
        console.log("Received email for password reset:", email);

        // Check if the email exists in the database
        const user = await EmployeeModel.findOne({ email });
        if (!user) {
            console.error("Email not found:", email);
            return res.status(404).json({ error: "Email not found" });
        }

        // Generate a token for password reset
        const token = generateToken();
        resetTokens.set(token, user._id);

        // Create a password reset link
        const resetLink = `http://localhost:5173/reset-password/${token}`;
        console.log("Generated reset link:", resetLink);

        // Send email
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Password Reset",
            html: `
                <p>You requested a password reset. Click the link below to reset your password:</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>If you did not request this, please ignore this email.</p>
            `
        });

        console.log("Password reset email sent to:", email);
        res.json({ message: "Password reset email sent successfully." });
    } catch (err) {
        console.error("Error processing /forgot-password route:", err.message, err.stack);
        res.status(500).json({ error: "Error processing request" });
    }
});




// Reset Password route
app.post("/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!resetTokens.has(token)) {
        return res.status(400).json({ message: "Invalid or expired token" });
    }

    const userId = resetTokens.get(token);
    resetTokens.delete(token);

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await EmployeeModel.findByIdAndUpdate(userId, { password: hashedPassword });
        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});




// Update profile route
app.put('/update-profile', (req, res) => {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  
    const { name, email, bio } = req.body;
  
    if (!name || !email || !bio) {
      return res.status(400).json({ error: 'All fields are required.' });
    }
  
    // Update the user data in the database
    EmployeeModel.findByIdAndUpdate(
      req.session.user.id,
      { name, email, bio },
      { new: true } // Return the updated document
    )
    .then(updatedUser => {
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
    })
    .catch(err => {
        res.status(500).json({ error: 'Error updating profile' });
    });
});

  

 // Import your Employee model

 
 app.post('/like/:id', async (req, res) => {
  const { id } = req.params; // Extract post ID from URL
  
  try {
    // Find the post by ID
    const post = await PostModel.findById(id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment the likes
    post.likes += 1;

    await post.save();

    res.status(200).json({ message: 'Post liked successfully', updatedPost: post });
  } catch (error) {
    console.error('Error liking post:', error);
    res.status(500).json({ message: 'Error liking post' });
  }
});






// Logout route
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ error: "Failed to log out" });
        }
        res.clearCookie("connect.sid");
        res.json({ message: "Logged out successfully" });
    });
});


// Post schema
const PostSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    likes: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    comments: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now }
});



const PostModel = mongoose.model("Post", PostSchema);

// Route to upload an image (post)
app.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const imageUrl = `uploads/${req.file.filename}`;
        const newPost = new PostModel({ imageUrl });
        await newPost.save();
        res.json({ message: "Post uploaded successfully", post: newPost });
    } catch (error) {
        console.error("Error uploading post:", error);
        res.status(500).json({ error: "Error uploading post" });
    }
});

// Route to fetch all posts
app.get('/images', async (req, res) => {
    try {
        const posts = await PostModel.find().sort({ createdAt: -1 });
        res.json(posts);
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "Error fetching posts" });
    }
});

// Route to like a post
/*app.post('/like/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const post = await PostModel.findByIdAndUpdate(id, { $inc: { likes: 1 } }, { new: true });
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json({ message: "Post liked", likes: post.likes });
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).json({ error: "Error liking post" });
    }
});


app.post('/like/:postId', async (req, res) => {
    const { userId } = req.body;
    console.log('Received userId:', userId); // Log the userId to check if it's coming through correctly
  
    // Continue with the rest of your logic...
  });
*/
  

  

// Route to add a comment
app.post('/comment/:id', async (req, res) => {
    const { id } = req.params;
    const { comment } = req.body;
    if (!comment || comment.trim() === "") {
        return res.status(400).json({ error: "Comment cannot be empty" });
    }

    try {
        const post = await PostModel.findByIdAndUpdate(
            id,
            { $push: { comments: comment } },
            { new: true }
        );
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json({ message: "Comment added", comments: post.comments });
    } catch (error) {
        console.error("Error adding comment:", error);
        res.status(500).json({ error: "Error adding comment" });
    }
});



// Follow route
app.post("/follow", async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.body;

    try {
        // Ensure the user is not trying to follow themselves
        if (req.session.user.id === userId) {
            return res.status(400).json({ error: "You cannot follow yourself" });
        }

        // Find the user to follow
        const userToFollow = await EmployeeModel.findById(userId);
        if (!userToFollow) {
            return res.status(404).json({ error: "User not found" });
        }

        // Add the current user to the following list of the target user
        userToFollow.followers.push(req.session.user.id);
        await userToFollow.save();

        // Add the target user to the following list of the current user
        const currentUser = await EmployeeModel.findById(req.session.user.id);
        currentUser.following.push(userId);
        await currentUser.save();

        res.json({ message: "User followed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// Unfollow route
app.post("/unfollow", async (req, res) => {
    if (!req.session.user || !req.session.user.id) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId } = req.body;

    try {
        // Ensure the user is not trying to unfollow themselves
        if (req.session.user.id === userId) {
            return res.status(400).json({ error: "You cannot unfollow yourself" });
        }

        // Find the user to unfollow
        const userToUnfollow = await EmployeeModel.findById(userId);
        if (!userToUnfollow) {
            return res.status(404).json({ error: "User not found" });
        }

        // Remove the current user from the following list of the target user
        userToUnfollow.followers.pull(req.session.user.id);
        await userToUnfollow.save();

        // Remove the target user from the following list of the current user
        const currentUser = await EmployeeModel.findById(req.session.user.id);
        currentUser.following.pull(userId);
        await currentUser.save();

        res.json({ message: "User unfollowed successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});


app.post('/follow', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Proceed with follow logic
  });
  
  app.post('/follow', (req, res) => {
    const token = req.cookies.token; // or req.header('Authorization')
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Verify the token and proceed with follow logic
  });

  
  app.post('/follow', (req, res) => {
    console.log('Request headers:', req.headers);
    console.log('Session or token:', req.session.user); // or JWT verification logic
    if (!req.session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Follow logic here
  });
  


// Example backend code for following a user
app.post('/follow', async (req, res) => {
    const { userId } = req.body; // The user ID of the user being followed
    const loggedInUser = req.user; // Get the logged-in user (from session or JWT)
  
    if (!loggedInUser) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
  
    try {
      // Logic to follow a user (e.g., add to the follower list)
      const followResult = await User.findByIdAndUpdate(
        userId,
        { $addToSet: { followers: loggedInUser._id } }, // Add the logged-in user to the followers list
        { new: true }
      );
  
      if (!followResult) {
        return res.status(404).json({ error: 'User not found' });
      }
  
      // Return a success message
      res.status(200).json({ message: 'User followed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  
/*
  app.post('/like/:postId', async (req, res) => {
    const { userId } = req.body; // Assuming userId is in the body
    const { postId } = req.params;

    try {
        const post = await PostModel.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        if (post.likedBy.includes(userId)) {
            return res.status(400).json({ message: 'You have already liked this post.' });
        }

        post.likes += 1;
        post.likedBy.push(userId);
        await post.save();

        res.status(200).json({ message: 'Post liked successfully' });
    } catch (error) {
        console.error('Error while liking the post:', error);
        res.status(500).json({ message: 'Error liking post.' });
    }
});
*/

//message schema
const messageSchema = new mongoose.Schema(
	{
		senderId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		receiverId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Employee",
			required: true,
		},
		message: {
			type: String,
			required: true,
		},
		// createdAt, updatedAt
	},
	{ timestamps: true }
);

const Message = mongoose.model("message", messageSchema);


//conversion schema
const ConversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Message' }],
    lastMessage: String,
    updatedAt: { type: Date, default: Date.now },
});

const ConversationModel = mongoose.model('Conversation', ConversationSchema);

app.post("/send-message", (req, res) => {
    const { message } = req.body;
    debugger; // Breakpoint added here
    console.log("Received message:", message);
    // Handle saving the message or sending it to other users here
    res.json({ success: true, message: "Message received" });
});



//geeks for geeks

app.get("/messages", async (req, res) => {
	try {
		const messages = await ChatMessage.find();
		res.json(messages);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});

app.post("/messages", async (req, res) => {
	try {
		const { user, message } = req.body;

		if (!user || !message) {
			return res
				.status(400)
				.json({ error: "User and message are required" });
		}

		const chatMessage = new ChatMessage({
			user,
			message,
		});

		await chatMessage.save();

		res.status(201).json(chatMessage);
	} catch (error) {
		console.error(error);
		res.status(500).json({ error: "Internal Server Error" });
	}
});



app.get('/images', async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have middleware for user authentication
    const posts = await Post.find({ userId }); // Fetch posts for the logged-in user
    res.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});



// domain search 



// models/DomainInfo.js



const domainInfoSchema = new mongoose.Schema({
  domainName: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  keywords: {
    type: [String],
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('DomainInfo', domainInfoSchema);


app.post('/upload', async (req, res) => {
    const { domainName, description, category, keywords, createdBy } = req.body;
  
    console.log("Received data:", req.body); // Check if the data is coming as expected
  
    try {
      const newDomainInfo = new DomainInfo({
        domainName,
        description,
        category,
        keywords: keywords.split(',').map(keyword => keyword.trim()),  // Process keywords
        createdBy,
      });
  
      await newDomainInfo.save();
      res.status(201).json(newDomainInfo);
    } catch (error) {
      console.error("Error uploading domain:", error);  // Log the detailed error
      res.status(500).json({ message: 'Error uploading domain information' });
    }
  });
  
  
  // Route to search domain information by name, category, or keywords
  app.get('/search', async (req, res) => {
    const { query } = req.query;
    try {
      const searchResults = await DomainInfo.find({
        $or: [
          { domainName: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { keywords: { $in: [query] } },
        ],
      });
      res.json(searchResults);
    } catch (error) {
      res.status(500).json({ message: 'Error searching domain information' });
    }
  });
  


// Start server
app.listen(3001, () => {
    console.log("Server is running on port 3001");
});
