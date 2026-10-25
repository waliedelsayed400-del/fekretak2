import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './Fekretak8';
import './styles.css';

function showErr(msg) {
  const d = document.createElement('pre');
  d.style.cssText = 'white-space:pre-wrap;padding:16px;direction:ltr;font-size:13px;color:#b91c1c;background:#fff';
  d.textContent = msg;
  document.body.prepend(d);
}
window.addEventListener('error', (e) => showErr('JS error: ' + e.message));
window.addEventListener('unhandledrejection', (e) => showErr('Promise error: ' + (e.reason?.message || e.reason)));

class Boundary extends React.Component {
  state = { err: null };
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) return <pre style={{ whiteSpace: 'pre-wrap', padding: 16, direction: 'ltr', fontSize: 13, color: '#b91c1c' }}>{'React error: ' + String(this.state.err?.stack || this.state.err)}</pre>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Boundary><BrowserRouter><App /></BrowserRouter></Boundary></React.StrictMode>
);
