import React from 'react';

const Header = () => {
  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .text-glow-purple {
          color: #e9d5ff;
          text-shadow:
            0 0 5px #c084fc,
            0 0 10px #c084fc,
            0 0 20px #a855f7,
            0 0 30px #a855f7;
        }
      `}</style>

      <header className="bg-black flex items-center p-4 overflow-hidden shadow-lg border-b border-purple-500/30">
        
        {/* Ikon Menu di Kiri */}
        <div className="flex-shrink-0">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            strokeWidth="1.5" 
            stroke="currentColor" 
            className="w-7 h-7 text-purple-400"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </div>

        {/* Kontainer untuk Teks Marquee */}
        <div className="flex-1 relative ml-4 h-7 overflow-hidden">
          <div className="absolute inset-0 flex items-center">
            <p className="animate-marquee whitespace-nowrap text-glow-purple text-lg font-bold">
              INFINITY AI by Bara Official &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp; INFINITY AI by Bara Official &nbsp;&nbsp;&nbsp; • &nbsp;&nbsp;&nbsp;
            </p>
          </div>
        </div>

      </header>
    </>
  );
};

export default Header;
