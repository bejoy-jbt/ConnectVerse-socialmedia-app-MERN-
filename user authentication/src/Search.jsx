import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './Search.css';


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
            <Link to="/profile" className="navbar-link">Profile</Link>
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

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    setHasSearched(true);
    try {
      const response = await axios.get(`http://localhost:3001/search?name=${searchTerm}`);
      setResults(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFollow = (userId) => {
    axios
      .post('http://localhost:3001/follow', { userId }, { withCredentials: true })
      .then(() => {
        setResults((prevResults) =>
          prevResults.map((user) =>
            user._id === userId ? { ...user, isFollowing: true } : user
          )
        );
      })
      .catch((error) => {
        console.error('Error following user:', error);
      });
  };

  const handleUnfollow = (userId) => {
    axios
      .post('http://localhost:3001/unfollow', { userId }, { withCredentials: true })
      .then(() => {
        setResults((prevResults) =>
          prevResults.map((user) =>
            user._id === userId ? { ...user, isFollowing: false } : user
          )
        );
      })
      .catch((error) => {
        console.error('Error unfollowing user:', error);
      });
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      setResults([]);
      setHasSearched(false);
    }
  };

  

  return (
   
      
    <div className="search-container">
      <Navbar />
      <h1 className="search-title">Search Users</h1>
      <div className="search-input-container">
      
        <input
          type="text"
          className="search-input"
          placeholder="Enter a name to search..."
          value={searchTerm}
          onChange={handleInputChange}
        />
        <button className="search-button" onClick={handleSearch}>
          Search
        </button>
      </div>
      <div className="results-container">
        {results.length > 0 ? (
          <ul className="results-list">
            {results.map((user) => (
              <li key={user._id} className="result-item">
                <span className="user-name">{user.name}</span>
                {user.isFollowing ? (
                  <button className="unfollow-button" onClick={() => handleUnfollow(user._id)}>
                    Unfollow
                  </button>
                ) : (
                  <button className="follow-button" onClick={() => handleFollow(user._id)}>
                    Follow
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          hasSearched && <p className="no-results">No user found</p>
        )}
      </div>
    </div>
    
  );
};

export default Search;
