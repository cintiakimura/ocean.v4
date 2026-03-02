import React from 'react';

export const Logo = ({ className = "h-8" }: { className?: string }) => {
  return (
    <svg 
      viewBox="0 0 400 160" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Stylized K/X Symbol */}
      <path 
        d="M100 40L60 80L100 120" 
        stroke="#10B981" 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M40 40L80 80L40 120" 
        stroke="#10B981" 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      <path 
        d="M80 80H120V40" 
        stroke="#10B981" 
        strokeWidth="24" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      
      {/* "kyn" text approximation */}
      <text 
        x="150" 
        y="110" 
        fill="#10B981" 
        style={{ font: 'bold 100px sans-serif' }}
      >
        kyn
      </text>
    </svg>
  );
};
