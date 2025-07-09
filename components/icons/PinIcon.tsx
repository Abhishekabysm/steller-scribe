import React from 'react';
import { RiPushpinFill, RiPushpinLine } from 'react-icons/ri';

interface IconProps {
    className?: string;
    isFilled?: boolean;
}

const PinIcon: React.FC<IconProps> = ({ className, isFilled }) => {
    return isFilled ? (
        <RiPushpinFill className={className} />
    ) : (
        <RiPushpinLine className={className} />
    );
};

export default PinIcon;
