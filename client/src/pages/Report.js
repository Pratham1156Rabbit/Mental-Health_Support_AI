import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import WikiLayout from '../components/WikiLayout';
import './Report.css';

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeNumber(n) {
  const x = Number(n);
  return Number.isFinite(x) ? x : 0;
}

function moodLabel(value) {
  const v = safeNumber(value);
  if (v >= 5) return 'Great';
  if (v === 4) return 'Good';
  if (v === 3) return 'Okay';
  if (v === 2) return 'Not Great';
  if (v === 1) return 'Poor';
  return 'Unknown';
}

function simpleChatInsights(allMessages) {
  const total = allMessages.length;
  const userCount = allMessages.filter(m => m.role === 'user').length;
  const assistantCount = allMessages.filter(m => m.role === 'assistant').length;

  const userText = allMessages
    .filter(m => m.role === 'user')
    .map(m => String(m.content || '').toLowerCase())
    .join(' ');

  const keywords = [
    { key: 'stress', label: 'Stress' },
    { key: 'anx', label: 'Anxiety' },
    { key: 'sad', label: 'Sadness' },
    { key: 'sleep', label: 'Sleep' },
    { key: 'panic', label: 'Panic' },
    { key: 'work', label: 'Work/School' },
    { key: 'family', label: 'Family' },
    { key: 'friend', label: 'Friends' },
    { key: 'relationship', label: 'Relationships' },
    { key: 'lonely', label: 'Loneliness' }
  ];

  const hits = keywords
    .map(k => ({
      label: k.label,
      hits: (userText.match(new RegExp(k.key, 'g')) || []).length
    }))
    .filter(x => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 5);

  return {
    totalMessages: total,
    userMessages: userCount,
    assistantMessages: assistantCount,
    topThemes: hits
  };
}

export default function Report() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [chatList, setChatList] = useState([]);
  const [allChatMessages, setAllChatMessages] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [chatsRes, moodRes, journalRes] = await Promise.all([
          axios.get('/api/chats'),
          axios.get('/api/mood'),
          axios.get('/api/journal')
        ]);

        const chats = chatsRes.data?.chats || [];
        const moods = moodRes.data?.entries || [];
        const journals = journalRes.data?.entries || [];

        // Load messages for each chat in parallel
        const messageResponses = await Promise.all(
          chats.map(c => axios.get(`/api/chat/${c.chatId}`).catch(() => ({ data: { messages: [] } })))
        );

        const messages = messageResponses.flatMap(r => r.data?.messages || []);

        if (!mounted) return;
        setChatList(chats);
        setAllChatMessages(messages);
        setMoodEntries(moods);
        setJournalEntries(journals);
      } catch (e) {
        if (!mounted) return;
        setError(e?.response?.data?.error || 'Failed to load your report. Please try again.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const moodStats = useMemo(() => {
    if (!moodEntries.length) return { count: 0, avg: null, min: null, max: null };
    const values = moodEntries.map(e => safeNumber(e.mood)).filter(v => v > 0);
    if (!values.length) return { count: moodEntries.length, avg: null, min: null, max: null };
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { count: moodEntries.length, avg, min, max };
  }, [moodEntries]);

  const chatInsights = useMemo(() => simpleChatInsights(allChatMessages), [allChatMessages]);

  const reportPayload = useMemo(() => {
    return {
      generatedAt: new Date().toISOString(),
      chats: chatList,
      chatMessages: allChatMessages,
      moodEntries,
      journalEntries,
      summary: {
        chatInsights,
        moodStats,
        journalCount: journalEntries.length
      }
    };
  }, [chatList, allChatMessages, moodEntries, journalEntries, chatInsights, moodStats]);

  const subtitle = loading
    ? 'Loading your report…'
    : 'Your complete history in one place: chats, mood tracker, and journal.';

  return (
    <WikiLayout
      title="My Report"
      subtitle={subtitle}
      tocItems={[
        { href: '#overview', label: 'Overview' },
        { href: '#chat', label: 'Chat analysis + history' },
        { href: '#mood', label: 'Mood tracker' },
        { href: '#journal', label: 'Journal' },
        { href: '#export', label: 'Export' }
      ]}
      infoboxTitle="Snapshot"
      infoboxRows={[
        { term: 'Chats', def: String(chatList.length) },
        { term: 'Messages', def: String(chatInsights.totalMessages) },
        { term: 'Mood entries', def: String(moodEntries.length) },
        { term: 'Journal entries', def: String(journalEntries.length) }
      ]}
      prev={{ to: '/', label: 'Rabbit Chat Support' }}
      next={{ to: '/', label: 'Home' }}
    >
      {error ? (
        <div className="wiki-callout" role="alert">
          <strong>Couldn’t load report:</strong> {error}
        </div>
      ) : null}

      <h2 id="overview">Overview</h2>
      <div className="report-grid">
        <div className="report-card">
          <div className="report-card-title">Chat analysis</div>
          <div className="report-metric">
            <div className="report-metric-label">Total messages</div>
            <div className="report-metric-value">{chatInsights.totalMessages}</div>
          </div>
          <div className="report-metric">
            <div className="report-metric-label">You / Rabbit</div>
            <div className="report-metric-value">{chatInsights.userMessages} / {chatInsights.assistantMessages}</div>
          </div>
          {chatInsights.topThemes?.length ? (
            <div className="report-small">
              <div className="report-small-title">Top themes (simple)</div>
              <ul className="report-list">
                {chatInsights.topThemes.map(t => (
                  <li key={t.label}>{t.label} ({t.hits})</li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="report-small">
              <div className="report-small-title">Top themes</div>
              <div className="report-muted">Not enough text yet to detect themes.</div>
            </div>
          )}
        </div>

        <div className="report-card">
          <div className="report-card-title">Mood tracker</div>
          <div className="report-metric">
            <div className="report-metric-label">Entries</div>
            <div className="report-metric-value">{moodStats.count}</div>
          </div>
          <div className="report-metric">
            <div className="report-metric-label">Average (1–5)</div>
            <div className="report-metric-value">
              {moodStats.avg == null ? '—' : moodStats.avg.toFixed(2)}
            </div>
          </div>
          <div className="report-metric">
            <div className="report-metric-label">Range</div>
            <div className="report-metric-value">
              {moodStats.min == null ? '—' : `${moodStats.min} (${moodLabel(moodStats.min)})`} — {moodStats.max == null ? '—' : `${moodStats.max} (${moodLabel(moodStats.max)})`}
            </div>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-title">Journal</div>
          <div className="report-metric">
            <div className="report-metric-label">Entries</div>
            <div className="report-metric-value">{journalEntries.length}</div>
          </div>
          <div className="report-small">
            <div className="report-small-title">Tip</div>
            <div className="report-muted">
              Journals can show patterns over time. Skim for repeated stressors, triggers, or helpful coping tools.
            </div>
          </div>
        </div>
      </div>

      <h2 id="chat">Chat analysis + history</h2>
      <p>
        This section summarizes your chats and provides your recent message history across all chats.
      </p>
      {loading ? (
        <div className="report-muted">Loading chats…</div>
      ) : (
        <>
          <div className="report-small-title">Chats</div>
          <div className="report-muted">{chatList.length ? `You have ${chatList.length} chat(s).` : 'No chats yet.'}</div>
          {allChatMessages.length ? (
            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Role</th>
                    <th>Chat</th>
                    <th>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {allChatMessages
                    .slice()
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                    .slice(-60)
                    .map((m) => (
                      <tr key={`${m.id}_${m.timestamp}`}>
                        <td className="report-when">{m.timestamp ? format(new Date(m.timestamp), 'MMM dd, yyyy h:mm a') : '—'}</td>
                        <td className="report-role">{m.role}</td>
                        <td className="report-chatid">{m.chatId}</td>
                        <td className="report-text">{String(m.content || '').slice(0, 220)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              <div className="report-muted">Showing the latest 60 messages across chats.</div>
            </div>
          ) : null}
        </>
      )}

      <h2 id="mood">Mood tracker</h2>
      {loading ? (
        <div className="report-muted">Loading mood history…</div>
      ) : moodEntries.length ? (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Mood</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {moodEntries
                .slice()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 30)
                .map((e) => (
                  <tr key={e.id}>
                    <td className="report-when">{e.timestamp ? format(new Date(e.timestamp), 'MMM dd, yyyy h:mm a') : '—'}</td>
                    <td className="report-role">{safeNumber(e.mood)} ({moodLabel(e.mood)})</td>
                    <td className="report-text">{e.note || '—'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="report-muted">Showing the latest 30 mood entries.</div>
        </div>
      ) : (
        <div className="report-muted">No mood entries yet.</div>
      )}

      <h2 id="journal">Journal</h2>
      {loading ? (
        <div className="report-muted">Loading journal…</div>
      ) : journalEntries.length ? (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Entry (preview)</th>
              </tr>
            </thead>
            <tbody>
              {journalEntries
                .slice()
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 20)
                .map((e) => (
                  <tr key={e.id}>
                    <td className="report-when">{e.timestamp ? format(new Date(e.timestamp), 'MMM dd, yyyy h:mm a') : '—'}</td>
                    <td className="report-text">{String(e.content || '').slice(0, 280)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <div className="report-muted">Showing the latest 20 journal entries.</div>
        </div>
      ) : (
        <div className="report-muted">No journal entries yet.</div>
      )}

      <h2 id="export">Export</h2>
      <p>
        Download everything (chats, mood, journal, and a small summary) as a single JSON file.
      </p>
      <div className="wiki-actions">
        <button
          type="button"
          className="wiki-btn primary"
          onClick={() => downloadJson(`mental-health-report_${new Date().toISOString().slice(0, 10)}.json`, reportPayload)}
          disabled={loading}
        >
          Download report (JSON)
        </button>
      </div>
    </WikiLayout>
  );
}


