import React from 'react';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}

export default function UserAvatar({ name, avatarUrl, size = 40, className = '' }: UserAvatarProps) {
  const getInitials = (fullName: string): string => {
    const parts = fullName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const getColorFromName = (name: string): string => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-red-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-cyan-500',
      'bg-orange-500',
      'bg-teal-500'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  if (avatarUrl) {
    return (
      <div
        className={`flex-shrink-0 rounded-full overflow-hidden bg-gray-200 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            if (e.currentTarget.parentElement) {
              e.currentTarget.parentElement.innerHTML = `
                <div class="w-full h-full flex items-center justify-center ${getColorFromName(name)} text-white font-semibold text-sm">
                  ${getInitials(name)}
                </div>
              `;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex-shrink-0 rounded-full flex items-center justify-center text-white font-semibold ${getColorFromName(name)} ${className}`}
      style={{ 
        width: size, 
        height: size,
        fontSize: size * 0.4
      }}
    >
      {getInitials(name)}
    </div>
  );
}
