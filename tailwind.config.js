
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Background colors
    'bg-blue-500',
    'bg-blue-400/10',
    'bg-blue-50',
    'bg-green-500',
    'bg-green-200',
    'bg-green-50',
    'bg-green-500/10',
    'bg-red-50',
    'bg-red-400/10',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-yellow-200',
    'bg-yellow-50',
    'bg-gray-50',
    'bg-gray-400/10',
    'bg-gray-400/20',
    'bg-stone-100',
    'bg-stone-200/10',
    'bg-cyan-50',
    'bg-cyan-400/10',
    'bg-purple-50',
    'bg-purple-400/10',
    'bg-pink-50',
    'bg-pink-400/10',
    
    // Text colors
    'text-blue-700',
    'text-blue-600',
    'text-blue-400',
    'text-green-800',
    'text-green-700',
    'text-green-400',
    'text-red-700',
    'text-red-400',
    'text-orange-400',
    'text-yellow-800',
    'text-yellow-700',
    'text-yellow-400',
    'text-gray-700',
    'text-gray-600',
    'text-gray-400',
    'text-stone-600',
    'text-stone-400',
    'text-cyan-700',
    'text-cyan-400',
    'text-cyan-200',
    'text-purple-700',
    'text-purple-400',
    'text-pink-700',
    'text-pink-400',
    'text-white',
    
    // Ring colors
    'ring-blue-600/20',
    'ring-blue-700/10',
    'ring-blue-400/30',
    'ring-green-600/20',
    'ring-green-700',
    'ring-red-400/20',
    'ring-red-600/20',
    'ring-red-600/10',
    'ring-orange-600/20',
    'ring-yellow-600/20',
    'ring-gray-600/20',
    'ring-gray-500/10',
    'ring-stone-800/10',
    'ring-cyan-700/10',
    'ring-purple-700/10',
    'ring-pink-700/10',

    // Fill colors
    'fill-blue-500',
    'fill-green-500',
    'fill-green-300',
    'fill-red-500',
    'fill-orange-500',
    'fill-yellow-500',
    'fill-gray-400'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
