/**
 * Python Analytics Service Client
 * Enterprise Decision Intelligence Engine
 */

const ANALYTICS_BASE_URL = process.env.ANALYTICS_SERVICE_URL || 'http://127.0.0.1:5001';

async function callAnalytics(endpoint, body = null, method = 'POST') {
  const url = `${ANALYTICS_BASE_URL}${endpoint}`;
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    options.signal = controller.signal;

    const response = await fetch(url, options);
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Analytics Service HTTP ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Python Analytics Service request timed out after 10 seconds.');
    }
    console.error(`[Analytics Client Error] ${endpoint}:`, error.message);
    throw error;
  }
}

async function checkAnalyticsHealth() {
  try {
    const res = await callAnalytics('/health', null, 'GET');
    return { available: true, details: res };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

module.exports = {
  callAnalytics,
  checkAnalyticsHealth,
};
