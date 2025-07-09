
import React from 'react';

interface IconProps {
    className?: string;
}

const WandSparklesIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v.01a6 6 0 0 1-5.84-7.38l5.84-11.68 5.84 11.68z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25L12.75 6l3.75 1.5L12.75 9 12 12.75 11.25 9 7.5 7.5 11.25 6 12 2.25z" />
    </svg>
);

export default WandSparklesIcon;