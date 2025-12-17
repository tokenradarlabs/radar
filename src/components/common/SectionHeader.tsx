
import React from 'react';

interface SectionHeaderProps {
  badgeText: string;
  heading: string;
  description: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ badgeText, heading, description }) => {
  return (
    <div className="section-header">
      <span className="badge">{badgeText}</span>
      <h2>{heading}</h2>
      <p>{description}</p>
    </div>
  );
};

export default SectionHeader;
