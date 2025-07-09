import React from 'react';

interface IconProps {
    className?: string;
}

const ViewIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.644l11.06-6.912a1.012 1.012 0 011.808 0l11.06 6.912a1.012 1.012 0 010 .644l-11.06 6.912a1.012 1.012 0 01-1.808 0l-11.06-6.912z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export default ViewIcon;