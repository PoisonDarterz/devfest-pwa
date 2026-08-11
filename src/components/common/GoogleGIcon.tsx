import React from 'react';
import gLogo from '../../assets/g-logo.png';

interface GoogleGIconProps {
  className?: string;
}

export const GoogleGIcon: React.FC<GoogleGIconProps> = ({ className = "w-6 h-6" }) => (
  <img
    src={gLogo}
    alt="Google Logo"
    className={`${className} object-contain shrink-0`}
  />
);

export default GoogleGIcon;
