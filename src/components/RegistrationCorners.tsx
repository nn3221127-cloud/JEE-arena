import React from 'react';

interface RegistrationCornersProps {
  className?: string;
  size?: number;
}

/**
 * Structural Motif: 4 Corner Registration Marks
 * Echoes OMR answer sheet registration alignment marks.
 */
export const RegistrationCorners: React.FC<RegistrationCornersProps> = ({
  className = '',
  size = 8
}) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`} aria-hidden="true">
      {/* Top Left */}
      <div className="absolute top-2 left-2 flex flex-col items-start opacity-70">
        <div className="w-2 h-[1.5px] bg-pencil-line"></div>
        <div className="w-[1.5px] h-2 bg-pencil-line"></div>
      </div>
      {/* Top Right */}
      <div className="absolute top-2 right-2 flex flex-col items-end opacity-70">
        <div className="w-2 h-[1.5px] bg-pencil-line"></div>
        <div className="w-[1.5px] h-2 bg-pencil-line"></div>
      </div>
      {/* Bottom Left */}
      <div className="absolute bottom-2 left-2 flex flex-col items-start opacity-70">
        <div className="w-[1.5px] h-2 bg-pencil-line"></div>
        <div className="w-2 h-[1.5px] bg-pencil-line"></div>
      </div>
      {/* Bottom Right */}
      <div className="absolute bottom-2 right-2 flex flex-col items-end opacity-70">
        <div className="w-[1.5px] h-2 bg-pencil-line"></div>
        <div className="w-2 h-[1.5px] bg-pencil-line"></div>
      </div>
    </div>
  );
};
