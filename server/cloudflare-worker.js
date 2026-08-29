/**
 * Cloudflare Workers 版本后端
 * 使用 D1 SQLite 数据库
 */

// 这里是一个占位符，实际部署时需要配置 wrangler.toml 和 D1 数据库
export default {
  async fetch(request, env, ctx) {
    // CORS 处理
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    });

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    const url = new URL(request.url);
    
    // 健康检查
    if (url.pathname === '/api/health') {
      return Response.json({ status: 'ok', timestamp: new Date().toISOString() }, { headers });
    }

    // API 路由（需要根据实际路由实现）
    if (url.pathname.startsWith('/api/auth')) {
      // TODO: 实现认证路由
      return Response.json({ error: 'API 需要后端服务器支持' }, { status: 503, headers });
    }

    return Response.json({ error: 'Not Found' }, { status: 404, headers });
  }
};
