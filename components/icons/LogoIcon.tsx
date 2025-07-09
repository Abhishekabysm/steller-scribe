import React from 'react';

interface IconProps {
    className?: string;
}

const LogoIcon: React.FC<IconProps> = ({ className }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="1.5">
       <path d="M11 20L13 4L5 12H19L11 20Z" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

export default LogoIcon;
