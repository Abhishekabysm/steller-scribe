
import React from 'react';

interface IconProps {
    className?: string;
}

const MagicIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-3.538-3.538l-2.25-2.25a3 3 0 0 0-3.538 3.538l2.25 2.25a3 3 0 0 0 3.538 3.538l2.25-2.25z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.243 8l2.25-2.25a3 3 0 0 0-3.538-3.538l-2.25 2.25a3 3 0 0 0 3.538 3.538z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21.75l-3.75-3.75M17.25 12l-3.75-3.75M3 3l3.75 3.75m10.5 10.5l3.75 3.75" />
    </svg>
);

export default MagicIcon;
