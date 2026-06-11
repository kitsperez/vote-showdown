import React, { useState } from 'react';
import { Poll, PollOption } from '../types';
import { Trash2, PlusCircle, Volume2, Maximize, Settings as SettingsIcon, Radio, QrCode, ClipboardList, Info } from 'lucide-react';

interface PollCreatorViewProps {
  onLaunchPoll: (poll: Poll) => void;
  activePoll: Poll;
  onSelectTab: (tab: 'dashboard' | 'live_polls' | 'voters' | 'settings') => void;
  currentTab: string;
}

export default function PollCreatorView({
  onLaunchPoll,
  activePoll,
  onSelectTab,
  currentTab,
}: PollCreatorViewProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [options, setOptions] = useState<string[]>([
    'The Flashy Contender',
    'The Silent Mastermind',
    ''
  ]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      const newOpts = [...options];
      newOpts.splice(index, 1);
      setOptions(newOpts);
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const newOpts = [...options];
    newOpts[idx] = val;
    setOptions(newOpts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please make it loud! Enter a poll title.');
      return;
    }

    // Filter out blank options
    const filteredOpts = options.filter(o => o.trim() !== '');
    if (filteredOpts.length < 2) {
      alert('Please provide at least 2 voting options (e.g. 2-10).');
      return;
    }

    // Colors list
    const colors = ['bg-[#ffe170]', 'bg-[#e4006c]', 'bg-[#00e3fd]', 'bg-[#b60055]', 'bg-[#9cf0ff]'];

    const pollOptions: PollOption[] = filteredOpts.map((optText, index) => {
      const color = colors[index % colors.length];
      return {
        id: String(index + 1).padStart(2, '0'),
        text: optText,
        count: 0,
        colorClass: color,
        badgeColorClass: color.includes('#e4006c') || color.includes('#b60055') ? `${color} text-white` : `${color} text-[#1b1b1b]`
      };
    });

    const newPoll: Poll = {
      id: 'custom_' + Date.now(),
      title: title.trim(),
      description: description.trim() || 'A spectacular new vote has commenced!',
      allowMultiple,
      status: 'active',
      createdAt: new Date().toISOString(),
      durationSeconds: 120,
      options: pollOptions,
    };

    onLaunchPoll(newPoll);
    
    // reset form or give notification
    setTitle('');
    setDescription('');
    setOptions(['The Flashy Contender', 'The Silent Mastermind', '']);
    alert('🚨 Launch Poll 🚀 initiated successfully! Switching you to your Live Poll outcomes.');
    onSelectTab('live_polls');
  };

  return (
    <div className="flex-grow grid grid-cols-1 lg:grid-cols-12 gap-[16px] px-4 md:px-10 py-8">
      {/* Comical Form Section (8/12 cols) */}
      <div className="lg:col-span-8 space-y-8">
        <div className="bg-white border-[3px] border-[#1b1b1b] p-6 md:p-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden rounded-xl">
          {/* Decorative background circle */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffe170] opacity-20 rounded-full border-[3px] border-[#1b1b1b] -rotate-12 pointer-events-none"></div>

          <form onSubmit={handleSubmit} className="space-y-10 relative z-10 font-sans">
            {/* Poll Identity */}
            <div className="space-y-4 text-left">
              <label className="font-mono text-sm tracking-widest font-bold text-[#1b1b1b] block uppercase">
                POLL TITLE (MAKE IT LOUD!)
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., WHO IS THE ULTIMATE CHAMPION?"
                className="w-full bg-white border-[3px] border-[#1b1b1b] p-4 text-xl md:text-2xl font-bold text-[#1b1b1b] rounded-xl focus:outline-none focus:ring-0 focus:border-[#e4006c] transition-all focus:shadow-[6px_6px_0px_0px_#ffe170]"
              />
            </div>

            <div className="space-y-4 text-left">
              <label className="font-mono text-sm tracking-widest font-bold text-[#1b1b1b] block uppercase">
                DESCRIPTION (TELL 'EM WHY IT MATTERS)
              </label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Settle the debate once and for all..."
                rows={3}
                className="w-full bg-white border-[3px] border-[#1b1b1b] p-4 text-base font-medium text-[#1b1b1b] rounded-xl focus:outline-none focus:ring-0 focus:border-[#e4006c] transition-all focus:shadow-[6px_6px_0px_0px_#ffe170]"
              />
            </div>

            {/* Options Section */}
            <div className="space-y-6 text-left">
              <div className="flex justify-between items-center flex-wrap gap-2">
                <label className="font-mono text-sm tracking-widest font-bold text-[#1b1b1b] uppercase">
                  VOTING OPTIONS (2-10)
                </label>
                <span className="bg-[#00e3fd] text-[#1b1b1b] px-3 py-1 border-[2px] border-[#1b1b1b] font-mono text-[12px] font-bold rounded">
                  {options.filter(o => o.trim() !== '').length} OPTIONS ADDED
                </span>
              </div>

              <div className="space-y-4" id="options-container">
                {options.map((opt, optionIndex) => (
                  <div key={optionIndex} className="flex gap-4 group">
                    <div className="flex-1 bg-white border-[3px] border-[#1b1b1b] flex items-center p-2 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:translate-y-[-2px] transition-transform">
                      <span className="px-4 font-black text-[#006875] font-mono">
                        {String(optionIndex + 1).padStart(2, '0')}
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => handleOptionChange(optionIndex, e.target.value)}
                        placeholder={optionIndex >= 2 ? 'Add custom option...' : 'Settle with option...'}
                        className="flex-1 border-none focus:ring-0 text-base font-bold text-[#1b1b1b] outline-none"
                      />
                    </div>
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(optionIndex)}
                        className="bg-[#ba1a1a] text-white border-[3px] border-[#1b1b1b] p-3 rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-[#93000a] active:translate-y-[4px] active:shadow-none transition-all flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {options.length < 10 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="w-full py-4 border-[3px] border-dashed border-[#1b1b1b] hover:bg-zinc-100 font-bold text-base flex items-center justify-center gap-2 transition-colors cursor-pointer rounded-xl"
                >
                  <PlusCircle className="w-5 h-5 text-[#1b1b1b]" />
                  ADD ANOTHER OPTION
                </button>
              )}
            </div>

            {/* Multiple Choices Toggle */}
            <div className="flex items-center justify-between p-6 bg-[#ffd9e0] border-[3px] border-[#1b1b1b] rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="text-left">
                <p className="text-lg font-bold text-[#1b1b1b]">Allow Multiple Choices?</p>
                <p className="text-[12px] font-mono text-[#5c3f45] opacity-85 uppercase mt-1">
                  Let users pick more than one hero.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={e => setAllowMultiple(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-16 h-8 bg-white border-[3px] border-[#1b1b1b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:bg-[#006875] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-[#1b1b1b] after:border-[#1b1b1b] after:h-5 after:w-6 after:transition-all after:border-[2px] after:rounded-full"></div>
              </label>
            </div>

            {/* Form Actions */}
            <div className="pt-4 flex flex-col sm:flex-row gap-6">
              <button
                type="submit"
                className="flex-1 bg-[#00e3fd] text-[#001f24] py-5 border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-lg md:text-xl font-black rounded-xl uppercase tracking-widest hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
              >
                Launch Poll 🚀
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Draft saved locally! In a real system, this updates Firestore.');
                }}
                className="sm:w-1/3 bg-[#ffe170] text-[#1b1b1b] py-5 border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] text-base font-black rounded-xl uppercase hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer"
              >
                Save Draft
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* QR Preview Sidebar (4/12 cols) */}
      <div className="lg:col-span-4 space-y-8">
        <div className="bg-[#e4006c] text-white border-[3px] border-[#1b1b1b] p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center text-center sticky top-24 rounded-2xl">
          <div className="mb-6 p-4 bg-white border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-2 rounded-xl">
            <div className="w-48 h-48 bg-[#1b1b1b] p-2 flex items-center justify-center rounded">
              <img
                alt="Poll QR Code"
                className="w-full h-full grayscale invert"
                referrerPolicy="no-referrer"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuQ-Jwie4UU7gMYnVH0C0Ss5rRnjuMMedR6Lu97kpRK8H3z7eZusETlnSAIzksLVI5sCW3cerZ9euY3Nt7BeJXhIX4AOkdzdUv0VRA3LDBevsnXYGWNsqnN0hZG5ZeZT2711OXmfllTixzHQHTP2GjKF_xZciF1Kl7-EnB9alPK-bJJ1fA1sIqze0WDKiEQVQp_buo29gr7N10V9mVAAeuWGCPqERtx2yx7y3ZqEry4JnJLBO1WZ0_5cAdSYib2-lNwwPUajh6XGF"
              />
            </div>
          </div>
          <h3 className="font-bold text-xl md:text-2xl mb-2 font-sans tracking-tight uppercase">
            SCAN TO VOTE
          </h3>
          <p className="text-sm font-medium mb-8 text-zinc-100 font-sans max-w-xs">
            This QR code will be generated live as soon as you hit 'Launch'. Show it on the big screen!
          </p>
          <div className="w-full space-y-4">
            <div className="flex items-center justify-between px-4 py-2 bg-white border-[3px] border-[#1b1b1b] text-[#1b1b1b] rounded-lg">
              <span className="font-mono text-xs font-bold uppercase">LIVE PREVIEW</span>
              <div className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] animate-pulse"></div>
            </div>
            <div className="bg-zinc-800 h-40 w-full border-[3px] border-[#1b1b1b] rounded-xl flex flex-col items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-[#e4006c]/20 to-[#00e3fd]/20"></div>
              <Radio className="w-8 h-8 text-[#ffe170] mb-2 animate-bounce" />
              <span className="relative z-10 text-white font-sans text-xs font-bold tracking-widest uppercase opacity-80 group-hover:opacity-100 transition-opacity">
                SCREEN PREVIEW
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              alert('📦 Packaging assets (PNG stickers, SVGs, QR Code files) into a .zip. Starting download...');
            }}
            className="mt-8 w-full py-4 border-[3px] border-[#1b1b1b] bg-[#ffe170] text-[#1b1b1b] font-mono text-xs font-bold rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-[4px] active:shadow-none transition-all cursor-pointer uppercase"
          >
            DOWNLOAD ASSETS 📁
          </button>
        </div>

        {/* Pro Tips Box */}
        <div className="bg-[#9cf0ff] border-[3px] border-[#1b1b1b] p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-[#1b1b1b] rounded-xl">
          <h4 className="font-bold text-lg mb-4 flex items-center gap-2 font-sans">
            <Info className="w-5 h-5 text-[#006875]" />
            PRO TIPS
          </h4>
          <ul className="space-y-3 text-sm font-medium text-left font-sans">
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⚡</span> Keep titles under 50 characters for better readability.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⚡</span> Use at least 3 options to spark real debate.
            </li>
            <li className="flex gap-2">
              <span className="text-amber-500 font-bold">⚡</span> Add a description to give context to your voters.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
