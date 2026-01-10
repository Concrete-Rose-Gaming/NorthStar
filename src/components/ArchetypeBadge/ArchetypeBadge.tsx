import React from 'react';
import { getArchetypeColor, getArchetypeDefinition } from '../../game/ArchetypeSystem';
import './ArchetypeBadge.css';

interface ArchetypeBadgeProps {
  archetype: string;
  size?: 'small' | 'medium' | 'large';
}

interface DualArchetypeBadgeProps {
  primary: string;
  secondary: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Single archetype badge component
 */
export const ArchetypeBadge: React.FC<ArchetypeBadgeProps> = ({ archetype, size = 'medium' }) => {
  const definition = getArchetypeDefinition(archetype);
  const color = getArchetypeColor(archetype);
  const displayName = definition?.displayName || archetype;

  return (
    <span 
      className={`archetype-badge archetype-badge-${size}`}
      style={{ backgroundColor: color }}
      title={definition?.description || archetype}
    >
      {displayName}
    </span>
  );
};

/**
 * Dual archetype badge for chefs with two archetypes
 */
export const DualArchetypeBadge: React.FC<DualArchetypeBadgeProps> = ({ 
  primary, 
  secondary, 
  size = 'medium' 
}) => {
  const primaryColor = getArchetypeColor(primary);
  const secondaryColor = getArchetypeColor(secondary);
  const primaryDef = getArchetypeDefinition(primary);
  const secondaryDef = getArchetypeDefinition(secondary);

  return (
    <div className={`dual-archetype-badge dual-archetype-badge-${size}`}>
      <ArchetypeBadge archetype={primary} size={size} />
      <span className="archetype-separator">+</span>
      <ArchetypeBadge archetype={secondary} size={size} />
    </div>
  );
};
