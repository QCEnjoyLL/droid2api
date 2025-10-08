import express from 'express';
import {
  verifyAdminAuth,
  getLocalApiKeys,
  addLocalApiKey,
  removeLocalApiKey,
  generateApiKey
} from './middleware.js';
import {
  getKeyStats,
  getFactoryApiKeys,
  addFactoryApiKey,
  removeFactoryApiKey,
  verifyFactoryApiKey
} from './auth.js';

const router = express.Router();

/**
 * GET /admin
 * Admin panel HTML page
 */
router.get('/admin', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Droid2API 管理面板</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      padding: 20px;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 30px;
      text-align: center;
    }

    .header h1 {
      color: #333;
      margin-bottom: 10px;
    }

    .header p {
      color: #666;
    }

    .login-panel {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      margin: 100px auto;
    }

    .login-panel h2 {
      margin-bottom: 20px;
      color: #333;
    }

    .section {
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }

    .section h2 {
      color: #333;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #667eea;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .stat-card h3 {
      font-size: 14px;
      opacity: 0.9;
      margin-bottom: 10px;
    }

    .stat-card .value {
      font-size: 32px;
      font-weight: bold;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    th {
      background: #f5f5f5;
      font-weight: 600;
      color: #333;
    }

    tr:hover {
      background: #f9f9f9;
    }

    .input-group {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }

    input[type="text"],
    input[type="password"] {
      flex: 1;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 14px;
    }

    button {
      padding: 12px 24px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: background 0.3s;
    }

    button:hover {
      background: #5568d3;
    }

    button.danger {
      background: #e53e3e;
    }

    button.danger:hover {
      background: #c53030;
    }

    button.secondary {
      background: #718096;
    }

    button.secondary:hover {
      background: #4a5568;
    }

    .alert {
      padding: 12px 20px;
      border-radius: 6px;
      margin-bottom: 20px;
      display: none;
    }

    .alert.success {
      background: #c6f6d5;
      color: #22543d;
      border: 1px solid #9ae6b4;
    }

    .alert.error {
      background: #fed7d7;
      color: #742a2a;
      border: 1px solid #fc8181;
    }

    .hidden {
      display: none;
    }

    .key-display {
      font-family: 'Courier New', monospace;
      background: #f5f5f5;
      padding: 8px;
      border-radius: 4px;
      word-break: break-all;
    }

    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .badge.active {
      background: #c6f6d5;
      color: #22543d;
    }

    .badge.warning {
      background: #feebc8;
      color: #7c2d12;
    }

    .logout-btn {
      position: absolute;
      top: 20px;
      right: 20px;
    }
  </style>
</head>
<body>
  <!-- Login Panel -->
  <div id="loginPanel" class="login-panel">
    <h2>🔐 管理员登录</h2>
    <div id="loginAlert" class="alert"></div>
    <div class="input-group">
      <input type="password" id="loginPassword" placeholder="请输入管理员密码" />
      <button onclick="login()">登录</button>
    </div>
  </div>

  <!-- Main Dashboard (hidden until logged in) -->
  <div id="dashboard" class="hidden">
    <button class="logout-btn" onclick="logout()">退出登录</button>

    <div class="container">
      <div class="header">
        <h1>🤖 Droid2API 管理面板</h1>
        <p>API密钥管理与系统监控</p>
      </div>

      <div id="alert" class="alert"></div>

      <!-- Statistics Section -->
      <div class="section">
        <h2>📊 系统统计</h2>
        <div class="stats-grid" id="statsGrid">
          <!-- Stats will be loaded here -->
        </div>
      </div>

      <!-- Local API Keys Section -->
      <div class="section">
        <h2>🔑 本地API密钥管理</h2>
        <div class="input-group">
          <input type="text" id="newLocalKey" placeholder="输入新的API密钥（留空自动生成）" />
          <button onclick="addLocalKey()">添加密钥</button>
          <button class="secondary" onclick="generateKey()">生成密钥</button>
        </div>
        <table id="localKeysTable">
          <thead>
            <tr>
              <th>序号</th>
              <th>密钥</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="localKeysBody">
            <!-- Keys will be loaded here -->
          </tbody>
        </table>
      </div>

      <!-- Factory API Keys Section -->
      <div class="section">
        <h2>🏭 Factory API密钥管理</h2>
        <p style="color: #666; margin-bottom: 15px;">
          管理Factory API密钥，可以添加、验证和删除密钥
        </p>
        <div class="input-group">
          <input type="text" id="newFactoryKey" placeholder="输入Factory API密钥（格式：fk-xxx）" />
          <button onclick="verifyAndAddFactoryKey()">验证并添加</button>
          <button class="secondary" onclick="addFactoryKeyDirect()">直接添加</button>
        </div>
        <table id="factoryKeysTable">
          <thead>
            <tr>
              <th>密钥</th>
              <th>使用次数</th>
              <th>最后使用</th>
              <th>失败次数</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="factoryKeysBody">
            <!-- Keys will be loaded here -->
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    let authToken = null;

    // Login function
    async function login() {
      const password = document.getElementById('loginPassword').value;
      const alert = document.getElementById('loginAlert');

      try {
        const response = await fetch('/admin/api/auth/verify', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + password
          }
        });

        if (response.ok) {
          authToken = password;
          document.getElementById('loginPanel').classList.add('hidden');
          document.getElementById('dashboard').classList.remove('hidden');
          loadDashboard();
        } else {
          showAlert(alert, '密码错误', 'error');
        }
      } catch (error) {
        showAlert(alert, '登录失败: ' + error.message, 'error');
      }
    }

    // Logout function
    function logout() {
      authToken = null;
      document.getElementById('dashboard').classList.add('hidden');
      document.getElementById('loginPanel').classList.remove('hidden');
      document.getElementById('loginPassword').value = '';
    }

    // Load dashboard data
    async function loadDashboard() {
      await Promise.all([
        loadStats(),
        loadLocalKeys(),
        loadFactoryKeys()
      ]);
    }

    // Load statistics
    async function loadStats() {
      try {
        const response = await fetch('/admin/api/stats', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await response.json();

        const statsGrid = document.getElementById('statsGrid');
        statsGrid.innerHTML = \`
          <div class="stat-card">
            <h3>本地API密钥</h3>
            <div class="value">\${data.localKeys}</div>
          </div>
          <div class="stat-card">
            <h3>Factory密钥</h3>
            <div class="value">\${data.factoryKeys}</div>
          </div>
          <div class="stat-card">
            <h3>总请求次数</h3>
            <div class="value">\${data.totalRequests}</div>
          </div>
          <div class="stat-card">
            <h3>失败次数</h3>
            <div class="value">\${data.totalFailures}</div>
          </div>
        \`;
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    }

    // Load local keys
    async function loadLocalKeys() {
      try {
        const response = await fetch('/admin/api/keys/local', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await response.json();

        const tbody = document.getElementById('localKeysBody');
        if (data.keys.length === 0) {
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">暂无本地API密钥</td></tr>';
          return;
        }

        tbody.innerHTML = data.keys.map((k, i) => \`
          <tr>
            <td>\${i + 1}</td>
            <td class="key-display">\${k.key}</td>
            <td>
              <button class="danger" onclick="removeLocalKey('\${k.key}')">删除</button>
            </td>
          </tr>
        \`).join('');
      } catch (error) {
        console.error('Failed to load local keys:', error);
      }
    }

    // Store full keys for management (received from backend)
    let fullFactoryKeys = [];

    // Load factory keys
    async function loadFactoryKeys() {
      try {
        const response = await fetch('/admin/api/keys/factory', {
          headers: { 'Authorization': 'Bearer ' + authToken }
        });
        const data = await response.json();

        // Store full keys for management operations
        fullFactoryKeys = data.keys.map(k => k.key);

        const tbody = document.getElementById('factoryKeysBody');
        if (data.keys.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">未配置Factory API密钥，点击上方按钮添加</td></tr>';
          return;
        }

        tbody.innerHTML = data.keys.map((k, index) => \`
          <tr>
            <td class="key-display">\${k.prefix}</td>
            <td>\${k.used}</td>
            <td>\${k.lastUsed || '未使用'}</td>
            <td>\${k.failures}</td>
            <td>
              <span class="badge \${k.failures > 0 ? 'warning' : 'active'}">
                \${k.failures > 0 ? '有失败' : '正常'}
              </span>
            </td>
            <td>
              <button class="secondary" onclick="verifyFactoryKey(\${index})">验证</button>
              <button class="danger" onclick="removeFactoryKeyByIndex(\${index})">删除</button>
            </td>
          </tr>
        \`).join('');
      } catch (error) {
        console.error('Failed to load factory keys:', error);
      }
    }

    // Add local key
    async function addLocalKey() {
      const keyInput = document.getElementById('newLocalKey');
      const key = keyInput.value.trim();

      try {
        const response = await fetch('/admin/api/keys/local', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key })
        });

        const data = await response.json();

        if (response.ok) {
          showMainAlert('密钥添加成功', 'success');
          keyInput.value = '';
          loadDashboard();
        } else {
          showMainAlert(data.message || '添加失败', 'error');
        }
      } catch (error) {
        showMainAlert('添加失败: ' + error.message, 'error');
      }
    }

    // Generate key
    async function generateKey() {
      try {
        const response = await fetch('/admin/api/keys/generate', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + authToken
          }
        });

        const data = await response.json();

        if (response.ok) {
          document.getElementById('newLocalKey').value = data.key;
          showMainAlert('密钥已生成，点击添加密钥按钮保存', 'success');
        } else {
          showMainAlert('生成失败', 'error');
        }
      } catch (error) {
        showMainAlert('生成失败: ' + error.message, 'error');
      }
    }

    // Remove local key
    async function removeLocalKey(key) {
      if (!confirm('确定要删除这个密钥吗？')) {
        return;
      }

      try {
        const response = await fetch('/admin/api/keys/local', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key })
        });

        if (response.ok) {
          showMainAlert('密钥删除成功', 'success');
          loadDashboard();
        } else {
          showMainAlert('删除失败', 'error');
        }
      } catch (error) {
        showMainAlert('删除失败: ' + error.message, 'error');
      }
    }

    // Verify and add Factory key
    async function verifyAndAddFactoryKey() {
      const keyInput = document.getElementById('newFactoryKey');
      const key = keyInput.value.trim();

      if (!key) {
        showMainAlert('请输入Factory API密钥', 'error');
        return;
      }

      showMainAlert('正在验证密钥...', 'success');

      try {
        const response = await fetch('/admin/api/keys/factory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key, verify: true })
        });

        const data = await response.json();

        if (response.ok) {
          showMainAlert('密钥验证成功并已添加', 'success');
          keyInput.value = '';
          loadDashboard();
        } else {
          showMainAlert(data.message || '验证失败，密钥无效', 'error');
        }
      } catch (error) {
        showMainAlert('添加失败: ' + error.message, 'error');
      }
    }

    // Add Factory key directly (without verification)
    async function addFactoryKeyDirect() {
      const keyInput = document.getElementById('newFactoryKey');
      const key = keyInput.value.trim();

      if (!key) {
        showMainAlert('请输入Factory API密钥', 'error');
        return;
      }

      if (!confirm('确定要直接添加此密钥（不验证）吗？')) {
        return;
      }

      try {
        const response = await fetch('/admin/api/keys/factory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key, verify: false })
        });

        const data = await response.json();

        if (response.ok) {
          showMainAlert('密钥已添加', 'success');
          keyInput.value = '';
          loadDashboard();
        } else {
          showMainAlert(data.message || '添加失败', 'error');
        }
      } catch (error) {
        showMainAlert('添加失败: ' + error.message, 'error');
      }
    }

    // Verify Factory key
    async function verifyFactoryKey(index) {
      const fullKey = fullFactoryKeys[index];
      if (!fullKey) {
        showMainAlert('无法获取完整密钥进行验证', 'error');
        return;
      }

      showMainAlert('正在验证密钥...', 'success');

      try {
        const verifyResponse = await fetch('/admin/api/keys/factory/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key: fullKey })
        });

        const verifyData = await verifyResponse.json();

        if (verifyData.valid) {
          showMainAlert('密钥有效 ✓ (状态: ' + verifyData.status + ')', 'success');
        } else {
          showMainAlert('密钥无效 ✗ (状态: ' + (verifyData.status || 'error') + ')', 'error');
        }
      } catch (error) {
        showMainAlert('验证失败: ' + error.message, 'error');
      }
    }

    // Remove Factory key by index
    async function removeFactoryKeyByIndex(index) {
      const fullKey = fullFactoryKeys[index];
      if (!fullKey) {
        showMainAlert('无法获取密钥信息', 'error');
        return;
      }

      if (!confirm('确定要删除这个Factory API密钥吗？')) {
        return;
      }

      try {
        const deleteResponse = await fetch('/admin/api/keys/factory', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + authToken
          },
          body: JSON.stringify({ key: fullKey })
        });

        if (deleteResponse.ok) {
          showMainAlert('密钥删除成功', 'success');
          loadDashboard();
        } else {
          const data = await deleteResponse.json();
          showMainAlert(data.message || '删除失败', 'error');
        }
      } catch (error) {
        showMainAlert('删除失败: ' + error.message, 'error');
      }
    }

    // Show alert
    function showAlert(element, message, type) {
      element.textContent = message;
      element.className = 'alert ' + type;
      element.style.display = 'block';
      setTimeout(() => {
        element.style.display = 'none';
      }, 3000);
    }

    function showMainAlert(message, type) {
      showAlert(document.getElementById('alert'), message, type);
    }

    // Handle Enter key in login
    document.addEventListener('DOMContentLoaded', () => {
      document.getElementById('loginPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          login();
        }
      });
    });
  </script>
</body>
</html>
  `);
});

/**
 * POST /admin/api/auth/verify
 * Verify admin authentication
 */
router.post('/admin/api/auth/verify', verifyAdminAuth, (req, res) => {
  res.json({ success: true });
});

/**
 * GET /admin/api/stats
 * Get system statistics
 */
router.get('/admin/api/stats', verifyAdminAuth, (req, res) => {
  const keyStats = getKeyStats();
  const factoryKeys = getFactoryApiKeys();
  const localKeys = getLocalApiKeys();

  let totalRequests = 0;
  let totalFailures = 0;

  Object.values(keyStats).forEach(stat => {
    totalRequests += stat.used;
    totalFailures += stat.failures;
  });

  res.json({
    localKeys: localKeys.length,
    factoryKeys: factoryKeys.length,
    totalRequests,
    totalFailures
  });
});

/**
 * GET /admin/api/keys/local
 * Get all local API keys
 */
router.get('/admin/api/keys/local', verifyAdminAuth, (req, res) => {
  const keys = getLocalApiKeys();
  res.json({ keys });
});

/**
 * POST /admin/api/keys/local
 * Add a new local API key
 */
router.post('/admin/api/keys/local', verifyAdminAuth, (req, res) => {
  try {
    const { key } = req.body;

    // If no key provided, generate one
    const apiKey = key && key.trim() !== '' ? key : generateApiKey();

    const result = addLocalApiKey(apiKey);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /admin/api/keys/local
 * Remove a local API key
 */
router.delete('/admin/api/keys/local', verifyAdminAuth, (req, res) => {
  try {
    const { key } = req.body;
    const result = removeLocalApiKey(key);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /admin/api/keys/factory
 * Get Factory API keys status
 * Returns full keys for admin management
 */
router.get('/admin/api/keys/factory', verifyAdminAuth, (req, res) => {
  const keys = getFactoryApiKeys();
  const keyStats = getKeyStats();

  const keysWithStats = keys.map(key => {
    const stats = keyStats[key] || { used: 0, lastUsed: null, failures: 0 };
    return {
      key: key,  // Full key for management purposes
      prefix: key.substring(0, 10) + '...',
      used: stats.used,
      lastUsed: stats.lastUsed,
      failures: stats.failures
    };
  });

  res.json({ keys: keysWithStats });
});

/**
 * POST /admin/api/keys/generate
 * Generate a new API key
 */
router.post('/admin/api/keys/generate', verifyAdminAuth, (req, res) => {
  const key = generateApiKey();
  res.json({ key });
});

/**
 * POST /admin/api/keys/factory
 * Add a new Factory API key
 */
router.post('/admin/api/keys/factory', verifyAdminAuth, async (req, res) => {
  try {
    const { key, verify } = req.body;

    if (!key || key.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }

    // Optionally verify the key before adding
    if (verify) {
      const verifyResult = await verifyFactoryApiKey(key.trim());
      if (!verifyResult.valid) {
        return res.status(400).json({
          success: false,
          message: 'Invalid Factory API key',
          details: verifyResult
        });
      }
    }

    const result = addFactoryApiKey(key);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /admin/api/keys/factory
 * Remove a Factory API key
 */
router.delete('/admin/api/keys/factory', verifyAdminAuth, (req, res) => {
  try {
    const { key } = req.body;
    const result = removeFactoryApiKey(key);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /admin/api/keys/factory/verify
 * Verify a Factory API key (test if it's valid)
 */
router.post('/admin/api/keys/factory/verify', verifyAdminAuth, async (req, res) => {
  try {
    const { key } = req.body;

    if (!key || key.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'API key is required'
      });
    }

    const result = await verifyFactoryApiKey(key.trim());
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
