import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './ProfilePage.css';

// Navbar Component
const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <ul className="navbar-links">
          <li className="navbar-item">
            <Link to="/home" className="navbar-link">Home</Link>
          </li>
          <li className="navbar-item">
            <Link to="/chat" className="navbar-link">Chat</Link>
          </li>
         
          <li className="navbar-item">
                      <Link to="/search" className="navbar-link">Search</Link>
                    </li>
          <li className="navbar-item">
            <Link to="/sample" className="navbar-link">Upload</Link>
          </li>
          <li className="navbar-item">
            <Link to="/domain" className="navbar-link">Domain</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [showLargeImage, setShowLargeImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); 
  const [isFollowing, setIsFollowing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('http://localhost:3001/profile', { withCredentials: true })
      .then((response) => {
        setUser({
          ...response.data,
          followerCount: 0,
          followingCount: 0,
          postCount: 0, // Initially set post count to 0
        });
        setIsFollowing(response.data.isFollowing);
      })
      .catch((error) => {
        console.error('Error fetching user details:', error);
      });

    axios
      .get('http://localhost:3001/images', { withCredentials: true })
      .then((response) => {
        setPosts(response.data);
        setUser((prevUser) => ({
          ...prevUser,
          postCount: response.data.length,
        }));
      })


      
      .catch((error) => {
        console.error('Error fetching posts:', error);
      });
  }, []);

  const handleLogout = () => {
    axios
      .post('http://localhost:3001/logout', {}, { withCredentials: true })
      .then(() => {
        window.location.href = '/login';
      })
      .catch((error) => {
        console.error('Error logging out:', error);
      });
  };

  const handleSettings = () => {
    navigate('/update-profile');
  };

  const followUser = async (userId) => {
    try {
      const response = await axios.post('http://localhost:3001/follow', { userId }, { withCredentials: true });
      setIsFollowing(true);
      setUser((prevUser) => ({
        ...prevUser,
        followerCount: prevUser.followerCount + 1,
      }));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unfollowUser = async (userId) => {
    try {
      const response = await axios.post('http://localhost:3001/unfollow', { userId }, { withCredentials: true });
      setIsFollowing(false);
      setUser((prevUser) => ({
        ...prevUser,
        followerCount: prevUser.followerCount - 1,
      }));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
  };

  if (!user) return <p>Loading profile...</p>;

  return (
    <div>
      <Navbar /> {/* Render Navbar here */}
      <div className="profilePage-wrapper">
        <div className="profilePage-module">
          <div className="profilePage-burgerMenuContainer">
            <button className="profilePage-burgerMenu" onClick={() => setMenuOpen(!menuOpen)}>
              &#9776;
            </button>
            {menuOpen && (
              <div className="profilePage-burgerMenuDropdown">
                <button className="profilePage-menuItem" onClick={handleLogout}>Logout</button>
                <button className="profilePage-menuItem" onClick={handleSettings}>Update Profile</button>
              </div>
            )}
          </div>

          <div className="profilePage-header">
            <div className="profilePage-pictureContainer">
              <img
                src={`http://localhost:3001/${user.profilePicture}`}
                alt="Profile"
                className="profilePage-picture"
                onClick={() => setShowLargeImage(true)}
              />
              {showLargeImage && (
                <div className="profilePage-overlay" onClick={() => setShowLargeImage(false)}>
                  <img
                    src={`http://localhost:3001/${user.profilePicture}`}
                    alt="Profile Large"
                    className="profilePage-largePicture"
                  />
                </div>
              )}
            </div>
          </div>

          <h1 className="profilePage-username">{user.name}</h1>
          <div className="profilePage-details">
            <div className="profilePage-contactInfo">
              <div className="profilePage-contactItem">📧 {user.email}</div>
            </div>
            <p className="profilePage-bio">{user.bio}</p>
          </div>
          <div className="profilePage-stats">
            <div className="profilePage-statItem">
              <div className="profilePage-statValue">{user.followerCount}</div>
              <div className="profilePage-statLabel">Followers</div>
            </div>
            <div className="profilePage-statItem">
              <div className="profilePage-statValue">{user.followingCount}</div>
              <div className="profilePage-statLabel">Following</div>
            </div>
            <div className="profilePage-statItem">
              <div className="profilePage-statValue">{user.postCount}</div>
              <div className="profilePage-statLabel">Posts</div>
            </div>
          </div>

          <div className="profilePage-followButton">
            {isFollowing ? (
              <button onClick={() => unfollowUser(user._id)}>Unfollow</button>
            ) : (
              <button onClick={() => followUser(user._id)}>Follow</button>
            )}
          </div>

          <div className="profilePage-posts">
            <h2>My Posts</h2>
            {posts.length > 0 ? (
              <div className="profilePage-postList">
                {posts.map((post) => (
                  <div
                    key={post._id}
                    className="profilePage-postCard"
                    onClick={() => handlePostClick(post)}
                  >
                    <img
                      src={`http://localhost:3001/${post.imageUrl}`}
                      alt="Post"
                      className="profilePage-postImage"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>No posts available.</p>
            )}
          </div>

          {selectedPost && (
            <div className="profilePage-postDetailsPopup">
              <h3>Post Details</h3>
              <img
                src={`http://localhost:3001/${selectedPost.imageUrl}`}
                alt="Selected Post"
                className="profilePage-postDetailImage"
              />
              <div className="profilePage-postDetailInfo">
                <p>Likes: {selectedPost.likesCount}</p>
                <p>Comments: {selectedPost.commentsCount}</p>
                <button onClick={() => setSelectedPost(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
