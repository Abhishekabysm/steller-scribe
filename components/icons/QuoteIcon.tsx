import React from 'react';

interface IconProps {
    className?: string;
}

const QuoteIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M5 8v8l4-4-4-4z M19 8v8l-4-4 4-4z" />
    </svg>
);

export default QuoteIcon;
