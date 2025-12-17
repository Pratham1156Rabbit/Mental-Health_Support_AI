import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import './MoodTracker.css';

const MOODS = [
  { emoji: '😊', label: 'Great', value: 5 },
  { emoji: '🙂', label: 'Good', value: 4 },
  { emoji: '😐', label: 'Okay', value: 3 },
  { emoji: '😔', label: 'Not Great', value: 2 },
  { emoji: '😢', label: 'Poor', value: 1 }
];

const MoodTracker = () => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [moodHistory, setMoodHistory] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchMoodHistory();
  }, []);

  const fetchMoodHistory = async () => {
    try {
      const response = await axios.get('/api/mood');
      setMoodHistory(response.data.entries || []);
    } catch (error) {
      console.error('Error fetching mood history:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMood) return;

    try {
      await axios.post('/api/mood', {
        mood: selectedMood.value,
        note: note.trim(),
        timestamp: new Date().toISOString()
      });

      setSubmitted(true);
      setNote('');
      setSelectedMood(null);
      fetchMoodHistory();

      setTimeout(() => setSubmitted(false), 3000);
    } catch (error) {
      console.error('Error saving mood:', error);
      alert('Failed to save mood entry. Please try again.');
    }
  };

  const getMoodEmoji = (value) => {
    return MOODS.find(m => m.value === value)?.emoji || '😐';
  };

  return (
    <div className="mood-tracker-container">
      <div className="mood-header">
        <h1>Mood Tracker</h1>
        <p>Track your emotional wellbeing over time</p>
      </div>

      <form onSubmit={handleSubmit} className="mood-form">
        <div className="mood-selection">
          <h3>How are you feeling right now?</h3>
          <div className="mood-options">
            {MOODS.map((mood) => (
              <button
                key={mood.value}
                type="button"
                className={`mood-option ${selectedMood?.value === mood.value ? 'selected' : ''}`}
                onClick={() => setSelectedMood(mood)}
              >
                <span className="mood-emoji">{mood.emoji}</span>
                <span className="mood-label">{mood.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mood-note">
          <label htmlFor="note">Optional note (what's affecting your mood?)</label>
          <textarea
            id="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Share what's on your mind..."
            rows="4"
          />
        </div>

        <button type="submit" className="submit-mood-button" disabled={!selectedMood}>
          Save Mood Entry
        </button>

        {submitted && (
          <div className="success-message">
            ✓ Mood entry saved successfully!
          </div>
        )}
      </form>

      {moodHistory.length > 0 && (
        <div className="mood-history">
          <h2>Your Mood History</h2>
          <div className="history-list">
            {moodHistory.slice().reverse().map((entry) => (
              <div key={entry.id} className="history-item">
                <div className="history-emoji">{getMoodEmoji(entry.mood)}</div>
                <div className="history-details">
                  <div className="history-date">
                    {format(new Date(entry.timestamp), 'MMM dd, yyyy • h:mm a')}
                  </div>
                  {entry.note && (
                    <div className="history-note">{entry.note}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodTracker;

