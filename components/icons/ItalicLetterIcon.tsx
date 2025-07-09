
import React from 'react';

interface IconProps {
    className?: string;
}

// A path-based 'I' icon
const ItalicLetterIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
    </svg>
);

export default ItalicLetterIcon;
