import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const ROOT = path.join(__dirname, 'dist');
const FALLBACK_ROOT = __dirname;
const DATA_DIR = path.join(__dirname, 'data');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
};

const readRequestBody = (request) => new Promise((resolve, reject) => {
  let body = '';
  request.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) {
      request.destroy();
      reject(new Error('Request body is too large.'));
    }
  });
  request.on('end', () => resolve(body));
  request.on('error', reject);
});

const sanitize = (value) => String(value || '').trim();

const validateOrder = (payload) => {
  const order = {
    name: sanitize(payload.name),
    phone: sanitize(payload.phone),
    service: sanitize(payload.service),
    message: sanitize(payload.message),
  };
  const errors = {};
  const phonePattern = /^(\+98|0)?9\d{9}$/;

  if (order.name.length < 2) errors.name = 'نام باید حداقل ۲ حرف باشد.';
  if (!phonePattern.test(order.phone)) errors.phone = 'شماره تماس معتبر نیست.';
  if (!order.service) errors.service = 'نوع خدمت الزامی است.';
  if (order.message.length < 10) errors.message = 'توضیحات باید حداقل ۱۰ کاراکتر باشد.';

  return { order, errors };
};

const loadOrders = async () => {
  try {
    const file = await fs.readFile(ORDERS_FILE, 'utf8');
    return JSON.parse(file);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const saveOrder = async (order) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const orders = await loadOrders();
  const storedOrder = {
    id: `time-order-${Date.now()}`,
    status: 'new',
    createdAt: new Date().toISOString(),
    ...order,
  };
  orders.unshift(storedOrder);
  await fs.writeFile(ORDERS_FILE, `${JSON.stringify(orders, null, 2)}\n`);
  return storedOrder;
};

const handleApi = async (request, response) => {
  if (request.method === 'GET' && request.url === '/api/health') {
    sendJson(response, 200, { ok: true, service: 'TIME backend' });
    return;
  }

  if (request.method === 'POST' && (request.url === '/api/orders' || request.url === '/api/requests')) {
    try {
      const body = await readRequestBody(request);
      const payload = JSON.parse(body || '{}');
      const { order, errors } = validateOrder(payload);

      if (Object.keys(errors).length > 0) {
        sendJson(response, 422, { ok: false, errors });
        return;
      }

      const storedOrder = await saveOrder(order);
      sendJson(response, 201, {
        ok: true,
        message: 'سفارش شما با موفقیت ثبت شد. تیم تایم به‌زودی پیگیری می‌کند.',
        orderId: storedOrder.id,
      });
    } catch (error) {
      const status = error instanceof SyntaxError ? 400 : 500;
      sendJson(response, status, { ok: false, message: 'امکان ثبت سفارش وجود ندارد. دوباره تلاش کنید.' });
    }
    return;
  }

  sendJson(response, 404, { ok: false, message: 'مسیر API پیدا نشد.' });
};

const getActiveRoot = async () => {
  try {
    await fs.access(path.join(ROOT, 'index.html'));
    return ROOT;
  } catch {
    return FALLBACK_ROOT;
  }
};

const serveStatic = async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const safePath = path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  const activeRoot = await getActiveRoot();
  const filePath = path.join(activeRoot, safePath === '/' ? 'index.html' : safePath);

  if (!filePath.startsWith(activeRoot) || filePath.includes(`${path.sep}data${path.sep}`)) {
    response.writeHead(403);
    response.end('Forbidden');
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(file);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const index = await fs.readFile(path.join(activeRoot, 'index.html'));
      response.writeHead(200, { 'Content-Type': contentTypes['.html'] });
      response.end(index);
      return;
    }
    response.writeHead(500);
    response.end('Server error');
  }
};

const server = http.createServer((request, response) => {
  if (request.url.startsWith('/api/')) {
    handleApi(request, response);
    return;
  }
  serveStatic(request, response);
});

server.listen(PORT, () => {
  console.log(`TIME website is running on http://localhost:${PORT}`);
});
