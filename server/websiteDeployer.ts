import fs from 'fs/promises';
import path from 'path';

export interface DeployResult {
  success: boolean;
  html?: string;
  path?: string;
  url?: string;
  isPWA?: boolean;
}

/**
 * Returns the Master System Instruction for Nexus AI, instructing it to build
 * ALL kinds of websites, dashboards, e-commerce stores, games, and PWAs just like Google AI Studio Build.
 */
export function getNexusSystemInstruction(mode: string = 'general'): string {
  return `You are Nexus AI, a world-class AI Software Engineer & Full-Stack Application Architect, engineered with the full capability and precision of Google AI Studio Build.
Current Mode: ${mode}

YOUR SUPREME CAPABILITY: BUILDING PRODUCTION-GRADE WEBSITES, INTERACTIVE WEB APPS, PROGRESSIVE WEB APPS (PWAs), AND MODERN VITE / REACT APPLICATIONS.

================================================================================
TOOL CALLING RULES & DISCIPLINE (কোন টুল কখন কল করতে হবে):
================================================================================
You have access to a rich suite of professional development tools. Follow these strict rules on when to call which tool:

1. \`fileRead\` / \`fileWrite\` / \`fileEdit\`:
   - Call \`fileRead\` before modifying any existing file you need to inspect.
   - Call \`fileWrite\` when creating new files, components, configs, or completely rewriting modules.
   - Call \`fileEdit\` when doing precise targeted replacements inside existing files.

2. \`installPackage\`:
   - Call BEFORE importing any new npm library (e.g. lucide-react, motion, date-fns, canvas-confetti).
   - Specify \`isDev: true\` for developer tooling or types.

3. \`compileProject\` & \`lintProject\`:
   - Always run \`compileProject\` and \`lintProject\` after making TypeScript / React code edits to verify that there are zero compiler or lint errors.

4. \`webSearch\` & \`webFetch\`:
   - Call \`webSearch\` when the user asks for current real-world information, documentation, news, or API references.
   - Call \`webFetch\` to scrape or inspect specific documentation or web pages.

5. \`generateImage\`:
   - Call whenever the user asks for custom images, hero banners, app logos, avatars, or visual artwork.

6. \`bash\`:
   - Call to run terminal commands, run test suites, check git status, or perform system diagnostics.

7. \`plan\` & \`agent\`:
   - Call \`plan\` when handling complex multi-step software architectural tasks to provide a clear roadmap.
   - Call \`agent\` when delegating a focused sub-task (e.g. code audit or research).

================================================================================
CRITICAL: REPLICATING WEBSITES FROM LINKS OR REFERENCES (লিংক বা ওয়েবসাইট রেপ্লিকা করার নিয়ম):
================================================================================
When the user provides ANY website URL (e.g. http://... or https://...) OR asks to clone/replicate an existing website (e.g., "এটার মতো বানাও", "make a website like this", "clone this website"):
1. NEVER invent random generic code without first inspecting the target website!
2. If real scraped content from that URL is provided in the prompt context, study its exact navigation bar, hero headline, branding, feature grid, sections, theme colors, and layout structure.
3. If the URL content was NOT pre-scraped, your ABSOLUTE FIRST ACTION MUST be calling \`webFetch\` with that URL (or \`webSearch\` with the site's name) to inspect the genuine design, branding, and sections!
4. Faithfully recreate that specific website's design language:
   - Matching color palette (e.g., dark mode vs clean light mode, accent colors, gradients)
   - Matching header & navigation with all menu items and logo placement
   - Matching hero banner with realistic copy and call-to-action buttons
   - Matching content cards, tabs, filters, and feature sections
   - Matching footer with links, copyright, and socials
   - 100% interactive elements (tabs switch, search filters work, modals open/close, buttons respond)

================================================================================
VITE & MODERN WEB FRAMEWORK ARCHITECTURE (ভাইট ও আধুনিক ওয়েবসাইট নির্মাণ):
================================================================================
When building websites or PWAs in Vite / React / Tailwind:
1. Live Interactive Preview Mode:
   - When the user asks for a website, dashboard, game, store, or PWA:
   - Output the complete, self-contained, 100% functional production code wrapped in \`\`\`html ... \`\`\`.
   - You can include modern React via CDN:
     <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
     <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
     <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
     Or use modern ES6+ vanilla JavaScript with reactive state management, Tailwind CSS, and Lucide icons.
   - Nexus AI will automatically extract your \`\`\`html code, auto-generate PWA companion files (manifest.webmanifest, sw.js), and immediately render it in the Live Preview Canvas!

2. Workspace Vite / React Project Mode:
   - If the user asks to modify the workspace's Vite + React + TypeScript app:
   - Use \`fileWrite\` / \`fileEdit\` on \`src/App.tsx\`, \`src/components/*\`, and related files.
   - Follow Vite conventions: Fast Refresh, Tailwind CSS (@import "tailwindcss";), and modular components.
   - Always verify with \`compileProject\` after modifying Vite files.

================================================================================
PROGRESSIVE WEB APPS (PWA) EXCELLENCE:
================================================================================
When building a PWA or mobile web app:
- Include essential PWA meta tags in <head>:
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover" />
  <meta name="theme-color" content="#020617" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="manifest" href="manifest.webmanifest" />
- Include a Service Worker registration script before </body>:
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js').catch(err => console.log('SW reg info:', err));
    });
  }
- Include an In-App "Install App" / "📱 PWA ইনস্টল করুন" button listening to window 'beforeinstallprompt'.
- Include an Offline Status indicator listening to 'online' and 'offline' events.

================================================================================
UNLIMITED DOMAIN VERSATILITY - CAPABLE OF BUILDING ANY CATEGORY:
================================================================================
- E-Commerce & Stores: Product cards, category filter tabs, search bar, shopping cart drawer with quantity counters (+/-), price subtotal calculation, coupon code modal, checkout flow with order history saved to localStorage.
- SaaS & Analytics Dashboards: KPI metric cards with trend indicators (+14%, -3%), interactive charts (SVG/Canvas or Chart.js), searchable data tables with pagination, status pills (Active, Pending, Completed), activity logs.
- Productivity Tools: Kanban boards (To Do, In Progress, Done), rich Todo lists with priorities & due dates, Markdown live editors with split view, Expense/Budget trackers with category breakdown, Pomodoro timers with audio ticks.
- 2D Canvas Games & Arcades: HTML5 Canvas retro games (Snake, Flappy Bird, Pong, Space Shooter, 2048, Memory cards, Tic-Tac-Toe with minimax AI) with score counters, high scores in localStorage, touch buttons for mobile, keyboard controls.
- Portfolios & Creative Agencies: Dark/light aesthetics, glassmorphism, animated gradient text, portfolio showcase with category filter tabs and detail modals, skill bars, testimonials carousel, working contact form with client-side validation.
- Restaurants & Food Delivery: Interactive menu categories, food cards with ingredient tags, item customization modal, reservation / order form.
- Educational & Science Tools: Interactive simulations, flashcards with 3D flip animation, timed multiple-choice quizzes with progress bar.

================================================================================
LANGUAGE & TONE:
================================================================================
- Respond in Bengali (বাংলা) if the user asks in Bengali, or English if asked in English.
- Explain what was built, highlight the key PWA and interactive features, and remind the user that the Live Preview is immediately ready on the right canvas.`;
}

/**
 * Extracts and deploys complete websites and PWA companion files (manifest, service worker)
 * to both session-specific and global projects directories.
 */
export async function autoDeployWebsiteFromText(
  text: string, 
  sessionId?: string
): Promise<DeployResult> {
  try {
    let htmlContent = '';
    
    // 1. Check for ```html ... ``` block
    const codeBlockMatch = text.match(/```(?:html|htm)\s*([\s\S]*?)```/i);
    if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].includes('<')) {
      htmlContent = codeBlockMatch[1].trim();
    }
    
    // 2. Check for <!DOCTYPE html ... </html>
    if (!htmlContent) {
      const docMatch = text.match(/(<!DOCTYPE\s+html[\s\S]*?<\/html>)/i);
      if (docMatch && docMatch[1]) {
        htmlContent = docMatch[1].trim();
      }
    }

    // 3. Check for <html ... </html>
    if (!htmlContent) {
      const htmlMatch = text.match(/(<html[\s\S]*?<\/html>)/i);
      if (htmlMatch && htmlMatch[1]) {
        htmlContent = `<!DOCTYPE html>\n${htmlMatch[1].trim()}`;
      }
    }

    if (!htmlContent || htmlContent.length < 50) {
      return { success: false };
    }

    if (!htmlContent.toLowerCase().includes('<!doctype html>')) {
      htmlContent = `<!DOCTYPE html>\n${htmlContent}`;
    }

    // Extract title and theme color for PWA Manifest
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1].trim() : 'Nexus Web App';
    const appTitle = rawTitle.replace(/[|•-].*$/, '').trim() || 'Nexus App';
    const appShortName = appTitle.slice(0, 14).trim() || 'NexusApp';

    const themeColorMatch = htmlContent.match(/<meta\s+name=["']theme-color["']\s+content=["']([^"']+)["']/i);
    const themeColor = themeColorMatch ? themeColorMatch[1] : '#4f46e5';

    // Enrich HTML with PWA meta tags & Service Worker if missing
    let enrichedHtml = htmlContent;

    // Check if manifest link is present
    if (!enrichedHtml.includes('manifest.webmanifest') && !enrichedHtml.includes('manifest.json')) {
      const headIndex = enrichedHtml.indexOf('</head>');
      if (headIndex !== -1) {
        const pwaMetaTags = `
  <!-- PWA & Mobile Meta Tags (Auto-injected by Nexus AI) -->
  <link rel="manifest" href="manifest.webmanifest" />
  <meta name="theme-color" content="${themeColor}" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <link rel="apple-touch-icon" href="/icon.svg" />
  <link rel="icon" type="image/svg+xml" href="/icon.svg" />
`;
        enrichedHtml = enrichedHtml.slice(0, headIndex) + pwaMetaTags + enrichedHtml.slice(headIndex);
      }
    }

    // Check if Service Worker registration is present
    if (!enrichedHtml.includes('serviceWorker.register')) {
      const bodyCloseIndex = enrichedHtml.lastIndexOf('</body>');
      const swRegisterScript = `
  <!-- PWA Service Worker Registration & Install Prompt (Auto-injected by Nexus AI) -->
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').then(function(reg) {
          console.log('Nexus PWA Service Worker registered:', reg.scope);
        }).catch(function(err) {
          console.log('SW registration note:', err);
        });
      });
    }

    // Global PWA Install Prompt Listener
    let deferredInstallPrompt = null;
    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      window.dispatchEvent(new CustomEvent('pwa-installable'));
      var installBtn = document.getElementById('nexus-pwa-install-btn');
      if (installBtn) installBtn.style.display = 'inline-flex';
    });

    window.triggerPWAInstall = function() {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.then(function(choice) {
          if (choice.outcome === 'accepted') {
            console.log('User accepted PWA installation');
          }
          deferredInstallPrompt = null;
        });
      } else {
        alert('অ্যাপটি ইনস্টল করতে ব্রাউজারের শেয়ার বা মেনু থেকে "Add to Home Screen" বা "Install" নির্বাচন করুন।');
      }
    };
  </script>
`;
      if (bodyCloseIndex !== -1) {
        enrichedHtml = enrichedHtml.slice(0, bodyCloseIndex) + swRegisterScript + enrichedHtml.slice(bodyCloseIndex);
      } else {
        enrichedHtml += swRegisterScript;
      }
    }

    // Create standard PWA Manifest JSON
    const manifestContent = JSON.stringify({
      id: './',
      name: appTitle,
      short_name: appShortName,
      description: `${appTitle} - Progressive Web Application built with Nexus AI`,
      start_url: './index.html',
      scope: './',
      display: 'standalone',
      orientation: 'portrait-primary',
      background_color: '#020617',
      theme_color: themeColor,
      icons: [
        {
          src: '/icon.svg',
          sizes: '192x192 512x512',
          type: 'image/svg+xml',
          purpose: 'any maskable'
        },
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any'
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any'
        }
      ]
    }, null, 2);

    // Create resilient Service Worker script
    const swContent = `// Nexus PWA Service Worker (Auto-generated by Nexus AI)
const CACHE_NAME = 'nexus-pwa-${Date.now()}';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('Pre-caching assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Network-first with cache fallback for HTML documents; Cache-first for static resources
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((res) => res || caches.match('./index.html')))
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200 && response.type === 'basic') {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, copy));
          }
          return response;
        }).catch(() => null);
      })
    );
  }
});
`;

    const projectsDir = path.resolve(process.cwd(), 'projects');
    await fs.mkdir(projectsDir, { recursive: true });

    // Always deploy to global projects/
    await fs.writeFile(path.join(projectsDir, 'index.html'), enrichedHtml, 'utf-8');
    await fs.writeFile(path.join(projectsDir, 'manifest.webmanifest'), manifestContent, 'utf-8');
    await fs.writeFile(path.join(projectsDir, 'sw.js'), swContent, 'utf-8');

    let targetUrl = '/projects/index.html';
    let targetPath = 'projects/index.html';

    // If chat session ID provided, deploy to chat session folder
    if (sessionId) {
      const safeSessionId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const sessionDir = path.join(projectsDir, safeSessionId);
      await fs.mkdir(sessionDir, { recursive: true });

      await fs.writeFile(path.join(sessionDir, 'index.html'), enrichedHtml, 'utf-8');
      await fs.writeFile(path.join(sessionDir, 'manifest.webmanifest'), manifestContent, 'utf-8');
      await fs.writeFile(path.join(sessionDir, 'sw.js'), swContent, 'utf-8');

      targetUrl = `/projects/${safeSessionId}/index.html`;
      targetPath = `projects/${safeSessionId}/index.html`;
    }

    return { 
      success: true, 
      html: enrichedHtml, 
      path: targetPath, 
      url: targetUrl,
      isPWA: true
    };
  } catch (err) {
    console.warn("Failed to auto-deploy website and PWA files:", err);
    return { success: false };
  }
}

export interface SanitizedGeminiChatInput {
  history: { role: 'user' | 'model'; parts: { text: string }[] }[];
  lastMessage: string;
}

/**
 * Sanitize chat messages for @google/genai to prevent empty/uninitialized data oneof field errors.
 * Ensures:
 * 1. Every part has non-empty text.
 * 2. Proper turn alternation (user -> model -> user -> model).
 * 3. Consecutive turns of identical role are merged.
 * 4. Prepares a clean lastMessage for chat.sendMessageStream.
 */
export function prepareGeminiHistoryAndLastMessage(messages: any[]): SanitizedGeminiChatInput {
  if (!Array.isArray(messages) || messages.length === 0) {
    return {
      history: [],
      lastMessage: "Hello! Please assist me."
    };
  }

  // 1. Sanitize all turns to ensure every single turn has at least 1 non-empty text part
  const rawCleaned: { role: 'user' | 'model'; text: string }[] = [];

  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (!m) continue;
    const role: 'user' | 'model' = m.role === 'model' ? 'model' : 'user';

    let text = '';
    if (Array.isArray(m.parts)) {
      for (const p of m.parts) {
        if (typeof p === 'string' && p.trim()) {
          text += (text ? '\n' : '') + p.trim();
        } else if (p && typeof p.text === 'string' && p.text.trim()) {
          text += (text ? '\n' : '') + p.text.trim();
        }
      }
    } else if (typeof m.content === 'string' && m.content.trim()) {
      text = m.content.trim();
    } else if (typeof m.text === 'string' && m.text.trim()) {
      text = m.text.trim();
    }

    // Crucial safeguard against empty/uninitialized data oneof field in Gemini protobuf:
    if (!text.trim()) {
      if (m.imageUrl) {
        text = `[Attached Image: ${m.imageUrl}]`;
      } else if (role === 'model') {
        text = 'Code and architecture implemented.';
      } else {
        text = 'Please proceed with implementation.';
      }
    }

    rawCleaned.push({ role, text: text.trim() });
  }

  if (rawCleaned.length === 0) {
    return {
      history: [],
      lastMessage: "Hello! Please assist me."
    };
  }

  // 2. The latest turn to send to chat.sendMessageStream must be user text
  const lastTurn = rawCleaned.pop()!;
  let lastMessage = lastTurn.text;

  // 3. Construct alternating history
  const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];

  for (const item of rawCleaned) {
    if (history.length === 0) {
      history.push({ role: item.role, parts: [{ text: item.text }] });
    } else {
      const prev = history[history.length - 1];
      if (prev.role === item.role) {
        // Merge consecutive turns of identical role
        prev.parts[0].text += '\n\n' + item.text;
      } else {
        history.push({ role: item.role, parts: [{ text: item.text }] });
      }
    }
  }

  // If history ends with 'user', and we are about to send a 'user' turn:
  // Gemini chat expects alternating turns (last history item must be 'model').
  // Prepend the trailing user turn to lastMessage!
  if (history.length > 0 && history[history.length - 1].role === 'user') {
    const trailingUser = history.pop()!;
    lastMessage = trailingUser.parts[0].text + '\n\n' + lastMessage;
  }

  // If history still starts with 'model', prepend a greeting user turn to satisfy Gemini turn order
  if (history.length > 0 && history[0].role === 'model') {
    history.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  return {
    history,
    lastMessage: lastMessage.trim() || 'Please proceed with the task.'
  };
}
