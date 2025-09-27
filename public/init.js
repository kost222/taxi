// Initialize configuration immediately
setTimeout(() => {
  // Check if data is loaded
  if (window.data) {
    // Dispatch Redux action to mark config as loaded
    if (window.__REDUX_STORE__) {
      window.__REDUX_STORE__.dispatch({
        type: 'config/SET_CONFIG_SUCCESS'
      });
    }
  }
}, 100);