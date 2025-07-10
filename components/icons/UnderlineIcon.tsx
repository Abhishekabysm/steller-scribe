import React from 'react';

interface IconProps {
    className?: string;
}

const UnderlineIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        {/* U-shape */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v7a6 6 0 0012 0V4" />
        {/* Underline */}
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20h12" />
    </svg>
);

export default UnderlineIcon;
