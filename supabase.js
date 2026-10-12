/**
 * Code Quest: Java Adventure - Supabase & Data Access Layer
 * Handles online persistent storage with Supabase as well as robust offline
 * fallback (LocalStorage) for offline demo environments.
 */

// ==============================================================================
// CONFIGURATION (Fill with your Supabase Project settings)
// ==============================================================================
const SUPABASE_URL = ''; // e.g., 'https://xyzcompany.supabase.co'
const SUPABASE_ANON_KEY = ''; // e.g., 'eyJhbGciOiJIUzI1NiIsIn...'

// Local Storage Keys for Demo Mode
const STORAGE_KEYS = {
  LEADERBOARD: 'codequest_leaderboard',
  CONFIG: 'codequest_config',
  ADMIN_AUTH: 'codequest_demo_admin_session'
};

// Default Configuration Preset
const DEFAULT_COMPETITION_CONFIG = {
  competition_name: 'Code Quest Championship',
  start_time: null,
  end_time: null,
  target_score: 2000,
  prize_count: 3,
  prizes: [
    { place: 1, description: 'Champion Prize - Gold Medal & Tech Swag' },
    { place: 2, description: 'Runner-up Prize - Silver Medal & Code Quest Swag' },
    { place: 3, description: 'Third Place Prize - Bronze Medal' }
  ],
  participation_reward_enabled: true,
  time_limit_seconds: 180,
  is_active: false
};

(function () {
  let supabaseClient = null;

  /**
   * Helper: Generate a unique ID (UUID style) for local items
   */
  function generateLocalUUID() {
    return 'local-' + 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Helper: Read from LocalStorage with fallback
   */
  function getLocalData(key, fallback = []) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch (e) {
      console.error(`Error reading ${key} from localStorage:`, e);
      return fallback;
    }
  }

  /**
   * Helper: Write to LocalStorage
   */
  function setLocalData(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing ${key} to localStorage:`, e);
    }
  }

  const SAMPLE_PLAYER_NAMES = new Set([
    'ByteWizard', 'JavaKnight', 'AdaLovelace', 'LoopMaster', 'CyberSamurai',
    'SyntaxQueen', 'NullPointer', 'GlitchHunter', 'BinaryEcho', 'CodeCadet42'
  ]);

  function removeSampleLeaderboardRecords() {
    const records = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
    const realRecords = records.filter(record => !SAMPLE_PLAYER_NAMES.has(record.nickname));
    if (realRecords.length !== records.length) setLocalData(STORAGE_KEYS.LEADERBOARD, realRecords);
  }

  function initializeLocalData() {
    if (!getLocalData(STORAGE_KEYS.CONFIG, null)) {
      setLocalData(STORAGE_KEYS.CONFIG, DEFAULT_COMPETITION_CONFIG);
    }
  }

  // ==============================================================================
  // PUBLIC DATABASE API
  // ==============================================================================
  const CodeQuestDB = {
    /**
     * Initialize client connection or prepare local demo fallback
     */
    init() {
      if (this.isConfigured()) {
        try {
          if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            console.log('%c[CodeQuestDB] Connected to Supabase Cloud.', 'color: #00d4ff; font-weight: bold;');
          } else {
            console.warn('[CodeQuestDB] Supabase JS library not found on window. Falling back to local demo mode.');
          }
        } catch (err) {
          console.error('[CodeQuestDB] Failed to initialize Supabase client:', err);
          supabaseClient = null;
        }
      }

      removeSampleLeaderboardRecords();
      if (!this.isConfigured() || !supabaseClient) {
        console.warn('CodeQuest: Running in local demo mode. Configure Supabase for persistent online leaderboard.');
        initializeLocalData();
      }

      return this;
    },

    /**
     * Check if project credentials are validly supplied
     */
    isConfigured() {
      return (
        typeof SUPABASE_URL === 'string' &&
        SUPABASE_URL.trim() !== '' &&
        typeof SUPABASE_ANON_KEY === 'string' &&
        SUPABASE_ANON_KEY.trim() !== ''
      );
    },

    // ----------------------------------------------------------------------------
    // PLAYER OPERATIONS
    // ----------------------------------------------------------------------------

    /**
     * Submit score after completing a game run or session
     */
    async submitScore(input = {}) {
      const sanitizedNick = (input.nickname || 'Anonymous').toString().trim().slice(0, 15) || 'Coder';
      const score = Math.max(0, parseInt(input.score, 10) || 0);
      const levelsCompleted = Math.max(0, parseInt(input.levelsCompleted ?? input.levels_completed, 10) || 0);
      const totalLevels = parseInt(input.totalLevels ?? input.total_levels, 10) || 12;
      const starsEarned = Math.max(0, parseInt(input.starsEarned ?? input.stars_earned ?? input.stars, 10) || 0);
      const totalStars = parseInt(input.totalStars ?? input.total_stars, 10) || 0;
      const totalTime = Math.max(0, parseInt(input.totalTime ?? input.total_time ?? input.time_seconds, 10) || 0);
      const instructionsUsed = Math.max(0, parseInt(input.instructionsUsed ?? input.instructions_used, 10) || 0);
      const mode = (input.mode || input.game_mode) === 'competition' ? 'competition' : 'practice';
      const levelDetails = Array.isArray(input.levelDetails || input.level_details) ? (input.levelDetails || input.level_details) : [];

      const payload = {
        nickname: sanitizedNick,
        score,
        levels_completed: levelsCompleted,
        total_levels: totalLevels,
        stars_earned: starsEarned,
        total_stars: totalStars,
        total_time: totalTime,
        instructions_used: instructionsUsed,
        mode,
        level_details: levelDetails,
        verified: false,
        flagged: false,
        flag_reason: null,
        created_at: new Date().toISOString()
      };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('leaderboard')
            .insert([payload])
            .select()
            .single();

          if (error) {
            console.error('[CodeQuestDB] submitScore error:', error);
            return { success: false, error: error.message };
          }
          return { success: true, data };
        } catch (err) {
          console.error('[CodeQuestDB] submitScore exception:', err);
          return { success: false, error: err.message || 'Network error submitting score.' };
        }
      }

      // Local Demo Mode
      try {
        const localList = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
        const entry = { id: generateLocalUUID(), ...payload };
        localList.push(entry);
        setLocalData(STORAGE_KEYS.LEADERBOARD, localList);
        return { success: true, data: entry };
      } catch (err) {
        return { success: false, error: err.message };
      }
    },

    /**
     * Get filtered public leaderboard
     * filter: 'overall' | 'fastest' | 'most_stars' | 'stars' | 'efficient'
     */
    async getLeaderboard(filter = 'overall', limit = 20) {
      if (this.isConfigured() && supabaseClient) {
        try {
          let query = supabaseClient.from('leaderboard').select('*');

          switch (filter) {
            case 'fastest':
              // Filter where levels are completed, lowest time first
              query = query.order('total_time', { ascending: true }).order('score', { ascending: false });
              break;
            case 'stars':
            case 'most_stars':
              query = query.order('stars_earned', { ascending: false }).order('score', { ascending: false });
              break;
            case 'efficient':
              query = query.order('instructions_used', { ascending: true }).order('score', { ascending: false });
              break;
            case 'overall':
            default:
              query = query.order('score', { ascending: false }).order('total_time', { ascending: true });
              break;
          }

          if (limit && limit > 0) {
            query = query.limit(limit);
          }

          const { data, error } = await query;
          if (error) {
            console.error('[CodeQuestDB] getLeaderboard error:', error);
            return { success: false, error: error.message, data: [] };
          }
          return { success: true, data: data || [] };
        } catch (err) {
          console.error('[CodeQuestDB] getLeaderboard exception:', err);
          return { success: false, error: err.message, data: [] };
        }
      }

      // Local Demo Mode
      try {
        let list = [...getLocalData(STORAGE_KEYS.LEADERBOARD, [])];
        switch (filter) {
          case 'fastest':
            list.sort((a, b) => a.total_time - b.total_time || b.score - a.score);
            break;
          case 'stars':
          case 'most_stars':
            list.sort((a, b) => b.stars_earned - a.stars_earned || b.score - a.score);
            break;
          case 'efficient':
            list.sort((a, b) => a.instructions_used - b.instructions_used || b.score - a.score);
            break;
          case 'overall':
          default:
            list.sort((a, b) => b.score - a.score || a.total_time - b.total_time);
            break;
        }
        if (limit && limit > 0) {
          list = list.slice(0, limit);
        }
        return { success: true, data: list };
      } catch (err) {
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Return player ranking based on nickname and overall score
     */
    async getPlayerRank(nickname) {
      if (!nickname) return { success: false, error: 'Nickname is required' };

      const lbResult = await this.getLeaderboard('overall', 1000);
      if (!lbResult.success) {
        return { success: false, error: lbResult.error };
      }

      const list = lbResult.data;
      const targetLower = nickname.trim().toLowerCase();
      const index = list.findIndex(item => item.nickname.toLowerCase() === targetLower);

      if (index === -1) {
        return { success: true, rank: null, total: list.length };
      }

      return { success: true, rank: index + 1, total: list.length };
    },

    // ----------------------------------------------------------------------------
    // ADMIN OPERATIONS
    // ----------------------------------------------------------------------------

    /**
     * Admin login using Supabase Auth or Local Demo credential
     */
    async adminSignIn(email, password) {
      if (this.isConfigured() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email.trim(),
            password
          });
          if (error) {
            console.error('[CodeQuestDB] adminSignIn error:', error);
            return { success: false, error: error.message };
          }
          return { success: true, user: data.user };
        } catch (err) {
          return { success: false, error: err.message || 'Authentication failed' };
        }
      }

      // Local Demo Mode Authentication
      if (email && password) {
        // Allow organizers to demo test with any credentials or standard admin
        const demoUser = {
          id: 'demo-admin-id',
          email: email.trim(),
          role: 'authenticated'
        };
        sessionStorage.setItem(STORAGE_KEYS.ADMIN_AUTH, JSON.stringify(demoUser));
        return { success: true, user: demoUser };
      }
      return { success: false, error: 'Email and password are required.' };
    },

    /**
     * Sign out admin session
     */
    async adminSignOut() {
      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient.auth.signOut();
          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      sessionStorage.removeItem(STORAGE_KEYS.ADMIN_AUTH);
      return { success: true };
    },

    /**
     * Check if administrator session is currently active
     */
    async isAdminAuthenticated() {
      if (this.isConfigured() && supabaseClient) {
        try {
          const { data: { session } } = await supabaseClient.auth.getSession();
          return !!session;
        } catch (e) {
          return false;
        }
      }
      return !!sessionStorage.getItem(STORAGE_KEYS.ADMIN_AUTH);
    },

    /**
     * Fetch complete leaderboard records with optional search filter
     */
    async getFullLeaderboard(searchQuery = '') {
      if (this.isConfigured() && supabaseClient) {
        try {
          let query = supabaseClient
            .from('leaderboard')
            .select('*')
            .order('score', { ascending: false })
            .order('created_at', { ascending: false });

          if (searchQuery && searchQuery.trim()) {
            query = query.ilike('nickname', `%${searchQuery.trim()}%`);
          }

          const { data, error } = await query;
          if (error) return { success: false, error: error.message, data: [] };
          return { success: true, data: data || [] };
        } catch (err) {
          return { success: false, error: err.message, data: [] };
        }
      }

      // Local Demo Mode
      try {
        let list = [...getLocalData(STORAGE_KEYS.LEADERBOARD, [])];
        if (searchQuery && searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          list = list.filter(item => item.nickname.toLowerCase().includes(q));
        }
        list.sort((a, b) => b.score - a.score || new Date(b.created_at) - new Date(a.created_at));
        return { success: true, data: list };
      } catch (err) {
        return { success: false, error: err.message, data: [] };
      }
    },

    /**
     * Retrieve individual player run details including per-level breakdown
     */
    async getPlayerDetails(id) {
      if (!id) return { success: false, error: 'ID is required' };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('leaderboard')
            .select('*')
            .eq('id', id)
            .single();

          if (error) return { success: false, error: error.message };
          return { success: true, data };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      const list = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
      const record = list.find(item => item.id === id);
      if (!record) return { success: false, error: 'Player record not found.' };
      return { success: true, data: record };
    },

    /**
     * Mark an entry as officially verified
     */
    async verifyResult(id) {
      if (!id) return { success: false, error: 'ID is required' };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('leaderboard')
            .update({ verified: true, flagged: false, flag_reason: null })
            .eq('id', id);

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      const list = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
      const item = list.find(i => i.id === id);
      if (item) {
        item.verified = true;
        item.flagged = false;
        item.flag_reason = null;
        setLocalData(STORAGE_KEYS.LEADERBOARD, list);
        return { success: true };
      }
      return { success: false, error: 'Entry not found' };
    },

    /**
     * Flag an entry with an organizer note/reason
     */
    async flagResult(id, reason = 'Suspicious gameplay pattern') {
      if (!id) return { success: false, error: 'ID is required' };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('leaderboard')
            .update({ flagged: true, flag_reason: reason, verified: false })
            .eq('id', id);

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      const list = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
      const item = list.find(i => i.id === id);
      if (item) {
        item.flagged = true;
        item.flag_reason = reason;
        item.verified = false;
        setLocalData(STORAGE_KEYS.LEADERBOARD, list);
        return { success: true };
      }
      return { success: false, error: 'Entry not found' };
    },

    /**
     * Remove flag from player entry
     */
    async unflagResult(id) {
      if (!id) return { success: false, error: 'ID is required' };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('leaderboard')
            .update({ flagged: false, flag_reason: null })
            .eq('id', id);

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      const list = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
      const item = list.find(i => i.id === id);
      if (item) {
        item.flagged = false;
        item.flag_reason = null;
        setLocalData(STORAGE_KEYS.LEADERBOARD, list);
        return { success: true };
      }
      return { success: false, error: 'Entry not found' };
    },

    /**
     * Delete an individual entry
     */
    async deleteResult(id) {
      if (!id) return { success: false, error: 'ID is required' };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('leaderboard')
            .delete()
            .eq('id', id);

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      let list = getLocalData(STORAGE_KEYS.LEADERBOARD, []);
      const initialLen = list.length;
      list = list.filter(i => i.id !== id);
      setLocalData(STORAGE_KEYS.LEADERBOARD, list);
      return { success: list.length < initialLen };
    },

    /**
     * Danger zone: Reset / Wipe all records from leaderboard
     */
    async resetLeaderboard() {
      if (this.isConfigured() && supabaseClient) {
        try {
          // In Supabase, delete all records matching not-null id
          const { error } = await supabaseClient
            .from('leaderboard')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      setLocalData(STORAGE_KEYS.LEADERBOARD, []);
      return { success: true };
    },

    /**
     * Fetch tournament settings
     */
    async getCompetitionConfig() {
      if (this.isConfigured() && supabaseClient) {
        try {
          const { data, error } = await supabaseClient
            .from('competition_config')
            .select('*')
            .eq('id', 1)
            .single();

          if (error) {
            console.error('[CodeQuestDB] getCompetitionConfig error:', error);
            return { success: false, error: error.message, data: DEFAULT_COMPETITION_CONFIG };
          }
          return { success: true, data };
        } catch (err) {
          return { success: false, error: err.message, data: DEFAULT_COMPETITION_CONFIG };
        }
      }

      // Local Demo Mode
      const config = getLocalData(STORAGE_KEYS.CONFIG, DEFAULT_COMPETITION_CONFIG);
      return { success: true, data: config };
    },

    /**
     * Update tournament settings
     */
    async updateCompetitionConfig(newConfig) {
      if (!newConfig || typeof newConfig !== 'object') {
        return { success: false, error: 'Invalid configuration payload.' };
      }

      const payload = {
        competition_name: newConfig.competition_name || 'Code Quest Championship',
        start_time: newConfig.start_time || null,
        end_time: newConfig.end_time || null,
        target_score: parseInt(newConfig.target_score, 10) || 2000,
        prize_count: parseInt(newConfig.prize_count, 10) || 3,
        prizes: Array.isArray(newConfig.prizes) ? newConfig.prizes : [],
        participation_reward_enabled: !!newConfig.participation_reward_enabled,
        time_limit_seconds: parseInt(newConfig.time_limit_seconds, 10) || 180,
        is_active: !!newConfig.is_active,
        updated_at: new Date().toISOString()
      };

      if (this.isConfigured() && supabaseClient) {
        try {
          const { error } = await supabaseClient
            .from('competition_config')
            .upsert({ id: 1, ...payload });

          if (error) return { success: false, error: error.message };
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      }

      // Local Demo Mode
      setLocalData(STORAGE_KEYS.CONFIG, payload);
      return { success: true };
    },

    /**
     * Return total unique or registered participants
     */
    async getParticipantCount() {
      const res = await this.getFullLeaderboard();
      if (!res.success) return { success: false, error: res.error, count: 0 };
      return { success: true, count: res.data.length };
    },

    /**
     * Export complete leaderboard data to standard CSV formatted string
     */
    async exportLeaderboardCSV() {
      const res = await this.getFullLeaderboard();
      const rows = res.success ? res.data : [];

      const headers = [
        'ID',
        'Nickname',
        'Score',
        'Levels Completed',
        'Total Levels',
        'Stars Earned',
        'Total Time (s)',
        'Instructions Used',
        'Mode',
        'Status',
        'Flag Reason',
        'Date Submitted'
      ];

      const csvRows = [headers.join(',')];

      rows.forEach(item => {
        let status = 'Pending';
        if (item.verified) status = 'Verified';
        if (item.flagged) status = 'Flagged';

        const sanitize = val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        };

        const row = [
          sanitize(item.id),
          sanitize(item.nickname),
          item.score,
          item.levels_completed,
          item.total_levels,
          item.stars_earned,
          item.total_time,
          item.instructions_used,
          sanitize(item.mode),
          sanitize(status),
          sanitize(item.flag_reason || ''),
          sanitize(item.created_at ? new Date(item.created_at).toLocaleString() : '')
        ];

        csvRows.push(row.join(','));
      });

      return csvRows.join('\r\n');
    }
  };

  // Expose globally and auto-initialize
  window.CodeQuestDB = CodeQuestDB;
  document.addEventListener('DOMContentLoaded', () => {
    CodeQuestDB.init();
  });
})();
