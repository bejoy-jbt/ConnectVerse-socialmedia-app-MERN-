import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './DomainPage.css';

const DomainPage = () => {
  // Static domain data
  const initialDomains = [
    {
      domainName: 'Tech Innovations',
      description: 'A platform for the latest technological advancements and innovations.',
      category: 'Technology',
      keywords: ['AI', 'Robotics', 'Blockchain'],
      createdBy: 'Tech Corp',
    },
    {
      domainName: 'Health Solutions',
      description: 'Providing innovative solutions for healthcare and wellness.',
      category: 'Health',
      keywords: ['Wellness', 'Fitness', 'Nutrition'],
      createdBy: 'Health Inc.',
    },
    {
      domainName: 'Eco-Friendly Living',
      description: 'A domain focused on sustainable and eco-friendly living practices.',
      category: 'Lifestyle',
      keywords: ['Sustainability', 'Green Energy', 'Eco'],
      createdBy: 'Green World',
    },
    {
      domainName: 'Digital Marketing Hub',
      description: 'A digital marketing platform offering strategies and tools for businesses.',
      category: 'Business',
      keywords: ['SEO', 'Social Media', 'Marketing'],
      createdBy: 'Market Masters',
    },
    {
      domainName: 'Global Finance Insights',
      description: 'Providing financial insights and investment strategies worldwide.',
      category: 'Finance',
      keywords: ['Investment', 'Stocks', 'Crypto'],
      createdBy: 'Finance Pros',
    },
  ];

  const [domains, setDomains] = useState(initialDomains);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDomains, setFilteredDomains] = useState(initialDomains);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    const filtered = domains.filter((domain) => {
      const domainNameMatch = domain.domainName.toLowerCase().includes(query);
      const categoryMatch = domain.category.toLowerCase().includes(query);
      const keywordsMatch = domain.keywords.some((keyword) =>
        keyword.toLowerCase().includes(query)
      );
      return domainNameMatch || categoryMatch || keywordsMatch;
    });

    setFilteredDomains(filtered);
  };

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
                        <Link to="/search" className="navbar-link">Search</Link>
                      </li>
            <li className="navbar-item">
              <Link to="/sample" className="navbar-link">Upload</Link>
            </li>
            
          </ul>
        </div>
      </nav>
    );
  };

  return (
    <div className="domainPage">
      <Navbar />
      <h1>Domain Information</h1>

      {/* Search Section */}
      <div className="searchSection">
        <input
          type="text"
          placeholder="Search domains by name, category, or keyword"
          value={searchQuery}
          onChange={handleSearchChange}
          className="searchInput"
        />
      </div>

      {/* Domain List */}
      <div className="domainList">
        {filteredDomains.length > 0 ? (
          filteredDomains.map((domain, index) => (
            <div key={index} className="domainCard">
              <h3>{domain.domainName}</h3>
              <p>{domain.description}</p>
              <p>
                <strong>Category:</strong> {domain.category}
              </p>
              <p>
                <strong>Keywords:</strong> {domain.keywords.join(', ')}
              </p>
              <p>
                <strong>Created By:</strong> {domain.createdBy}
              </p>
            </div>
          ))
        ) : (
          <p>No domains found matching your search.</p>
        )}
      </div>
    </div>
  );
};

export default DomainPage;
