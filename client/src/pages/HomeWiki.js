import React from 'react';
import { Link } from 'react-router-dom';
import WikiLayout from '../components/WikiLayout';

export default function HomeWiki() {
  return (
    <WikiLayout
      title="Mental Health"
      subtitle="A simple, easy-to-read guide — plus Rabbit chat support."
      tocItems={[
        { href: '#what-is', label: 'What mental health means' },
        { href: '#why-it-matters', label: 'Why it matters' },
        { href: '#when-to-get-help', label: 'When to get help' },
        { href: '#what-you-can-do', label: 'What you can do today' }
      ]}
      infoboxTitle="Quick facts"
      infoboxRows={[
        { term: 'Topic', def: 'Mental health and well-being' },
        { term: 'Includes', def: 'Emotions, thinking, relationships, coping' },
        { term: 'Help', def: 'Self-care, support, and professional care' },
        { term: 'Support', def: 'Rabbit chat + Resources in the app' }
      ]}
      prev={{ to: '/', label: 'Rabbit Chat Support' }}
      next={{ to: '/mental-health', label: 'Mental Health Info' }}
      footerNote={
        <>
          Content is inspired by the Wikipedia article on mental health:{" "}
          <a href="https://en.wikipedia.org/wiki/Mental_health" target="_blank" rel="noreferrer">
            Mental health (Wikipedia)
          </a>
          .
        </>
      }
    >
      <p className="wiki-lead">
        <strong>Mental health</strong> is about how you feel, how you think, and how you handle daily life.
        It can change over time — and support is available.
      </p>

      <div className="wiki-actions" aria-label="Primary actions">
        <Link className="wiki-btn primary" to="/">Chat with Rabbit</Link>
        <Link className="wiki-btn" to="/mental-health">Read the Info page</Link>
        <Link className="wiki-btn" to="/resources">Open Resources (sign-in)</Link>
      </div>

      <h2 id="what-is">What mental health means</h2>
      <p>
        Mental health includes your emotions, your ability to focus and make decisions, and how you cope with stress.
        It also includes how you connect with other people.
      </p>
      <div className="wiki-callout">
        <strong>Accessible tip:</strong> If you’re feeling overwhelmed, try a 30–60 second pause:
        breathe slowly, relax your shoulders, and name 3 things you can see.
      </div>

      <h2 id="why-it-matters">Why it matters</h2>
      <p>
        Good mental health helps you learn, work, maintain relationships, and recover from challenges.
        When mental health is struggling, life can feel harder — even simple tasks.
      </p>

      <h2 id="when-to-get-help">When to get help</h2>
      <p>
        Consider reaching out for help if feelings like anxiety, sadness, or stress last for weeks, worsen over time,
        or make it hard to function. You don’t have to wait until it’s “severe” to get support.
      </p>

      <h2 id="what-you-can-do">What you can do today</h2>
      <ul>
        <li>Talk to someone you trust (a friend, family member, teacher, coworker).</li>
        <li>Try a small routine: sleep, meals, movement, and short breaks.</li>
        <li>Write down what you’re feeling (1–3 sentences is enough).</li>
        <li>
          If you want a gentle starting point, open <span className="wiki-kbd">Rabbit Chat</span> and tell it what’s going on.
        </li>
      </ul>
    </WikiLayout>
  );
}


