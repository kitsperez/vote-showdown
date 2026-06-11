import { Poll, Voter } from './types';

// Let's create beautiful colored backgrounds from the palate specs
export const bgColors = [
  'bg-[#ffded6]', 
  'bg-[#ffd9e0]', 
  'bg-[#ffd9e0]',
  'bg-[#9cf0ff]', 
  'bg-[#ffe170]', 
  'bg-[#00e3fd]', 
  'bg-[#ffb1c3]',
  'bg-amber-100',
  'bg-emerald-100'
];

export const mockVoters: Voter[] = [
  {
    id: '1',
    name: 'Johnny Drama',
    email: 'johnny@drama.com',
    avatarText: 'JD',
    avatarBgColor: 'bg-[#ffd9e0]',
    votedOptionText: 'Pineapple',
    timestamp: '2 secs ago',
  },
  {
    id: '2',
    name: 'Barbara Sushi',
    email: 'barb@sushi.com',
    avatarText: 'BS',
    avatarBgColor: 'bg-[#9cf0ff]',
    votedOptionText: 'Pepperoni',
    timestamp: '1 min ago',
  },
  {
    id: '3',
    name: 'Pasta Wizard',
    email: 'pasta.wiz@gmail.com',
    avatarText: 'PW',
    avatarBgColor: 'bg-[#ffe170]',
    votedOptionText: 'Anchovies',
    timestamp: '3 mins ago',
  },
  {
    id: '4',
    name: 'Lola Choice',
    email: 'lola@choice.org',
    avatarText: 'LC',
    avatarBgColor: 'bg-[#ffb1c3]',
    votedOptionText: 'Pineapple',
    timestamp: '5 mins ago',
  }
];

export const tickerVoters = [
  { name: 'ChaosQueen 🔥', email: 'chaos@queen.com' },
  { name: 'PixelPirate 🏴‍☠️', email: 'pixel@pirate.org' },
  { name: 'VibeChecker 💎', email: 'vibe@checker.net' },
  { name: 'GamerDad99 🕹️', email: 'gamer@dad.com' },
  { name: 'TechnoViking ⚡', email: 'techno@viking.com' },
  { name: 'MemeLord 🐸', email: 'meme@lord.io' },
  { name: 'GlitchBitch 💿', email: 'glitch@bitch.com' },
  { name: 'NeonNightmare 🌙', email: 'neon@nightmare.org' },
  { name: 'TurboTurtle 🐢', email: 'turbo@turtle.com' },
  { name: 'QuantumQuack 🦆', email: 'quantum@quack.net' }
];

export const defaultPolls: Poll[] = [
  {
    id: 'best_pizza',
    title: 'Best Pizza Topping?',
    description: 'Settle the debate once and for all... Sweet, savory, or salty?',
    status: 'active',
    allowMultiple: false,
    durationSeconds: 120,
    createdAt: new Date().toISOString(),
    options: [
      {
        id: '01',
        text: 'Pineapple',
        count: 142,
        colorClass: 'bg-[#ffe170]',
        badgeColorClass: 'bg-[#ffe170] text-[#1b1b1b]',
      },
      {
        id: '02',
        text: 'Pepperoni',
        count: 231,
        colorClass: 'bg-[#e4006c]',
        badgeColorClass: 'bg-[#e4006c] text-[#ffffff]',
      },
      {
        id: '03',
        text: 'Anchovies',
        count: 57,
        colorClass: 'bg-[#00e3fd]',
        badgeColorClass: 'bg-[#00e3fd] text-[#1b1b1b]',
      }
    ]
  },
  {
    id: 'utility_belt',
    title: 'WHICH UTILITY BELT ACCESSORY IS MOST "BOSS"?',
    description: 'Settle the ultimate superhero debate. Choose wisely or regret it.',
    status: 'active',
    allowMultiple: false,
    durationSeconds: 120,
    createdAt: new Date().toISOString(),
    options: [
      {
        id: '01',
        text: 'LASER TOASTER',
        count: 482,
        colorClass: 'bg-[#e4006c]',
        badgeColorClass: 'bg-[#ffd9e0] text-[#3f0019]',
      },
      {
        id: '02',
        text: 'POCKET CLOUD',
        count: 271,
        colorClass: 'bg-[#00e3fd]',
        badgeColorClass: 'bg-[#9cf0ff] text-[#001f24]',
      }
    ]
  },
  {
    id: 'taco_pizza',
    title: 'PIZZA TOPPED WITH TACOS',
    description: 'The final, ultimate vote of the century.',
    status: 'ended',
    allowMultiple: false,
    durationSeconds: 60,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    options: [
      {
        id: '01',
        text: 'PIZZA TACOS',
        count: 531,
        colorClass: 'bg-[#e4006c]',
        badgeColorClass: 'bg-[#ffd9e0] text-[#3f0019]',
      },
      {
        id: '02',
        text: 'SUSHI BURGER',
        count: 187,
        colorClass: 'bg-[#00e3fd]',
        badgeColorClass: 'bg-[#00e3fd] text-[#1b1b1b]',
      },
      {
        id: '03',
        text: 'PASTA WAFFLES',
        count: 62,
        colorClass: 'bg-[#ffe170]',
        badgeColorClass: 'bg-[#ffe170] text-[#1b1b1b]',
      }
    ]
  }
];
