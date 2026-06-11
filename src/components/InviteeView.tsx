import React, { useState, useEffect } from 'react';
import { Poll } from '../types';
import { Mail, Vote, Trophy, BookOpen, Clock, Heart, Sparkles, Smile, Star, Pizza, Hash, Check } from 'lucide-react';

interface InviteeViewProps {
  activePoll: Poll;
  onCastVote: (optionText: string, email: string) => void;
  timerSeconds: number;
}

export default function InviteeView({
  activePoll,
  onCastVote,
  timerSeconds,
}: InviteeViewProps) {
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [hasVoted, setHasVoted] = useState(false);
  const [voteCount, setVoteCount] = useState(0);
  const [currentTab, setCurrentTab] = useState<'vote' | 'leaderboard' | 'rules'>('vote');

  // Automatically reset voting status if the active poll changes
  useEffect(() => {
    setSelectedOptionText(null);
    setHasVoted(false);
  }, [activePoll.id]);

  const handleSelectOption = (text: string) => {
    if (hasVoted) return;
    setSelectedOptionText(text);

    // Minor vibrator/haptic simulator scale feedback
    const btn = document.getElementById(`btn-${text.replace(/\s+/g, '')}`);
    if (btn) {
      btn.style.transform = 'scale(0.95)';
      setTimeout(() => {
        btn.style.transform = '';
      }, 100);
    }
  };

  const handleVoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOptionText) {
      alert('⚠️ Select an option first to cast your electric showdown vote!');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      alert('⚠️ Enter a valid email address to authenticate. No sneaky business!');
      return;
    }

    onCastVote(selectedOptionText, email.trim());
    setHasVoted(true);
    setVoteCount(prev => prev + 1);
    alert(`🎉 Success! Your vote for "${selectedOptionText}" was recorded in real time.`);
  };

  // Helper icons selector based on option index or text
  const getIconForOption = (index: number, text: string) => {
    const textLower = text.toLowerCase();
    if (textLower.includes('pineapple') || textLower.includes('fruit')) {
      return <Pizza className="w-8 h-8 text-[#221b00]" />; // represented by Pizza
    }
    if (textLower.includes('pepperoni') || textLower.includes('star') || textLower.includes('toaster')) {
      return <Star className="w-8 h-8 text-white fill-white" />;
    }
    if (textLower.includes('anchovies') || textLower.includes('fish') || textLower.includes('sea')) {
      return <Sparkles className="w-8 h-8 text-[#00616d]" />;
    }
    // fallbacks based on index
    if (index === 0) return <Smile className="w-8 h-8 text-[#1b1b1b]" />;
    if (index === 1) return <Star className="w-8 h-8 text-[#1b1b1b] fill-[#1b1b1b]" />;
    return <Heart className="w-8 h-8 text-[#1b1b1b]" />;
  };

  // Highlight colors mapping
  const activeColorClasses = [
    'bg-[#ffe170] border-[#1b1b1b]',
    'bg-[#ffd9e0] border-[#b60055]',
    'bg-[#9cf0ff] border-[#006875]'
  ];

  return (
    <div className="w-full max-w-lg mx-auto bg-[#f9f9f9] text-[#1b1b1b] font-sans pb-32 pt-4 px-4 min-h-[calc(100vh-160px)] relative">
      
      {/* Animated Floating Countdown Timer */}
      <div className="fixed top-24 right-4 z-40">
        <div className="bg-[#1b1b1b] text-[#ffe170] border-[3px] border-[#1b1b1b] p-3 rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-[6px_6px_0px_0px_rgba(233,196,0,1)] rotate-6 animate-pulse">
          <span className="font-mono text-[9px] uppercase leading-none mb-1 text-zinc-300">Ends In</span>
          <span className="font-bold text-xl leading-none font-mono">
            {timerSeconds > 0 ? `${timerSeconds}s` : 'END'}
          </span>
        </div>
      </div>

      {/* Main interactive Tab Routing */}
      {currentTab === 'vote' && (
        <div className="space-y-8 text-left mt-4">
          <div className="relative">
            <h1 className="text-3xl md:text-4xl font-black text-center font-sans tracking-tight text-[#1b1b1b] px-4">
              {activePoll.title}
            </h1>
            {/* Comical sticker decoration */}
            <div className="absolute -top-12 right-2 bg-[#ffe170] border-[3px] border-[#1b1b1b] p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -rotate-12 animate-bounce flex items-center justify-center">
              <Pizza className="text-[#221b00] w-9 h-9" />
            </div>
          </div>

          <p className="text-center font-medium text-sm text-zinc-600 px-6 italic">
            "{activePoll.description}"
          </p>

          {/* Option list */}
          <div className="grid grid-cols-1 gap-5">
            {activePoll.options.map((option, index) => {
              const isSelected = selectedOptionText === option.text;
              const buttonTheme = isSelected
                ? activeColorClasses[index % activeColorClasses.length]
                : 'bg-white border-[#1b1b1b] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]';

              return (
                <button
                  key={option.id}
                  id={`btn-${option.text.replace(/\s+/g, '')}`}
                  disabled={hasVoted}
                  onClick={() => handleSelectOption(option.text)}
                  className={`group relative flex items-center gap-6 p-5 border-[3px] rounded-xl shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[4px] active:shadow-none text-left cursor-pointer ${buttonTheme}`}
                >
                  {/* Styled Icon Wrapper */}
                  <div className={`w-14 h-14 rounded-lg border-[3px] border-[#1b1b1b] flex items-center justify-center shrink-0 ${
                    index === 0 ? 'bg-[#c9a800]' : index === 1 ? 'bg-[#e4006c]' : 'bg-[#00e3fd]'
                  }`}>
                    {getIconForOption(index, option.text)}
                  </div>

                  <div className="flex-grow">
                    <span className="text-lg font-extrabold block mb-0.5 text-[#1b1b1b]">
                      {option.text}
                    </span>
                    <span className="font-mono text-xs text-[#5c3f45] uppercase tracking-wider">
                      {index === 0 ? 'Sweet & Controversial' : index === 1 ? 'The Crowd Pleaser' : 'Bold & Salty'}
                    </span>
                  </div>

                  {/* Voted check state */}
                  {isSelected && (
                    <div className="absolute right-4 w-9 h-9 rounded-full bg-[#e4006c] border-[2px] border-[#1b1b1b] flex items-center justify-center shadow-[1px_1px_0px_0px_#1b1b1b]">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Email input field and submit button */}
          <form onSubmit={handleVoteSubmit} className="mt-8">
            <div className="p-6 bg-white border-[3px] border-[#1b1b1b] rounded-2xl shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex flex-col gap-5">
              <label htmlFor="email-vote" className="font-mono text-xs tracking-wider font-bold text-[#1b1b1b] uppercase">
                📧 EMAIL TO VOTE
              </label>

              <div className="relative group">
                <input
                  id="email-vote"
                  type="email"
                  value={email}
                  disabled={hasVoted}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-14 px-4 bg-white border-[3px] border-[#1b1b1b] rounded-xl font-bold focus:outline-none focus:border-[#e4006c] focus:ring-0 transition-all"
                  required
                />
              </div>

              {hasVoted ? (
                <div className="bg-emerald-100 text-emerald-800 p-4 border-[2px] border-emerald-500 rounded-lg text-center font-bold">
                  ✓ Your vote is encrypted & cast successfully!
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-4 bg-[#e4006c] text-white border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-base font-black rounded-xl hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer uppercase tracking-wider"
                >
                  CAST MY SHOWDOWN VOTE! ⚡
                </button>
              )}

              <p className="font-mono text-[11px] text-zinc-500 italic text-center mt-1">
                * Note: Only one vote per device is permitted. Don't be a cheeky voter!
              </p>
            </div>
          </form>
        </div>
      )}

      {currentTab === 'leaderboard' && (
        <div className="space-y-6 text-left mt-6">
          <div className="p-6 bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            <h2 className="text-2xl font-black text-[#1b1b1b] mb-4 flex items-center gap-2">
              <Trophy className="w-7 h-7 text-[#ffe170] fill-[#ffe170]" />
              LIVE LEADERBOARD
            </h2>
            <p className="text-sm text-zinc-600 mb-6 font-medium">
              Real-time standing of the active contestants:
            </p>

            <div className="space-y-4">
              {activePoll.options.map((opt, i) => {
                const total = activePoll.options.reduce((acc, curr) => acc + curr.count, 0) || 1;
                const percentage = Math.round((opt.count / total) * 100);

                return (
                  <div key={opt.id}>
                    <div className="flex justify-between font-mono font-bold text-xs mb-1.5 uppercase">
                      <span>{opt.text}</span>
                      <span>{percentage}% ({opt.count} votes)</span>
                    </div>
                    <div className="h-6 w-full bg-zinc-200 border-[2px] border-[#1b1b1b] rounded-md overflow-hidden">
                      <div
                        className="h-full bg-[#00e3fd] border-r-[2px] border-[#1b1b1b] transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: i === 0 ? '#ffe170' : i === 1 ? '#e4006c' : '#00e3fd' }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {currentTab === 'rules' && (
        <div className="space-y-6 text-left mt-6">
          <div className="p-6 bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rounded-2xl">
            <h2 className="text-2xl font-black text-[#1b1b1b] mb-4 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-[#006875]" />
              SHOWDOWN RULES
            </h2>
            <ul className="space-y-4 text-sm font-medium text-zinc-700">
              <li className="flex gap-3">
                <span className="text-lg">🔥</span>
                <span><strong>Authenticity:</strong> You must log in via a valid, non-disposable email to authorize your single event vote.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-lg">🎯</span>
                <span><strong>No Clumping:</strong> If "Allow Multiple Choice" is disabled, you can only choose one option. Your last option selection overrides initial choices before submitting.</span>
              </li>
              <li className="flex gap-3">
                <span className="text-lg">⏱️</span>
                <span><strong>Live Countdown:</strong> Votes must be finalized before the circular timer at the top right ticks to 00:00!</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Persistent Mobile Bottom Navigation Bar styled exactly matching Image 2 / HTML 2 */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-20 px-4 bg-[#006875] border-t-[3px] border-[#1b1b1b] shadow-[0px_-6px_0px_0px_rgba(0,0,0,1)]">
        <button
          onClick={() => setCurrentTab('vote')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all text-[#1b1b1b] border-[3px] border-[#1b1b1b] rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${
            currentTab === 'vote' ? 'bg-[#ffe170]' : 'bg-[#00e3fd]'
          }`}
        >
          <Vote className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono font-bold">Vote</span>
        </button>

        <button
          onClick={() => setCurrentTab('leaderboard')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all ${
            currentTab === 'leaderboard'
              ? 'bg-[#ffe170] text-[#1b1b1b] border-[3px] border-[#1b1b1b] rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'text-white opacity-90'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono font-bold">Leaderboard</span>
        </button>

        <button
          onClick={() => setCurrentTab('rules')}
          className={`flex flex-col items-center gap-1 px-4 py-1.5 transition-all ${
            currentTab === 'rules'
              ? 'bg-[#ffe170] text-[#1b1b1b] border-[3px] border-[#1b1b1b] rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'text-white opacity-90'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] uppercase font-mono font-bold">Rules</span>
        </button>
      </nav>
    </div>
  );
}
