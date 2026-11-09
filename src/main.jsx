import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './Fekretak13';
import './styles.css';

function showErr(msg) {
  const d = document.createElement('pre');
  d.style.cssText = 'white-space:pre-wrap;padding:16px;direction:ltr;font-size:13px;color:#b91c1c;background:#fff';
  d.textContent = msg;
  document.body.prepend(d);
}

function rootIsEmpty() {
  const r = document.getElementById('root');
  return !r || r.children.length === 0 || (r.children.length === 1 && r.children[0].id === 'fk-boot');
}

window.addEventListener('error', (e) => { if (rootIsEmpty()) showErr('JS error: ' + e.message); });
window.addEventListener('unhandledrejection', (e) => { if (rootIsEmpty()) showErr('Promise error: ' + ((e.reason && e.reason.message) || e.reason)); });

class Boundary extends React.Component {
  constructor(props) { super(props); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  render() {
    if (this.state.err) {
      return <pre style={{ whiteSpace: 'pre-wrap', padding: 16, direction: 'ltr', fontSize: 13, color: '#b91c1c' }}>{'React error: ' + String((this.state.err && this.state.err.stack) || this.state.err)}</pre>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Boundary><App /></Boundary></React.StrictMode>
);
