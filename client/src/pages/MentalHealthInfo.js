import React from 'react';
import WikiLayout from '../components/WikiLayout';

export default function MentalHealthInfo() {
  return (
    <WikiLayout
      title="Mental health (easy guide)"
      subtitle="A practical overview: what it is, what can affect it, and how support works."
      tocItems={[
        { href: '#definition', label: 'Definition' },
        { href: '#common-signs', label: 'Common signs you may need support' },
        { href: '#risk-factors', label: 'Risk factors (what can affect mental health)' },
        { href: '#support', label: 'Support and treatment options' },
        { href: '#digital-age', label: 'Mental health in the digital age' },
        { href: '#stigma', label: 'Stigma and why it matters' }
      ]}
      infoboxTitle="At a glance"
      infoboxRows={[
        { term: 'Goal', def: 'Well-being, coping, and functioning' },
        { term: 'Impacts', def: 'Mood, sleep, energy, focus, relationships' },
        { term: 'Support', def: 'Self-care, community, therapy, medication (if needed)' },
        { term: 'Try now', def: 'Rabbit chat for guidance and next steps' }
      ]}
      prev={{ to: '/home', label: 'Wiki Home' }}
      next={{ to: '/', label: 'Rabbit Chat Support' }}
      footerNote={
        <>
          Inspired by the Wikipedia article:{" "}
          <a href="https://en.wikipedia.org/wiki/Mental_health" target="_blank" rel="noreferrer">
            Mental health (Wikipedia)
          </a>
          .
        </>
      }
    >
      <h2 id="definition">Definition</h2>
      <p>
        Mental health is your overall psychological well-being. It affects how you think, feel, and act, including how
        you handle stress, relate to others, and make choices.
      </p>

      <h2 id="common-signs">Common signs you may need support</h2>
      <p>People experience mental health challenges in different ways. Some common signs include:</p>
      <ul>
        <li>Feeling sad, anxious, numb, or irritable most days</li>
        <li>Sleep changes (too little, too much, or poor quality)</li>
        <li>Low energy, low motivation, or feeling “burned out”</li>
        <li>Difficulty focusing or making decisions</li>
        <li>Pulling away from friends or activities you usually enjoy</li>
        <li>Using alcohol/drugs more than usual to cope</li>
      </ul>
      <div className="wiki-callout">
        <strong>Important:</strong> If you feel in immediate danger or might harm yourself, seek urgent help from local
        emergency services or a trusted person right away.
      </div>

      <h2 id="risk-factors">Risk factors (what can affect mental health)</h2>
      <p>
        Many things can influence mental health. Often it’s not just one cause, but a mix of factors, such as:
      </p>
      <ul>
        <li><strong>Stress:</strong> school/work pressure, caregiving, major life changes</li>
        <li><strong>Social factors:</strong> loneliness, conflict, discrimination, lack of support</li>
        <li><strong>Health factors:</strong> chronic illness, pain, sleep problems</li>
        <li><strong>Economic factors:</strong> money worries, unemployment, housing instability</li>
        <li><strong>Biology:</strong> family history, brain chemistry, hormones</li>
      </ul>

      <h2 id="support">Support and treatment options</h2>
      <p>Support can be informal, professional, or both. Options include:</p>
      <ul>
        <li><strong>Self-care:</strong> sleep, movement, nutrition, time outdoors, structured routines</li>
        <li><strong>Talking support:</strong> friends, family, community groups, peer support</li>
        <li><strong>Therapy:</strong> learning coping tools and working through patterns</li>
        <li><strong>Medication:</strong> can help some people; best discussed with a clinician</li>
        <li><strong>Crisis support:</strong> immediate help when safety is a concern</li>
      </ul>
      <p>
        If you’re not sure where to start, Rabbit can help you name what you’re feeling and suggest a next step.
      </p>

      <h2 id="digital-age">Mental health in the digital age</h2>
      <p>
        Online tools can be helpful (education, connection, therapy access), but they can also add stress (doomscrolling,
        comparison, harassment, poor sleep). A small boundary helps: mute notifications, set a bedtime “phone-off” time,
        or take short breaks.
      </p>

      <h2 id="stigma">Stigma and why it matters</h2>
      <p>
        Stigma is when people are judged or treated unfairly because of mental health challenges. It can stop people from
        asking for help. Learning accurate information and talking openly (when safe) helps reduce stigma.
      </p>
    </WikiLayout>
  );
}


