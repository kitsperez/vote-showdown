import { useState, useEffect } from 'react';
import { Poll, Voter, UserRole, AdminSubTab } from './types';
import { defaultPolls, mockVoters, bgColors, tickerVoters } from './data';
import RoleSelector from './components/RoleSelector';
import PollCreatorView from './components/PollCreatorView';
import InviteeView from './components/InviteeView';
import AdminDashboard from './components/AdminDashboard';
import ResultsTally from './components/ResultsTally';
import { 
  Vote, 
  Trophy, 
  ClipboardList, 
  Settings as SettingsIcon, 
  ShieldAlert, 
  Sparkles, 
  Clock, 
  Tv, 
  QrCode, 
  Trash, 
  RotateCcw,
  Plus,
  Compass,
  LayoutDashboard,
  UserCheck
} from 'lucide-react';

export default function App() {
  // Main state
  const [currentRole, setCurrentRole] = useState<UserRole>('creator');
  const [adminTab, setAdminTab] = useState<AdminSubTab>('dashboard');
  const [polls, setPolls] = useState<Poll[]>(defaultPolls);
  const [activePollId, setActivePollId] = useState<string>('best_pizza');
  const [votersList, setVotersList] = useState<Voter[]>(mockVoters);
  const [timerSeconds, setTimerSeconds] = useState<number>(45); // default countdown 45s
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [recentVotesTickerText, setRecentVotesTickerText] = useState<string[]>([
    'ChaosQueen 🔥', 'PixelPirate 🏴‍☠️', 'VibeChecker 💎', 'GamerDad99 🕹️', 'TechnoViking ⚡'
  ]);
  
  // Voting metrics state
  const [votingVelocity, setVotingVelocity] = useState<string>('12.4ms');
  const [engagementRate, setEngagementRate] = useState<number>(89);

  const activePoll = polls.find(p => p.id === activePollId) || polls[0];

  // Auto-decrement countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (activePoll.status === 'active' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            // End the poll when time hits 0
            setPolls(currentPolls => 
              currentPolls.map(p => 
                p.id === activePollId ? { ...p, status: 'ended' } : p
              )
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activePoll.status, activePollId, timerSeconds]);

  // Handle live automated simulated vote ticks
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isSimulating && activePoll.status === 'active') {
      interval = setInterval(() => {
        // Pick a random voter
        const randomVoterMeta = tickerVoters[Math.floor(Math.random() * tickerVoters.length)];
        // Pick random option from active poll
        const randomOptionIdx = Math.floor(Math.random() * activePoll.options.length);
        const selectedOption = activePoll.options[randomOptionIdx];

        // Format voter name with a random style
        const newVoterName = `${randomVoterMeta.name.split(' ')[0]} ${['Sr', 'Pro', 'Wiz', 'Boss'][Math.floor(Math.random() * 4)]}`;

        const newVoterItem: Voter = {
          id: 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          name: newVoterName,
          email: `${newVoterName.toLowerCase().replace(/\s+/g, '')}@showdown.io`,
          avatarText: newVoterName.substring(0, 2).toUpperCase(),
          avatarBgColor: bgColors[Math.floor(Math.random() * bgColors.length)],
          votedOptionText: selectedOption.text,
          timestamp: 'just now'
        };

        // Increment count in state
        setPolls(currPolls => 
          currPolls.map(p => {
            if (p.id === activePollId) {
              const updatedOptions = p.options.map(opt => 
                opt.text === selectedOption.text ? { ...opt, count: opt.count + 1 } : opt
              );
              return { ...p, options: updatedOptions };
            }
            return p;
          })
        );

        // Add to voter list representing real-time bento
        setVotersList(prev => [newVoterItem, ...prev]);

        // Shift ticker text tags
        setRecentVotesTickerText(prev => {
          const fresh = [newVoterName, ...prev];
          if (fresh.length > 15) fresh.pop();
          return fresh;
        });

        // Modulate secondary metrics organically for live-action game show vibes
        setVotingVelocity(`${(Math.random() * 20 + 5).toFixed(1)}ms`);
        setEngagementRate(prev => Math.min(Math.max(prev + Math.floor((Math.random() - 0.5) * 4), 60), 99));

      }, 1800); // cast a vote every 1.8 seconds!
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSimulating, activePoll.status, activePoll.options, activePollId]);

  // Handle custom launched poll
  const handleLaunchPoll = (newPoll: Poll) => {
    // de-activate older positive pools
    setPolls(prev => 
      prev.map(p => p.status === 'active' ? { ...p, status: 'ended' } : p).concat(newPoll)
    );
    setActivePollId(newPoll.id);
    setTimerSeconds(newPoll.durationSeconds);
  };

  // Handle regular cast vote
  const handleCastVote = (optionText: string, email: string) => {
    const voterName = email.split('@')[0];
    const newVoter: Voter = {
      id: 'vote_' + Date.now(),
      name: voterName.charAt(0).toUpperCase() + voterName.slice(1),
      email: email,
      avatarText: voterName.substring(0, 2).toUpperCase(),
      avatarBgColor: 'bg-[#9cf0ff]',
      votedOptionText: optionText,
      timestamp: 'just now'
    };

    // Increment count
    setPolls(currPolls => 
      currPolls.map(p => {
        if (p.id === activePollId) {
          const updatedOptions = p.options.map(opt => 
            opt.text === optionText ? { ...opt, count: opt.count + 1 } : opt
          );
          return { ...p, options: updatedOptions };
        }
        return p;
      })
    );

    setVotersList(prev => [newVoter, ...prev]);
    
    setRecentVotesTickerText(prev => {
      const fresh = [newVoter.name + ' ⚡', ...prev];
      if (fresh.length > 15) fresh.pop();
      return fresh;
    });
  };

  // Stop/Close poll immediately
  const handleClosePoll = () => {
    setPolls(prev => 
      prev.map(p => p.id === activePollId ? { ...p, status: 'ended' } : p)
    );
    alert('🚨 Showdown ended immediately by Showrunner! Transferring view to results tally screen.');
    setAdminTab('live_polls'); // view results tally
  };

  // Restart active poll or start new round
  const handleRestartPoll = () => {
    setPolls(prev => 
      prev.map(p => {
        if (p.id === activePollId) {
          // reset option counts to 0 and make active
          const resetOpts = p.options.map(o => ({ ...o, count: 0 }));
          return { ...p, status: 'active', options: resetOpts };
        }
        return p;
      })
    );
    setTimerSeconds(90); // starts with 90s countdown
    alert('✨ Round reset! Starting another electrifying live-voting loop.');
  };

  // Add 30s to countdown timer
  const handleAddSeconds = (seconds: number) => {
    setTimerSeconds(prev => prev + seconds);
    alert(`⏲ Added +${seconds} seconds to the live countdown countdown!`);
  };

  return (
    <div className="min-h-screen bg-[#f3f3f3] text-[#1b1b1b] flex flex-col font-sans select-none">
      
      {/* Universal Floating Demo Hub Header */}
      <RoleSelector
        currentRole={currentRole}
        onChangeRole={role => {
          setCurrentRole(role);
          // Auto synchronize display tab mapping for comfort
          if (role === 'creator') {
            setAdminTab('dashboard');
          } else if (role === 'admin') {
            setAdminTab('dashboard');
          }
        }}
        isSimulating={isSimulating}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
      />

      {/* Main Container Wrapper */}
      <div className="flex flex-1 relative">
        
        {/* Left Side Navigation shown for Host control/Admin/Creator modes exactly matching mock image */}
        {(currentRole === 'creator' || currentRole === 'admin') && (
          <aside className="hidden md:flex h-screen w-64 flex-col p-6 gap-4 bg-white border-r-[3px] border-[#1b1b1b] shadow-[6px_0px_0px_0px_rgba(0,0,0,1)] sticky top-20 z-30 font-sans">
            <div className="text-left mb-8 px-2">
              <h1 className="font-sans text-2xl font-black text-[#e4006c] uppercase italic tracking-tighter">
                VOTE! SHOWDOWN
              </h1>
              <p className="font-mono text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                Host Control
              </p>
            </div>

            <nav className="flex flex-col gap-3 text-left">
              <button
                onClick={() => setAdminTab('dashboard')}
                className={`flex items-center gap-3 px-4 py-3 border-[3px] rounded-xl transition-all cursor-pointer font-bold ${
                  adminTab === 'dashboard'
                    ? 'bg-[#00e3fd] text-[#1b1b1b] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-zinc-700 hover:bg-zinc-100 border-transparent hover:translate-x-1'
                }`}
              >
                <Compass className="w-5 h-5 text-[#1b1b1b]" />
                <span className="font-mono text-xs uppercase font-bold">Dashboard</span>
              </button>

              <button
                onClick={() => setAdminTab('live_polls')}
                className={`flex items-center gap-3 px-4 py-3 border-[3px] rounded-xl transition-all cursor-pointer font-bold ${
                  adminTab === 'live_polls'
                    ? 'bg-[#00e3fd] text-[#1b1b1b] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-zinc-700 hover:bg-zinc-100 border-transparent hover:translate-x-1'
                }`}
              >
                <Trophy className="w-5 h-5 text-[#1b1b1b]" />
                <span className="font-mono text-xs uppercase font-bold">Live Polls</span>
              </button>

              <button
                onClick={() => setAdminTab('voters')}
                className={`flex items-center gap-3 px-4 py-3 border-[3px] rounded-xl transition-all cursor-pointer font-bold ${
                  adminTab === 'voters'
                    ? 'bg-[#00e3fd] text-[#1b1b1b] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-zinc-700 hover:bg-zinc-100 border-transparent hover:translate-x-1'
                }`}
              >
                <ClipboardList className="w-5 h-5 text-[#1b1b1b]" />
                <span className="font-mono text-xs uppercase font-bold">Voter List</span>
              </button>

              <button
                onClick={() => setAdminTab('settings')}
                className={`flex items-center gap-3 px-4 py-3 border-[3px] rounded-xl transition-all cursor-pointer font-bold ${
                  adminTab === 'settings'
                    ? 'bg-[#00e3fd] text-[#1b1b1b] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                    : 'text-zinc-700 hover:bg-zinc-100 border-transparent hover:translate-x-1'
                }`}
              >
                <SettingsIcon className="w-5 h-5 text-[#1b1b1b]" />
                <span className="font-mono text-xs uppercase font-bold">Settings</span>
              </button>
            </nav>

            <div className="mt-auto p-4 border-[3px] border-[#1b1b1b] bg-[#ffe170] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-xl text-left font-sans">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full border-[2px] border-[#1b1b1b] overflow-hidden bg-[#ffd9e0] shrink-0">
                  <img
                    alt="Admin Logo Avatar"
                    referrerPolicy="no-referrer"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVaqlCg_bsxeFA3qp4xiPxj-u0_BDnnv7nHfB_swrJkKhb5q64oOhvIxfh7p2yOB3wpyNR6hoH39bhknNh9BoAJdnQAp2f2-_C-BArGwWascJ7JGC2EV0NYWr1AJQkJQ-0pY9u8h2Ngj-aECpWviPyhoEhnTK61lYooccEuEoXkJx1HHRAcDZypn73BbBJn1dgV7mPjKm8zcKP2Lkx8XeZosJzuYfVER0Z1E2oZ_KJ77_Cmhw3a3PKg31y3FifmP2MUGEYHrg8vBqx"
                  />
                </div>
                <div>
                  <p className="font-mono text-[11px] font-bold leading-tight uppercase">Admin Avatar</p>
                  <p className="text-[9px] opacity-70 font-mono font-medium">Showrunner Mode</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRestartPoll}
                className="w-full bg-[#e4006c] text-white py-2 text-xs font-bold font-mono uppercase tracking-wider border-[2px] border-[#1b1b1b] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded"
              >
                Start New Round
              </button>
            </div>
          </aside>
        )}

        {/* Central view router wrapper */}
        <div className="flex-grow flex flex-col min-h-screen">
          
          {/* Top layout headers custom tailored */}
          {currentRole !== 'invitee' && (
            <header className="bg-white border-b-[3px] border-[#1b1b1b] p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
              <div>
                <h1 className="text-3xl md:text-5xl font-black font-sans uppercase italic tracking-tighter">
                  {currentRole === 'creator'
                    ? adminTab === 'dashboard'
                      ? 'Poll Creator'
                      : adminTab === 'live_polls'
                      ? 'Tally Board'
                      : adminTab === 'voters'
                      ? 'Voters Index'
                      : 'Showdown Config'
                    : 'Admin Control Hub'}
                </h1>
                <p className="text-sm font-mono font-bold text-[#006875] uppercase mt-1">
                  {currentRole === 'creator' ? 'BUILD SOMETHING ELECTRIFYING!' : 'MAXIMUM INTERACTIVE OVERSIGHT'}
                </p>
              </div>

              {/* Utility project-project and QR preview shortcut */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => alert('🔴 Broadcast live preview is connected successfully.')}
                  className="p-3 border-[3px] border-[#1b1b1b] bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-xl"
                >
                  <Tv className="w-5 h-5 text-[#1b1b1b]" />
                </button>
                <button
                  type="button"
                  onClick={() => alert(`Active QR Voting target: ais-dev-th5kedppztguwti44zfzcy-328137498910`)}
                  className="p-3 border-[3px] border-[#1b1b1b] bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none transition-all cursor-pointer rounded-xl"
                >
                  <QrCode className="w-5 h-5 text-[#1b1b1b]" />
                </button>
              </div>
            </header>
          )}

          {/* Central content canvas based on current state parameters */}
          {currentRole === 'creator' && (
            <>
              {adminTab === 'dashboard' && (
                <PollCreatorView
                  onLaunchPoll={handleLaunchPoll}
                  activePoll={activePoll}
                  onSelectTab={tab => setAdminTab(tab)}
                  currentTab={adminTab}
                />
              )}

              {adminTab === 'live_polls' && (
                <ResultsTally
                  activePoll={activePoll}
                  votersList={votersList}
                  onRestartPoll={handleRestartPoll}
                />
              )}

              {adminTab === 'voters' && (
                <div className="p-6 md:p-10 text-left">
                  <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 rounded-2xl max-w-4xl">
                    <h2 className="text-2xl font-black mb-2">VOTERS SECURITY MATRIX</h2>
                    <p className="text-zinc-500 font-medium text-sm mb-6">Verify and audit verified device emails for real-time showdowns:</p>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-[3px] border-[#1b1b1b] font-mono text-xs uppercase font-bold text-[#006875]">
                            <th className="py-3 px-4">AVATAR</th>
                            <th className="py-3 px-4">NAME</th>
                            <th className="py-3 px-4">EMAIL</th>
                            <th className="py-3 px-4">CHOICE</th>
                            <th className="py-3 px-4">STATUS</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm font-medium">
                          {votersList.map(v => (
                            <tr key={v.id}>
                              <td className="py-3 px-4">
                                <div className={`w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center font-bold text-xs uppercase ${v.avatarBgColor}`}>
                                  {v.avatarText}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold">{v.name}</td>
                              <td className="py-3 px-4 font-mono text-zinc-600">{v.email}</td>
                              <td className="py-3 px-4">
                                <span className="bg-[#ffe170] border-[2px] border-[#1b1b1b] px-3 py-1 rounded text-xs font-bold uppercase">
                                  {v.votedOptionText}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-xs font-bold text-emerald-600 font-mono">✓ CAST</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <button
                      onClick={() => {
                        setVotersList([]);
                        alert('All test logs and voters cleared.');
                      }}
                      className="mt-6 px-4 py-2 border-[2px] border-black bg-red-100 text-red-700 hover:bg-red-200 transition-colors rounded-lg font-mono text-xs font-bold"
                    >
                      Clear All Test Registers 🗑
                    </button>
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="p-6 md:p-10 text-left">
                  <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 rounded-2xl max-w-2xl font-sans">
                    <h2 className="text-2xl font-black mb-4">SHOWDOWN SYSTEM CONTROLS</h2>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-mono font-bold mb-2 uppercase">CHAMPIONSHIP TIMER RANGE</label>
                        <select
                          onChange={e => setTimerSeconds(Number(e.target.value))}
                          className="w-full bg-white border-[3px] border-[#1b1b1b] p-3 rounded-xl font-bold focus:outline-none"
                        >
                          <option value="45">45 Seconds (Match default)</option>
                          <option value="90">90 Seconds (Medium countdown)</option>
                          <option value="180">180 Seconds (Extended showdown)</option>
                        </select>
                      </div>

                      <div className="p-4 bg-yellow-50 border-[2px] border-yellow-400 text-yellow-800 text-xs font-medium rounded-lg">
                        ⚠️ Changing this configurations resets active polling timer variables dynamically. Maintain caution during running tournaments!
                      </div>

                      <button
                        onClick={() => {
                          setPolls(defaultPolls);
                          setActivePollId('best_pizza');
                          setTimerSeconds(45);
                          alert('System metrics reset to stadium factory defaults.');
                        }}
                        className="w-full py-4 bg-[#ffe170] text-black border-[3px] border-[#1b1b1b] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-bold rounded-xl uppercase transition-all"
                      >
                        Reset Factory Config 🔄
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {currentRole === 'admin' && (
            <>
              {adminTab === 'dashboard' && (
                <AdminDashboard
                  activePoll={activePoll}
                  onClosePoll={handleClosePoll}
                  onAddSeconds={handleAddSeconds}
                  timerSeconds={timerSeconds}
                  totalVotersCount={votersList.length}
                  votingVelocity={votingVelocity}
                  engagementRate={engagementRate}
                  recentVotesTickerText={recentVotesTickerText}
                />
              )}

              {adminTab === 'live_polls' && (
                <ResultsTally
                  activePoll={activePoll}
                  votersList={votersList}
                  onRestartPoll={handleRestartPoll}
                />
              )}

              {adminTab === 'voters' && (
                <div className="p-6 md:p-10 text-left">
                  <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 rounded-2xl max-w-4xl">
                    <h2 className="text-2xl font-black mb-2">VOTERS LOG</h2>
                    <p className="text-zinc-500 font-medium text-sm mb-6">Device authentication registers:</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b-[3px] border-[#1b1b1b] font-mono text-xs uppercase font-bold text-[#006875]">
                            <th className="py-3 px-4">AVATAR</th>
                            <th className="py-3 px-4">NAME</th>
                            <th className="py-3 px-4">EMAIL</th>
                            <th className="py-3 px-4">CHOICE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 text-sm font-medium">
                          {votersList.map(v => (
                            <tr key={v.id}>
                              <td className="py-3 px-4">
                                <div className={`w-8 h-8 rounded-full border-[2px] border-black flex items-center justify-center font-bold text-xs uppercase ${v.avatarBgColor}`}>
                                  {v.avatarText}
                                </div>
                              </td>
                              <td className="py-3 px-4 font-bold">{v.name}</td>
                              <td className="py-3 px-4 font-mono text-zinc-600">{v.email}</td>
                              <td className="py-3 px-4">
                                <span className="bg-[#ffe170] border-[2px] border-[#1b1b1b] px-3 py-1 rounded text-xs font-bold uppercase">
                                  {v.votedOptionText}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'settings' && (
                <div className="p-6 md:p-10 text-left">
                  <div className="bg-white border-[3px] border-[#1b1b1b] shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 rounded-2xl max-w-xl">
                    <h2 className="text-2xl font-black mb-4">ADMIN OPTIONS</h2>
                    <p className="text-zinc-500 text-sm font-medium mb-6">Manage global system options:</p>

                    <button
                      onClick={() => {
                        setVotersList(mockVoters);
                        setPolls(defaultPolls);
                        setTimerSeconds(45);
                        alert('System database reset!');
                      }}
                      className="w-full py-4 bg-[#ffe170] text-black border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] uppercase font-mono text-xs font-bold rounded-xl"
                    >
                      Reset App State 🔄
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {currentRole === 'invitee' && (
            <InviteeView
              activePoll={activePoll}
              onCastVote={handleCastVote}
              timerSeconds={timerSeconds}
            />
          )}

          {/* Regular standard footer layout for aesthetic spacing */}
          {currentRole !== 'invitee' && (
            <footer className="w-full py-8 px-6 md:px-[40px] bg-zinc-200 border-t-[3px] border-[#1b1b1b] flex flex-col md:flex-row justify-between items-center gap-4 mt-auto mb-20 md:mb-0">
              <p className="font-mono text-xs text-zinc-700 font-bold">
                © 2026 ELECTRIC PULSE VOTING
              </p>
              <div className="flex gap-8 font-mono text-xs">
                <a onClick={() => alert('Launching help instructions...')} className="text-zinc-600 hover:text-[#e4006c] cursor-pointer font-bold">Help</a>
                <a onClick={() => alert('Accessing privacy policy statements...')} className="text-zinc-600 hover:text-[#e4006c] cursor-pointer font-bold">Privacy</a>
                <a onClick={() => alert('Reviewing system thermal values...')} className="text-zinc-600 hover:text-[#e4006c] cursor-pointer font-bold">Terms</a>
              </div>
            </footer>
          )}

        </div>
      </div>

    </div>
  );
}
