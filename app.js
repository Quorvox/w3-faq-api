// w3: faq с api, аккордеон + поиск
const API = 'https://jsonplaceholder.typicode.com/posts?_limit=12';
const CATS = ['оплата', 'доставка', 'аккаунт'];
const KEY = 'w3-open';

const FALLBACK = [
  { id: 1, cat: 'оплата', q: 'какие способы оплаты есть?', a: 'карты и сбп, чек на почту.' },
  { id: 2, cat: 'оплата', q: 'когда вернут деньги?', a: 'за 3-5 дней на карту.' },
  { id: 3, cat: 'доставка', q: 'сколько ждать заказ?', a: 'по городу 1-2 дня, по стране 3-7.' },
  { id: 4, cat: 'доставка', q: 'где трек-номер?', a: 'приходит в смс после отправки.' },
  { id: 5, cat: 'аккаунт', q: 'как сменить пароль?', a: 'настройки → безопасность → сменить.' },
  { id: 6, cat: 'аккаунт', q: 'как удалить аккаунт?', a: 'напиши в поддержку, удалим за день.' },
];

function toFaq(posts) {
  // посты api -> вопросы с категориями
  return posts.map(p => ({
    id: p.id,
    cat: CATS[(p.id - 1) % CATS.length],
    q: String(p.title).slice(0, 80),
    a: String(p.body).slice(0, 200),
  }));
}

function filterFaq(items, q, cat) {
  // поиск + фильтр категории
  q = (q || '').trim().toLowerCase();
  return items.filter(i =>
    (cat === 'all' || i.cat === cat) &&
    (!q || i.q.toLowerCase().includes(q) || i.a.toLowerCase().includes(q)));
}

function highlight(text, q) {
  // подсветка совпадений
  q = (q || '').trim();
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return text.slice(0, i) + '<mark>' + text.slice(i, i + q.length) + '</mark>' + highlight(text.slice(i + q.length), q);
}

function toggleOpen(cur, id) {
  // открыт один: повторный клик закрывает
  return cur === id ? null : id;
}

if (typeof document !== 'undefined') {
  let items = [], open = null, cat = 'all';
  try { open = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  const $ = id => document.getElementById(id);

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  }

  function render() {
    const q = $('q').value;
    const rows = filterFaq(items, q, cat);
    $('list').innerHTML = rows.length ? rows.map((i, idx) => `
      <div class="acc${open === i.id ? ' open' : ''}" data-id="${i.id}" style="--i:${idx}">
        <button><span class="n">${String(idx + 1).padStart(2, '0')}</span><span class="qt">${highlight(esc(i.q), esc(q))}</span><span class="cat">${i.cat}</span><span class="plus"></span></button>
        <div class="body"><div class="in"><div class="ans"><span class="alab">ответ</span><p>${highlight(esc(i.a), esc(q))}</p></div></div></div>
      </div>`).join('') : '<div class="empty">ничего не нашлось</div>';
  }

  async function boot() {
    // тянем базу c таймаутом, ?demo=1 сразу берет встроенную, иначе фолбэк
    if (location.search.includes('demo')) {
      items = FALLBACK;
      $('src').textContent = 'демо-база · ' + items.length + ' вопросов';
      render();
      return;
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 8000);
      const r = await fetch(API, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('http ' + r.status);
      items = toFaq(await r.json());
      $('src').textContent = 'база: jsonplaceholder · ' + items.length + ' вопросов';
    } catch (e) {
      items = FALLBACK;
      $('src').textContent = 'без сети — встроенная база';
    }
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    // ?shot=1 гасит анимации для детерминированного скрина
    if (location.search.includes('shot')) document.documentElement.classList.add('shot');
    boot();
    let t;
    $('q').addEventListener('input', () => { clearTimeout(t); t = setTimeout(render, 150); });
    $('cats').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      cat = b.dataset.c;
      document.querySelectorAll('#cats button').forEach(x => x.classList.toggle('on', x === b));
      render();
    });
    $('list').addEventListener('click', e => {
      const card = e.target.closest('.acc');
      if (!card) return;
      open = toggleOpen(open, +card.dataset.id);
      try { localStorage.setItem(KEY, JSON.stringify(open)); } catch (err) {}
      render();
    });
  });
}
