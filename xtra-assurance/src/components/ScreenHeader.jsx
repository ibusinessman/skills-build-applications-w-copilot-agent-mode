import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ScreenHeader({ title, subtitle, back = false, action }) {
  const navigate = useNavigate();
  return (
    <div className="screen-header-flex">
      {back && (
        <button className="header-back" onClick={() => navigate(-1)} aria-label="Back">
          ←
        </button>
      )}
      <div className="header-titles">
        <h1 className="screen-title">{title}</h1>
        {subtitle && <p className="screen-subtitle">{subtitle}</p>}
      </div>
      {action && <div className="header-action">{action}</div>}
    </div>
  );
}
