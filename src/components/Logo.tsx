import React from 'react';

export default function Logo({ className }: { className?: string }) {
  return (
    <svg 
      width="32" 
      height="32" 
      viewBox="0 0 32 32" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      <rect width="32" height="32" rx="10" fill="#242129" />
      <path d="M16 6L24.6603 11V21L16 26L7.33975 21V11L16 6Z" fill="#3D405B" />
      <path d="M16 11V21M11.5 13.5L20.5 18.5M20.5 13.5L11.5 18.5" stroke="#6B728E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="3" fill="#50577A" />
      <circle cx="16" cy="11" r="1.5" fill="#808CA3" />
      <circle cx="11.5" cy="13.5" r="1.5" fill="#808CA3" />
      <circle cx="20.5" cy="13.5" r="1.5" fill="#808CA3" />
      <circle cx="11.5" cy="18.5" r="1.5" fill="#808CA3" />
      <circle cx="20.5" cy="18.5" r="1.5" fill="#808CA3" />
      <circle cx="16" cy="21" r="1.5" fill="#808CA3" />
    </svg>
  );
}
