import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Resources.css';

const Resources = () => {
  const [resources, setResources] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await axios.get('/api/resources');
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="resources-container">
        <div className="loading">Loading resources...</div>
      </div>
    );
  }

  return (
    <div className="resources-container">
      <div className="resources-header">
        <h1>Mental Health Resources</h1>
        <p>Help is available 24/7. You are not alone.</p>
      </div>

      {resources && (
        <>
          <div className="crisis-section">
            <h2>🚨 Crisis Support (Available 24/7)</h2>
            <div className="crisis-cards">
              <div className="resource-card crisis-card">
                <h3>{resources.crisis.nationalSuicidePrevention.name}</h3>
                <div className="resource-info">
                  <div className="resource-phone">
                    <strong>Phone:</strong> {resources.crisis.nationalSuicidePrevention.phone}
                  </div>
                  <a 
                    href={resources.crisis.nationalSuicidePrevention.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>

              <div className="resource-card crisis-card">
                <h3>{resources.crisis.crisisTextLine.name}</h3>
                <div className="resource-info">
                  <div className="resource-text">
                    <strong>Text:</strong> {resources.crisis.crisisTextLine.text}
                  </div>
                  <a 
                    href={resources.crisis.crisisTextLine.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="general-resources">
            <h2>📚 General Mental Health Resources</h2>
            <div className="resource-grid">
              {resources.general.map((resource, idx) => (
                <div key={idx} className="resource-card">
                  <h3>{resource.name}</h3>
                  <p className="resource-description">{resource.description}</p>
                  <a 
                    href={resource.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="resource-link"
                  >
                    Visit Website →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="important-notice">
        <h3>Important Notice</h3>
        <p>
          This AI assistant is designed to provide support and information, but it is not a replacement 
          for professional mental health care. If you are experiencing a mental health emergency, please 
          contact emergency services (911) or a crisis hotline immediately.
        </p>
      </div>
    </div>
  );
};

export default Resources;

