import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './Journal.css';

const Journal = () => {
  const [entries, setEntries] = useState([]);
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await axios.get('/api/journal');
      setEntries(response.data.entries || []);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await axios.post('/api/journal', {
        content: content.trim(),
        timestamp: new Date().toISOString()
      });

      setContent('');
      setSubmitted(true);
      fetchEntries();

      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      alert('Failed to save journal entry. Please try again.');
    }
  };

  return (
    <div className="journal-container">
      <div className="journal-header">
        <h1>Journal</h1>
        <p>Express your thoughts and feelings in a safe space</p>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="journal-form">
          <div className="journal-input-section">
            <label htmlFor="journal-content">What's on your mind today?</label>
            <textarea
              id="journal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write freely about your thoughts, feelings, experiences, or anything you'd like to reflect on..."
              rows="10"
              className="journal-textarea"
            />
            <div className="journal-actions">
              <button type="submit" className="save-button" disabled={!content.trim()}>
                Save Entry
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setContent('');
                  setShowForm(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>

          {submitted && (
            <div className="success-message">
              ✓ Journal entry saved!
            </div>
          )}
        </form>
      )}

      {!showForm && (
        <button 
          className="new-entry-button"
          onClick={() => setShowForm(true)}
        >
          + New Journal Entry
        </button>
      )}

      {entries.length > 0 && (
        <div className="journal-entries">
          <h2>Your Journal Entries</h2>
          <div className="entries-list">
            {entries.slice().reverse().map((entry) => (
              <div key={entry.id} className="journal-entry">
                <div className="entry-header">
                  <span className="entry-date">
                    {format(new Date(entry.timestamp), 'MMMM dd, yyyy • h:mm a')}
                  </span>
                </div>
                <div className="entry-content">
                  {entry.content.split('\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph || '\u00A0'}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {entries.length === 0 && !showForm && (
        <div className="empty-state">
          <p>No journal entries yet. Start writing to begin your journey!</p>
        </div>
      )}
    </div>
  );
};

export default Journal;

