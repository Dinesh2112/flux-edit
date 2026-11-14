import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './src/App.jsx';

try {
  const html = ReactDOMServer.renderToString(React.createElement(App));
  console.log('Rendered successfully! Length:', html.length);
  console.log('Snippet:', html.slice(0, 500));
} catch (err) {
  console.error('CRASH DURING RENDER:', err);
}
