import React from "react";

interface LogoTextProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LogoText: React.FC<LogoTextProps> = ({ 
  size = "md", 
  className = "" 
}) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-xl", 
    lg: "text-3xl"
  };

  return (
    <h1 
      className={`font-bold text-white ${sizeClasses[size]} ${className}`}
      style={{ fontFamily: 'Source Code Pro, monospace' }}
    >
      NextGen AI Platform
    </h1>
  );
}; 