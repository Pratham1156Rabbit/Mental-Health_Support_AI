import React from 'react';
import { Link } from 'react-router-dom';
import './WikiLayout.css';

const Toc = ({ items }) => {
  if (!items?.length) return null;
  return (
    <nav className="wiki-toc" aria-label="Table of contents">
      <div className="wiki-toc-title">Contents</div>
      <ol className="wiki-toc-list">
        {items.map((it) => (
          <li key={it.href} className="wiki-toc-item">
            <a href={it.href} className="wiki-toc-link">{it.label}</a>
          </li>
        ))}
      </ol>
    </nav>
  );
};

const InfoBox = ({ title, rows }) => {
  if (!rows?.length) return null;
  return (
    <aside className="wiki-infobox" aria-label={`${title || 'Info'} box`}>
      {title ? <div className="wiki-infobox-title">{title}</div> : null}
      <dl className="wiki-infobox-dl">
        {rows.map((r) => (
          <div key={r.term} className="wiki-infobox-row">
            <dt className="wiki-infobox-term">{r.term}</dt>
            <dd className="wiki-infobox-def">{r.def}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
};

const Pager = ({ prev, next }) => {
  if (!prev && !next) return null;
  return (
    <nav className="wiki-pager" aria-label="Page navigation">
      <div className="wiki-pager-left">
        {prev ? (
          <Link to={prev.to} className="wiki-pager-link">
            <span className="wiki-pager-kicker">Back</span>
            <span className="wiki-pager-title">{prev.label}</span>
          </Link>
        ) : null}
      </div>
      <div className="wiki-pager-right">
        {next ? (
          <Link to={next.to} className="wiki-pager-link">
            <span className="wiki-pager-kicker">Next</span>
            <span className="wiki-pager-title">{next.label}</span>
          </Link>
        ) : null}
      </div>
    </nav>
  );
};

export default function WikiLayout({
  title,
  subtitle,
  tocItems,
  infoboxTitle,
  infoboxRows,
  prev,
  next,
  children,
  footerNote
}) {
  return (
    <div className="wiki-shell">
      <header className="wiki-header">
        <h1 className="wiki-title">{title}</h1>
        {subtitle ? <p className="wiki-subtitle">{subtitle}</p> : null}
      </header>

      <div className="wiki-grid">
        <div className="wiki-left">
          <Toc items={tocItems} />
        </div>

        <article className="wiki-article">
          {children}
          <Pager prev={prev} next={next} />
          {footerNote ? <div className="wiki-footnote">{footerNote}</div> : null}
        </article>

        <div className="wiki-right">
          <InfoBox title={infoboxTitle} rows={infoboxRows} />
        </div>
      </div>
    </div>
  );
}


