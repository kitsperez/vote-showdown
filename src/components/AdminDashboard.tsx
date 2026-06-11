import { useState, useEffect } from 'react';
import { Poll } from '../types';
import { Volume2, Maximize, Play, Square, Settings as SettingsIcon, AlertCircle, Group, TrendingUp, HelpCircle, Activity, Heart, Star, Sparkles, Plus, Clock, Users, AlertOctagon } from 'lucide-react';

interface AdminDashboardProps {
  activePoll: Poll;
  onClosePoll: () => void;
  onAddSeconds: (seconds: number) => void;
  timerSeconds: number;
  totalVotersCount: number;
  votingVelocity: string; // e.g. "12.4ms"
  engagementRate: number; // e.g. 89%
  recentVotesTickerText: string[];
}

export default function AdminDashboard({
  activePoll,
  onClosePoll,
  onAddSeconds,
  timerSeconds,
  totalVotersCount,
  votingVelocity,
  engagementRate,
  recentVotesTickerText,
}: AdminDashboardProps) {
  // Format seconds to MM:SS
  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-grow p-4 md:p-[40px] flex flex-col gap-12 max-w-[1600px] mx-auto pb-32">
      {/* Hero Section: QR & Timer & Current Showdown */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Giant QR Code Panel */}
        <div className="lg:col-span-5 bg-white border-[3px] border-[#1b1b1b] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex flex-col items-center justify-center text-center gap-6 rounded-2xl">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans text-[#1b1b1b]">
            Join the Chaos!
          </h2>
          <div className="bg-white p-6 border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full max-w-[340px] aspect-square flex items-center justify-center relative group rounded-xl">
            <img
              alt="QR Code for Voting"
              className="w-full h-auto group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX99-PfL0UXsiygrAJqk6lIZx90obEvKHX7wWhDYP5BVZHPkMSmvph1L9KNucMINHyQooWYPjtAeG__9hCcmtjSz9ycH2bsojaVEW9P6JrP4rmiwfrNghbJg1CyKRlzWS36SBg2xIj8Uyt_sbXTVEabNu2qw84wemxiVv0wjjlvub1rkUpjIGgVg0zhUCugCYGWY_ni2eCxsqxeZ9hj-qs4oWwizyxLt_2y54qYAQ6uHJ9BCB9B0Fojr0VxrdX6juY2HGJQpebO9Uk"
            />
            <div className="absolute -top-4 -right-4 bg-[#e4006c] text-white font-mono text-xs font-bold px-4 py-2 border-[3px] border-[#1b1b1b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] rotate-12 rounded-lg">
              SCAN ME
            </div>
          </div>
          <p className="text-base md:text-lg font-sans font-medium text-[#1b1b1b]">
            Go to <span className="font-bold underline">VOTE.SHOWDOWN</span> or scan the code!
          </p>
        </div>

        {/* Timer & Current Showdown Question */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          
          {/* Large Countdown Yellow Box */}
          <div className="bg-[#ffe170] border-[3px] border-[#1b1b1b] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8 md:p-10 flex flex-col items-center justify-center relative overflow-hidden rounded-2xl">
            {/* Halftone dots style overlay */}
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none">
              <div className="w-full h-full bg-[radial-gradient(#000_10%,transparent_10%)] bg-[size:16px_16px]"></div>
            </div>

            <span className="font-mono text-xs font-bold text-zinc-800 mb-2 uppercase tracking-widest">
              Time Remaining
            </span>

            <div className="text-7xl md:text-8xl font-black leading-none tracking-tighter text-[#1b1b1b] font-mono select-none">
              {formatTime(timerSeconds)}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 z-10">
              <button
                onClick={() => onAddSeconds(30)}
                className="bg-[#e4006c] text-white px-6 py-3 border-[3px] border-[#1b1b1b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-sm font-bold uppercase hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-lg"
              >
                +30 SECS
              </button>
              <button
                onClick={onClosePoll}
                className="bg-[#1b1b1b] text-white px-6 py-3 border-[3px] border-[#1b1b1b] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] font-mono text-sm font-bold uppercase hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer rounded-lg"
              >
                STOP POLL ⏹
              </button>
            </div>
          </div>

          {/* Current Question Cyan Box */}
          <div className="bg-[#00e3fd] border-[3px] border-[#1b1b1b] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 flex-grow flex flex-col justify-center text-left rounded-2xl">
            <span className="font-mono text-xs font-bold text-[#00616d] mb-2 uppercase tracking-wide">
              Current Showdown
            </span>
            <h1 className="text-2xl md:text-4xl font-black text-[#00616d] leading-tight font-sans">
              {activePoll.title}
            </h1>
          </div>
        </div>
      </section>

      {/* Dynamic Results: Chunky Bar Charts */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {activePoll.options.map((option, idx) => {
          const totalVotes = activePoll.options.reduce((acc, curr) => acc + curr.count, 0) || 1;
          const percentage = Math.round((option.count / totalVotes) * 100);
          
          return (
            <div key={option.id} className="bg-white border-[3px] border-[#1b1b1b] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-6 rounded-2xl font-sans relative overflow-hidden">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className={`text-xl font-black uppercase ${idx === 0 ? 'text-[#e4006c]' : 'text-[#006875]'}`}>
                    {option.text}
                  </h3>
                  <p className="text-zinc-600 font-mono text-xs font-bold uppercase mt-1">
                    {option.count} Votes
                  </p>
                </div>
                <span className="text-4xl md:text-5xl font-black font-sans text-stone-800">
                  {percentage}%
                </span>
              </div>

              {/* Styled animated progress bar wrapper with dynamic hard offset stripes */}
              <div className="w-full h-16 bg-zinc-100 border-[3px] border-[#1b1b1b] relative overflow-hidden rounded-xl shadow-inner">
                <div
                  className="h-full transition-all duration-700 ease-out flex items-center justify-end pr-4 text-white font-mono font-black"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: idx === 0 ? '#e4006c' : idx === 1 ? '#00e3fd' : '#ffe170',
                    backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)',
                    backgroundSize: '40px 40px'
                  }}
                >
                </div>
              </div>

              <div className="mt-4 flex justify-between font-mono text-xs font-bold uppercase opacity-80">
                <span>{idx === 0 ? 'TRENDING UP' : 'HOLDING STEADY'}</span>
                <span className="flex items-center gap-1 font-bold text-[#e4006c]">
                  <TrendingUp className="w-4 h-4" />
                  LIVE RATIO
                </span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Bento Grid: Secondary Metrics */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="bg-[#705d00] border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col items-center justify-center text-white rounded-xl">
          <Users className="w-8 h-8 mb-2 text-[#ffe170]" />
          <div className="text-2xl md:text-4xl font-extrabold">{totalVotersCount}</div>
          <div className="font-mono text-[9px] font-bold tracking-widest mt-1">TOTAL VOTERS</div>
        </div>

        <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col items-center justify-center text-[#1b1b1b] rounded-xl">
          <Activity className="w-8 h-8 mb-2 text-[#e4006c]" />
          <div className="text-2xl md:text-4xl font-extrabold">{votingVelocity}</div>
          <div className="font-mono text-[9px] font-bold tracking-widest text-zinc-600 mt-1">VOTING VELOCITY</div>
        </div>

        <div className="bg-[#00e3fd] border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col items-center justify-center text-[#001f24] rounded-xl">
          <Clock className="w-8 h-8 mb-2 text-white" />
          <div className="text-2xl md:text-4xl font-extrabold">{engagementRate}%</div>
          <div className="font-mono text-[9px] font-bold tracking-widest mt-1">ENGAGEMENT</div>
        </div>

        <div className="bg-[#ffd9e0] border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5 flex flex-col items-center justify-center text-[#3f0019] rounded-xl">
          <Star className="w-8 h-8 mb-2 text-[#e4006c]" />
          <div className="text-xl md:text-3xl font-black">NEW</div>
          <div className="font-mono text-[9px] font-bold tracking-widest mt-1 text-zinc-700">STREAK RECORD</div>
        </div>
      </section>

      {/* Floating Control panel (Settings, Fullscreen, Volume) styled exactly matching image */}
      <aside className="hidden xl:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-4 z-40">
        <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-4 rounded-xl">
          <button
            type="button"
            onClick={() => alert('Accessing Showdown control options...')}
            className="w-12 h-12 bg-white hover:bg-[#e4006c] hover:text-white border-[2px] border-[#1b1b1b] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => alert('Entering fullscreen kiosk projector view...')}
            className="w-12 h-12 bg-white hover:bg-[#00e3fd] hover:text-[#001f24] border-[2px] border-[#1b1b1b] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <Maximize className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => alert('Muting gamified stadium sound effects.')}
            className="w-12 h-12 bg-white hover:bg-[#ffe170] hover:text-[#1b1b1b] border-[2px] border-[#1b1b1b] rounded-lg transition-colors flex items-center justify-center cursor-pointer"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>
      </aside>

      {/* Style blocks for striped candy-cane bars scroll animation */}
      <style>{`
        @keyframes scroll-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-scroll {
          animation: scroll-left 25s linear infinite;
          display: flex;
          width: max-content;
        }
      `}</style>

      {/* Ticker Tape Footer: Animated ticker that matches layout bottom banner */}
      <div className="fixed bottom-0 left-0 w-full bg-[#1b1b1b] text-white h-16 flex items-center overflow-hidden border-t-[4px] border-[#e4006c] z-50 shadow-[0px_-4px_0px_0px_#1b1b1b]">
        <div className="bg-[#e4006c] h-full flex items-center px-6 z-10 border-r-[4px] border-[#1b1b1b] font-mono text-xs font-bold uppercase tracking-wider text-nowrap">
          JUST ANSWERED 🚨
        </div>
        <div className="ticker-scroll flex gap-12 font-mono text-base uppercase tracking-widest items-center">
          {recentVotesTickerText.map((val, key) => (
            <span key={key} className="flex items-center gap-2 whitespace-nowrap">
              <span>{val}</span>
            </span>
          ))}
          {/* Repeat for seamless infinite scrolling */}
          {recentVotesTickerText.map((val, key) => (
            <span key={`dup-${key}`} className="flex items-center gap-2 whitespace-nowrap opacity-90">
              <span>{val}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
