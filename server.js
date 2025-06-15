// server.js - Main server file
const express = require('express');
const puppeteer = require('puppeteer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Store active browser sessions
const activeSessions = new Map();

// Your pre-configured cookies
const PRIME_COOKIES = [
  {
    name: "at-main-av",
    value: process.env.VALUE_ONE,
    domain: ".primevideo.com",
    path: "/",
    httpOnly: true,
    secure: true,
  },
  {
    name: "av-profile",
    value: process.env.VALUE_TWO,
    domain: ".primevideo.com",
    path: "/",
    httpOnly: true,
    secure: true,
  },
  {
    name: "av-timezone",
    value: "Asia/Calcutta",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: false,
  },
  {
    name: "i18n-prefs",
    value: "USD",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: false,
  },
  {
    name: "lc-main-av",
    value: "en_US",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: false,
  },
  {
    name: "sess-at-main-av",
    value: process.env.VALUE_THREE,
    domain: ".primevideo.com",
    path: "/",
    httpOnly: true,
    secure: true,
  },
  {
    name: "session-id",
    value: "257-4713387-3310266",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: true,
  },
  {
    name: "session-id-time",
    value: "2082787201l",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: true,
  },
  {
    name: "session-token",
    value: process.env.SESSION_TOKEN,
    domain: ".primevideo.com",
    path: "/",
    httpOnly: true,
    secure: true,
  },
  {
    name: "ubid-main-av",
    value: "260-2825109-6401065",
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: true,
  },
  {
    name: "x-main-av",
    value: process.env.VALUE_FOUR,
    domain: ".primevideo.com",
    path: "/",
    httpOnly: false,
    secure: true,
  },
  {
    name: "csm-hit",
    value: process.env.VALUE_FIVE,
    domain: ".www.primevideo.com",
    path: "/",
    httpOnly: false,
    secure: false,
  },
  {
    name: "csm-hit",
    value: process.env.VALUE_SIX,
    domain: "www.primevideo.com",
    path: "/",
    httpOnly: false,
    secure: false,
  },
];

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve the main page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Prime Video Family Launcher</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            
            .container {
                text-align: center;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 40px;
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
                border: 1px solid rgba(255, 255, 255, 0.18);
                max-width: 500px;
                width: 90%;
            }
            
            h1 {
                font-size: 2.5rem;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .subtitle {
                font-size: 1.2rem;
                margin-bottom: 30px;
                opacity: 0.9;
            }
            
            .launch-btn {
                background: linear-gradient(45deg, #FF6B6B, #4ECDC4);
                border: none;
                padding: 15px 40px;
                font-size: 1.2rem;
                border-radius: 50px;
                color: white;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .launch-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            }
            
            .launch-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
                transform: none;
            }
            
            .status {
                margin-top: 20px;
                padding: 10px;
                border-radius: 10px;
                display: none;
            }
            
            .status.success {
                background: rgba(76, 175, 80, 0.3);
                border: 1px solid rgba(76, 175, 80, 0.5);
            }
            
            .status.error {
                background: rgba(244, 67, 54, 0.3);
                border: 1px solid rgba(244, 67, 54, 0.5);
            }
            
            .status.loading {
                background: rgba(255, 193, 7, 0.3);
                border: 1px solid rgba(255, 193, 7, 0.5);
            }
            
            .active-sessions {
                margin-top: 30px;
                text-align: left;
            }
            
            .session-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 10px;
                margin: 10px 0;
                border-radius: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .close-btn {
                background: #ff4757;
                border: none;
                color: white;
                padding: 5px 10px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .prime-logo {
                font-size: 3rem;
                margin-bottom: 20px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="prime-logo">🎬</div>
            <h1>Prime Video Launcher</h1>
            <p class="subtitle">Launch Prime Video with automatic login for the family!</p>
            
            <button class="launch-btn" onclick="launchPrime()">
                🚀 Launch Prime Video
            </button>
            
            <div class="status" id="status"></div>
            
            <div class="active-sessions" id="activeSessions" style="display: none;">
                <h3>Active Sessions:</h3>
                <div id="sessionsList"></div>
            </div>
        </div>

        <script>
            async function launchPrime() {
                const btn = document.querySelector('.launch-btn');
                const status = document.getElementById('status');
                
                btn.disabled = true;
                btn.textContent = '🔄 Launching...';
                
                showStatus('Launching Prime Video...', 'loading');
                
                try {
                    const response = await fetch('/launch-prime', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            userName: prompt('Enter your name (for session tracking):') || 'Family Member'
                        })
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showStatus('✅ Prime Video launched successfully! Check the new browser window.', 'success');
                        updateActiveSessions();
                    } else {
                        showStatus('❌ Error: ' + result.message, 'error');
                    }
                } catch (error) {
                    showStatus('❌ Failed to launch: ' + error.message, 'error');
                }
                
                btn.disabled = false;
                btn.textContent = '🚀 Launch Prime Video';
            }
            
            function showStatus(message, type) {
                const status = document.getElementById('status');
                status.textContent = message;
                status.className = 'status ' + type;
                status.style.display = 'block';
            }
            
            async function updateActiveSessions() {
                try {
                    const response = await fetch('/sessions');
                    const sessions = await response.json();
                    
                    const sessionsDiv = document.getElementById('activeSessions');
                    const sessionsList = document.getElementById('sessionsList');
                    
                    if (sessions.length > 0) {
                        sessionsDiv.style.display = 'block';
                        sessionsList.innerHTML = sessions.map(session => 
                            '<div class="session-item">' +
                            '<span>' + session.userName + ' - ' + new Date(session.startTime).toLocaleTimeString() + '</span>' +
                            '<button class="close-btn" onclick="closeSession(\\'' + session.id + '\\')">Close</button>' +
                            '</div>'
                        ).join('');
                    } else {
                        sessionsDiv.style.display = 'none';
                    }
                } catch (error) {
                    console.error('Failed to update sessions:', error);
                }
            }
            
            async function closeSession(sessionId) {
                try {
                    await fetch('/close-session/' + sessionId, { method: 'POST' });
                    updateActiveSessions();
                } catch (error) {
                    console.error('Failed to close session:', error);
                }
            }
            
            // Update sessions every 10 seconds
            setInterval(updateActiveSessions, 10000);
            updateActiveSessions();
        </script>
    </body>
    </html>
  `);
});

// Launch Prime Video endpoint
app.post('/launch-prime', async (req, res) => {
  try {
    const { userName = 'Family Member' } = req.body;
    const sessionId = uuidv4();
    
    console.log(`🚀 Launching Prime Video for: ${userName}`);
    
    // Launch browser with anti-detection measures
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: [
        '--autoplay-policy=no-user-gesture-required',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--start-maximized',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-sandbox',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-images', // Optional: faster loading
      ],
    });

    const page = await browser.newPage();
    
    // Enhanced anti-detection measures
    await page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Mock languages and plugins
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en'],
      });
      
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Set realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers to look more human
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Upgrade-Insecure-Requests': '1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    });

    console.log(`🍪 Setting cookies for ${userName}`);

    // Navigate to Prime Video first
    await page.goto('https://www.primevideo.com', { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    });
    
    // Set cookies
    await page.setCookie(...PRIME_COOKIES);
    
    console.log(`✅ Cookies set for ${userName}`);

    // Navigate again with cookies
    await page.goto('https://www.primevideo.com', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });

    // Store session info
    activeSessions.set(sessionId, {
      id: sessionId,
      userName,
      browser,
      startTime: new Date(),
    });

    // Handle browser close
    browser.on('disconnected', () => {
      console.log(`🔴 Browser closed for ${userName}`);
      activeSessions.delete(sessionId);
    });

    console.log(`✅ Prime Video launched for ${userName} (Session: ${sessionId})`);

    res.json({ 
      success: true, 
      message: `Prime Video launched successfully for ${userName}!`,
      sessionId 
    });

  } catch (error) {
    console.error('❌ Error launching Prime Video:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

// Get active sessions
app.get('/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values()).map(session => ({
    id: session.id,
    userName: session.userName,
    startTime: session.startTime
  }));
  res.json(sessions);
});

// Close a specific session
app.post('/close-session/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  const session = activeSessions.get(sessionId);
  
  if (session) {
    await session.browser.close();
    activeSessions.delete(sessionId);
    console.log(`🔴 Manually closed session: ${session.userName}`);
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false, message: 'Session not found' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    activeSessions: activeSessions.size,
    uptime: process.uptime()
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  
  // Close all active browser sessions
  for (const session of activeSessions.values()) {
    await session.browser.close();
  }
  
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`🚀 Prime Video Family Launcher is running on http://localhost:${PORT}`);
  console.log(`📱 Share this URL with your family: http://localhost:${PORT}`);
  console.log(`🍪 Cookies are pre-configured and ready to use!`);
});

// package.json content for reference
/*
{
  "name": "prime-video-family-launcher",
  "version": "1.0.0",
  "description": "Web-based Prime Video launcher for family use",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "puppeteer": "^21.0.0",
    "uuid": "^9.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
*/