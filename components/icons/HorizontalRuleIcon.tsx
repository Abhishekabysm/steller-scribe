import React from 'react';

interface IconProps {
    className?: string;
}

const HorizontalRuleIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
        <circle cx="4" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="20" cy="12" r="1" fill="currentColor" />
    </svg>
);

export default HorizontalRuleIcon;
