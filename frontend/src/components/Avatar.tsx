import React from 'react';

interface AvatarProps {
  name: string;
  color: string;
  size?: number;
}

const Avatar: React.FC<AvatarProps> = ({ name, color, size = 36 }) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
};

export default Avatar;
