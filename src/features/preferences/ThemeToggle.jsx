import { useLayoutEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Moon, Sun } from 'lucide-react';
import { toggleTheme } from './preferencesSlice';

export function ThemeToggle() {
  const dispatch = useDispatch(); const theme = useSelector((s) => s.preferences.theme);
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#19211c' : '#faf9f6');
  }, [theme]);
  return <button className="theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'} onClick={() => dispatch(toggleTheme())}>{theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}</button>;
}
