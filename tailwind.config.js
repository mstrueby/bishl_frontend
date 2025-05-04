
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    'bg-blue-500',
    'bg-green-500',
    'bg-green-200',
    'bg-green-50',
    'bg-red-50',
    'bg-red-400/10',
    'bg-orange-500',
    'bg-yellow-500',
    'bg-yellow-200',
    'bg-yellow-50',
    'bg-gray-50',
    'bg-gray-400/20',
    'text-red-400',
    'text-blue-700',
    'text-white',
    'text-green-800',
    'text-green-700',
    'text-red-700',
    'text-yellow-700',
    'text-gray-400',
    'text-gray-700',
    'ring-blue-600/20',
    'ring-green-600/20',
    'ring-red-400/20',
    'ring-red-600/20',
    'ring-red-600/10',
    'ring-orange-600/20',
    'ring-yellow-600/20',
    'ring-gray-600/20'
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
