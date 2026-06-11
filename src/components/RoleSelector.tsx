import { UserRole } from '../types';
import { Shield, Sparkles, User, UserCheck } from 'lucide-react';

interface RoleSelectorProps {
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  isSimulating: boolean;
  onToggleSimulation: () => void;
}

export default function RoleSelector({
  currentRole,
  onChangeRole,
  isSimulating,
  onToggleSimulation,
}: RoleSelectorProps) {
  return (
    <div className="w-full bg-[#1b1b1b] text-white p-4 border-b-[3px] border-[#1b1b1b] flex flex-col md:flex-row items-center justify-between gap-4 z-[100] relative">
      <div className="flex items-center gap-2">
        <div className="bg-[#ffe170] text-[#1b1b1b] px-3 py-1 text-xs font-mono font-bold uppercase border-[2px] border-[#1b1b1b] rotate-[-2deg] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          ⚡ DEMO HUBS
        </div>
        <p className="text-white text-sm font-sans font-medium">
          Select standard dashboard viewport to interact:
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-center">
        {/* Admin button */}
        <button
          onClick={() => onChangeRole('admin')}
          className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[#1b1b1b] text-xs font-mono font-bold uppercase transition-all rounded-lg ${
            currentRole === 'admin'
              ? 'bg-[#00e3fd] text-[#1b1b1b] translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Shield className="w-4.5 h-4.5" />
          Admin View
        </button>

        {/* Poll Creators button */}
        <button
          onClick={() => onChangeRole('creator')}
          className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[#1b1b1b] text-xs font-mono font-bold uppercase transition-all rounded-lg ${
            currentRole === 'creator'
              ? 'bg-[#ffe170] text-[#1b1b1b] translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <Sparkles className="w-4.5 h-4.5" />
          Creator Canvas
        </button>

        {/* Invitee voter button */}
        <button
          onClick={() => onChangeRole('invitee')}
          className={`flex items-center gap-2 px-4 py-2 border-[2px] border-[#1b1b1b] text-xs font-mono font-bold uppercase transition-all rounded-lg ${
            currentRole === 'invitee'
              ? 'bg-[#e4006c] text-[#ffffff] translate-y-[-2px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
          }`}
        >
          <User className="w-4.5 h-4.5" />
          Invitee Screens
        </button>

        {/* Real-time simulation toggle */}
        <div className="h-6 w-[2px] bg-zinc-700 hidden sm:block md:mx-1"></div>

        <button
          onClick={onToggleSimulation}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase border-[2px] border-[#1b1b1b] rounded-lg cursor-pointer transition-all ${
            isSimulating
              ? 'bg-emerald-500 text-white animate-pulse shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
          }`}
        >
          {isSimulating ? '● Simulation Live' : '▶ Simulate Bot Votes'}
        </button>
      </div>
    </div>
  );
}
