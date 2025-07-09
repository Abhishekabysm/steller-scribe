import React from 'react';

interface IconProps {
    className?: string;
}

const DocumentPlusIcon: React.FC<IconProps> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m-4.5-6H12a2.25 2.25 0 0 1 2.25 2.25v.75m-12 6h12a2.25 2.25 0 0 0 2.25-2.25v-6.375c0-.621-.504-1.125-1.125-1.125H4.125a1.125 1.125 0 0 0-1.125 1.125v10.5A1.125 1.125 0 0 0 4.125 21Z" />
    </svg>
);
export default DocumentPlusIcon;
