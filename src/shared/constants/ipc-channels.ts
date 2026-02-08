// ============================================
// PrepHQ — IPC Channel Constants
// Typed channel names shared by Main & Renderer
// ============================================

export const IPC_CHANNELS = {
  // App lifecycle
  APP_GET_VERSION: 'app:get-version',
  APP_QUIT: 'app:quit',
  APP_CHECK_UPDATE: 'app:check-update',
  APP_INSTALL_UPDATE: 'app:install-update',
  APP_UPDATE_STATUS: 'app:update-status',

  // Window management
  WINDOW_MINIMIZE: 'window:minimize',
  WINDOW_MAXIMIZE: 'window:maximize',
  WINDOW_CLOSE: 'window:close',
  WINDOW_SET_CLICK_THROUGH: 'window:set-click-through',

  // Ghost Mode
  GHOST_START: 'ghost:start',
  GHOST_STOP: 'ghost:stop',
  GHOST_PANIC: 'ghost:panic',
  GHOST_HINT_UPDATE: 'ghost:hint-update',
  GHOST_STATE_CHANGE: 'ghost:state-change',
  GHOST_PHASE_CHANGE: 'ghost:phase-change',

  // Arena Mode
  ARENA_INTERVIEWER_RESPOND: 'arena:interviewer-respond',
  ARENA_ANALYZE_WHITEBOARD: 'arena:analyze-whiteboard',
  ARENA_RUN_CODE: 'arena:run-code',

  // Audio
  AUDIO_START_CAPTURE: 'audio:start-capture',
  AUDIO_STOP_CAPTURE: 'audio:stop-capture',
  AUDIO_VAD_EVENT: 'audio:vad-event',
  AUDIO_SYSTEM_SOURCES: 'audio:system-sources',
  AUDIO_START_SYSTEM: 'audio:start-system',

  // Sessions / DB
  DB_CREATE_SESSION: 'db:create-session',
  DB_GET_SESSIONS: 'db:get-sessions',
  DB_GET_SESSION: 'db:get-session',
  DB_SAVE_TRANSCRIPT: 'db:save-transcript',
  DB_SAVE_METRIC: 'db:save-metric',
  DB_DELETE_SESSION: 'db:delete-session',

  // Settings
  SETTINGS_GET: 'settings:get',
  SETTINGS_SET: 'settings:set',

  // Global shortcuts
  SHORTCUT_PANIC: 'shortcut:panic',

  // P2P Multiplayer
  P2P_GET_PEER_ID: 'p2p:get-peer-id',
  P2P_CREATE_ROOM: 'p2p:create-room',
  P2P_JOIN_ROOM: 'p2p:join-room',
  P2P_LEAVE_ROOM: 'p2p:leave-room',
  P2P_SIGNAL: 'p2p:signal',
  P2P_PEER_CONNECTED: 'p2p:peer-connected',
  P2P_PEER_DISCONNECTED: 'p2p:peer-disconnected',
  P2P_DATA: 'p2p:data',

  // Performance monitoring
  PERF_GET_METRICS: 'perf:get-metrics',
} as const;

export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
