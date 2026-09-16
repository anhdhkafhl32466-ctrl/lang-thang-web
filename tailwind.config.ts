import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        terracotta: {
          50: '#FDF7F3',
          100: '#FAEFE7',
          200: '#F4DDCF',
          300: '#EBBFA9',
          400: '#DC9679',
          500: '#C85A32', // Đất nung Bát Tràng
          600: '#B14B26',
          700: '#933B1D',
          800: '#79311A',
          900: '#491C0E',
        },
        gold: {
          300: '#F1D58B',
          400: '#E5BF5A',
          500: '#D4A344', // Dát vàng Kiêu Kỵ
          600: '#B8860B',
          700: '#8E6706',
        },
        bamboo: {
          50: '#F3F8F5',
          100: '#E4EFE8',
          500: '#2A5A3B', // Tre xanh Phú Vinh
          600: '#22482F',
          700: '#193623',
          800: '#122518',
        },
        dopaper: {
          50: '#FDFBF7', // Giấy dó thanh tao
          100: '#F9F5EC',
          200: '#F0E8D7',
          300: '#E4D6BE',
          400: '#D4C1A2',
        },
        lacquer: {
          800: '#2B1E16',
          900: '#1F1610', // Sơn mài gỗ trầm
          950: '#130C07',
        }
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'Be Vietnam Pro', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'warm': '0 10px 30px -5px rgba(200, 90, 50, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'elevated': '0 20px 40px -10px rgba(31, 22, 16, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
};
export default config;
