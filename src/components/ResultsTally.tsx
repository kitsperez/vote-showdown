import { useEffect, useState } from 'react';
import { Poll, Voter } from '../types';
import { Trophy, ArrowLeft, RotateCcw, AlertTriangle, MessageSquare, Trash } from 'lucide-react';

interface ResultsTallyProps {
  activePoll: Poll;
  votersList: Voter[];
  onRestartPoll: () => void;
}

export default function ResultsTally({
  activePoll,
  votersList,
  onRestartPoll,
}: ResultsTallyProps) {
  const [confetti, setConfetti] = useState<{ id: number; left: string; top: string; delay: string; color: string }[]>([]);

  // Calculate winner
  const getWinner = () => {
    if (!activePoll.options || activePoll.options.length === 0) return 'NO ONE YET!';
    const sorted = [...activePoll.options].sort((a, b) => b.count - a.count);
    return sorted[0].text;
  };

  const totalVotesAcrossOptions = activePoll.options.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Simulate confetti generation
  useEffect(() => {
    const colors = ['#e4006c', '#00e3fd', '#ffe170', '#ffe170'];
    const list = Array.from({ length: 60 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 95}%`,
      top: `${Math.random() * 80}%`,
      delay: `${Math.random() * 3}s`,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
    setConfetti(list);
  }, [activePoll.id]);

  return (
    <div className="flex-grow p-4 md:p-[40px] bg-[#f9f9f9] relative">
      
      {/* Falling Confetti Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
        {confetti.map(c => (
          <div
            key={c.id}
            className="absolute w-4 h-4 rounded-full border-[1.5px] border-black opacity-80 animate-bounce"
            style={{
              left: c.left,
              top: c.top,
              backgroundColor: c.color,
              animationDelay: c.delay,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Winner Announcement Header */}
      <div className="text-center mb-12 relative z-20 font-sans">
        <div className="inline-block relative">
          <h1 className="text-4xl md:text-5xl font-black text-[#e4006c] uppercase italic tracking-tighter mb-4 transform -rotate-1">
            THE WINNER IS...🏆
          </h1>
          <div className="bg-[#ffe170] text-[#1b1b1b] border-[3px] border-[#1b1b1b] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transform rotate-1 rounded-2xl">
            <span className="text-3xl md:text-5xl font-black block uppercase font-sans">
              {getWinner()}
            </span>
          </div>
        </div>
      </div>

      {/* Bento Grid Results Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 text-left relative z-20">
        
        {/* Main Stats Tally Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white border-[3px] border-[#1b1b1b] p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden rounded-2xl">
          <div className="absolute top-4 right-4 text-[#e4006c] opacity-10 transform scale-150">
            <Trophy className="w-32 h-32" />
          </div>
          <h2 className="text-xl md:text-2xl font-black mb-8 relative z-10 uppercase tracking-tight">
            THE FINAL TALLY
          </h2>

          <div className="space-y-8 relative z-10">
            {activePoll.options.map((opt, index) => {
              const percentage = Math.round((opt.count / totalVotesAcrossOptions) * 100);

              return (
                <div key={opt.id}>
                  <div className="flex justify-between font-mono text-xs font-bold mb-2 uppercase">
                    <span>{opt.text}</span>
                    <span>{percentage}% ({opt.count} votes)</span>
                  </div>
                  <div className="h-10 w-full bg-zinc-100 border-[3px] border-[#1b1b1b] rounded-lg overflow-hidden">
                    <div
                      className="h-full border-r-[3px] border-[#1b1b1b] transition-all duration-700 ease-out"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: index === 0 ? '#e4006c' : index === 1 ? '#00e3fd' : '#ffe170',
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                        backgroundSize: '40px 40px'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Voter Feed Panel (4 cols) */}
        <div className="lg:col-span-4 bg-[#006875] text-white border-[3px] border-[#1b1b1b] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rounded-2xl flex flex-col">
          <h3 className="text-lg md:text-xl font-bold mb-6 uppercase flex items-center gap-2">
            🧑🏽‍🤝‍🧑🏼 The Voters
          </h3>

          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {votersList.map(voter => (
              <div
                key={voter.id}
                className="bg-white text-[#1b1b1b] p-3.5 border-[2px] border-[#1b1b1b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3.5 rounded-xl"
              >
                <div className={`w-10 h-10 ${voter.avatarBgColor} border-[2px] border-[#1b1b1b] rounded-full flex items-center justify-center font-bold font-mono`}>
                  {voter.avatarText}
                </div>
                <div className="text-left font-sans">
                  <p className="font-extrabold text-sm text-[#1b1b1b] leading-tight">{voter.name}</p>
                  <p className="text-[11px] font-mono text-zinc-500 uppercase mt-0.5">Voted: {voter.votedOptionText}</p>
                </div>
              </div>
            ))}

            {votersList.length === 0 && (
              <div className="bg-zinc-800 text-zinc-300 p-4 border-[2px] border-[#1b1b1b] text-center rounded-xl">
                No voters found. Simulated or join votes will show up here!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row justify-center gap-6 mb-12 relative z-20">
        <button
          onClick={onRestartPoll}
          className="bg-[#00e3fd] text-[#001f24] border-[3px] border-[#1b1b1b] px-10 py-5 text-xl font-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all uppercase flex items-center justify-center gap-3 cursor-pointer rounded-xl"
        >
          <RotateCcw className="w-6 h-6 text-zinc-800" />
          New Round / Restart
        </button>
      </div>

      {/* Atmospheric Hall of Fame Trophy Card at bottom */}
      <div className="bg-zinc-200 border-[3px] border-[#1b1b1b] p-6 flex flex-col sm:flex-row items-center gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl mx-auto rounded-xl relative z-20">
        <div className="w-24 h-24 shrink-0 border-[3px] border-[#1b1b1b] bg-[#ffe170] flex items-center justify-center rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
          <img
            alt="Winner Gold Trophy"
            className="w-full h-full object-contain p-2"
            referrerPolicy="no-referrer"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuA2eINHzROGNRQLqqfwUNAwXmQwKy5ZVnKkiKEQRMrWzvz_N-Ce5oCPSitO2fPiwp5oVU-QRXRQWe1c8eiUY2XoDQn6KEpThnjPVMOddvFj3HbUl7mwOER1oDbWftnlIvwyLLeu9NTO5L6TcLqvZDA_6RrKzBXiIzmRMXa0PxChqnzi8kmv5CCuaKJ2wKFY_t-oOln_Bmwq-KsvY_vh-ARZu4vjDNNBsFc8KBlNcjXiSQjAoG4efxpHVG8CL1JD7WgqIRDhxmCRqPgr"
          />
        </div>
        <div className="text-left font-sans">
          <h4 className="font-extrabold text-[#1b1b1b] text-lg uppercase">Hall of Fame material!</h4>
          <p className="text-zinc-600 text-sm mt-1 leading-relaxed font-medium">
            That was the most intense showdown of the week. {getWinner()} dominates the leaderboard once again. Who's ready for the next level of voting chaos?
          </p>
        </div>
      </div>
    </div>
  );
}
