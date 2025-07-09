import React from 'react';

interface IconProps {
    className?: string;
}

const StrikethroughIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M7.5 8.5A3.5 3.5 0 0 1 11 5h2a3.5 3.5 0 0 1 3.5 3.5M7.5 15.5A3.5 3.5 0 0 0 11 19h2a3.5 3.5 0 0 0 3.5-3.5" />
    </svg>
);

export default StrikethroughIcon;
