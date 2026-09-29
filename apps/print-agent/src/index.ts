console.log('Local Print Agent initialized. Waiting for backend job assignment...');

const health = {
  status: 'online',
  service: 'print-agent',
  connectedPrinters: [],
  message: 'Agent is ready to receive print jobs.'
};

console.log(JSON.stringify(health, null, 2));
