import React from 'react';

interface HeadingIconProps {
    className?: string;
    level: 1 | 2 | 3;
}

const HeadingIcon: React.FC<HeadingIconProps> = ({ className, level }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className={className}>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <text x="12" y="15" textAnchor="middle" className="text-sm font-bold fill-current">
            H{level}
        </text>
    </svg>
);

export default HeadingIcon;
