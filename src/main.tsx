import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {installShellLanguage} from './him/components/useShellLanguage';

// Set <html lang/dir> before the first paint so English users never see an RTL flash.
installShellLanguage();
createRoot(document.getElementById('root')!).render(<App />);
