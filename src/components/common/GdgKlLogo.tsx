import React from 'react';
import gdgklLogo from '../../assets/GDGKL-logo.png';
import gdgklText from '../../assets/GDGKL-text.png';

interface GdgKlLogoProps {
  className?: string;
  inverted?: boolean;
}

export const GdgKlLogo: React.FC<GdgKlLogoProps> = ({ className = "h-5", inverted = false }) => (
  <div className="flex items-center gap-2 justify-center py-0.5">
    <img src={gdgklLogo} alt="GDG Logo" className={`${className} w-auto object-contain shrink-0`} />
    <img src={gdgklText} alt="GDG Kuala Lumpur" className={`${className === "h-5" ? "h-4" : "h-5"} w-auto object-contain shrink-0 ${inverted ? 'invert hue-rotate-180' : ''}`} />
  </div>
);

export default GdgKlLogo;
