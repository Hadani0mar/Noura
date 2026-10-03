'use strict';

const cfg = window.CATALOG_CONFIG;
const client = window.supabase.createClient(cfg.url, cfg.key);
const statusEl = document.getElementById('status');
const addForm = document.getElementById('add-product-form');
const addMessage = document.getElementById('add-product-message');
const addPanel = document.getElementById('add-product-panel');
const addOpenButton = document.getElementById('add-product-open');
const adminTopbar = document.getElementById('admin-topbar');
let currentUser = null;

function message(el, text, error = false) {
  el.textContent = text;
  el.classList.toggle('error', error);
}

function check(result) {
  if (result.error) throw result.error;
  return result.data;
}

function validImage(file) {
  return !file || (
    ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) &&
    file.size <= 5242880
  );
}

function extensionFor(file) {
  return {'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp'}[file.type];
}

async function uploadImage(file, folder) {
  if (!file) return { image: '/assets/logo.png', path: null };
  const path = folder + '/' + crypto.randomUUID() + '.' + extensionFor(file);
  check(await client.storage.from('catalog-images').upload(path, file, {
    contentType: file.type,
    upsert: false
  }));
  return {
    image: client.storage.from('catalog-images').getPublicUrl(path).data.publicUrl,
    path
  };
}

async function showSession() {
  document.getElementById('workspace').hidden = true;
  document.getElementById('denied').hidden = true;
  adminTopbar.hidden = true;

  const { data, error } = await client.auth.getUser();
  if (error || !data.user) {
    currentUser = null;
    document.getElementById('login').hidden = false;
    return;
  }

  currentUser = data.user;
  document.getElementById('login').hidden = true;

  try {
    const allowed = check(
      await client.from('catalog_admins')
        .select('user_id')
        .eq('user_id', currentUser.id)
        .maybeSingle()
    );

    if (!allowed) {
      document.getElementById('denied').hidden = false;
      return;
    }

    adminTopbar.hidden = false;
    await loadProducts();
    document.getElementById('workspace').hidden = false;
  } catch {
    message(statusEl, 'تعذر فتح لوحة الإدارة. حاول مرة أخرى.', true);
  }
}

async function loadProducts() {
  const products = check(
    await client.from('catalog_products').select('*').order('id')
  );

  const editor = document.getElementById('editor');
  editor.replaceChildren();

  for (const p of products) {
    const form = document.createElement('form');
    form.className = 'edit-card';
    form.innerHTML =
      '<img><h2></h2>' +
      '<label>السعر<input name="price" type="number" min="0" max="9999999999.99" step="0.01" required></label>' +
      '<label>الكمية / عدد العبوة<input name="pack" type="number" min="1" max="2147483647" step="1" required></label>' +
      '<label>صورة جديدة (PNG، JPG أو WebP — حتى 5 MB)<input name="image" type="file" accept="image/jpeg,image/png,image/webp"></label>' +
      '<button type="submit">حفظ التغييرات</button>' +
      '<p class="message" role="status" aria-live="polite"></p>';

    const image = form.querySelector('img');
    image.alt = p.name;
    image.src = safeImage(p.image);
    form.querySelector('h2').textContent = p.name;
    form.elements.price.value = p.price;
    form.elements.pack.value = p.pack;

    let preview = null;

    form.elements.image.addEventListener('change', () => {
      if (preview) URL.revokeObjectURL(preview);
      preview = null;
      const file = form.elements.image.files[0];
      if (file) {
        preview = URL.createObjectURL(file);
        image.src = preview;
      } else {
        image.src = safeImage(p.image);
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const msg = form.querySelector('.message');
      const button = form.querySelector('button');
      const price = Number(form.elements.price.value);
      const pack = Number(form.elements.pack.value);
      const file = form.elements.image.files[0];

      if (!Number.isFinite(price) || price < 0 || !Number.isInteger(pack) || pack < 1) {
        message(msg, 'راجع السعر والكمية.', true);
        return;
      }

      if (!validImage(file)) {
        message(msg, 'اختار صورة JPG أو PNG أو WebP بحجم حتى 5 MB.', true);
        return;
      }

      button.disabled = true;
      message(msg, 'جاري الحفظ…');
      let path = null;
      let committed = false;

      try {
        let newImage = p.image;
        if (file) {
          const uploaded = await uploadImage(file, String(p.id));
          newImage = uploaded.image;
          path = uploaded.path;
        }

        const data = check(
          await client.from('catalog_products')
            .update({ price, pack, image: newImage })
            .eq('id', p.id)
            .eq('updated_at', p.updated_at)
            .select()
            .maybeSingle()
        );

        if (!data) throw Error('conflict');

        committed = true;
        Object.assign(p, data);
        image.src = safeImage(p.image);
        form.elements.image.value = '';

        if (preview) {
          URL.revokeObjectURL(preview);
          preview = null;
        }

        message(msg, 'تم الحفظ. التغييرات تظهر للزوار عند فتح أو تحديث الكتالوج.');
      } catch (e) {
        if (path && !committed) {
          await client.storage.from('catalog-images').remove([path]);
        }

        message(
          msg,
          e.message === 'conflict'
            ? 'تغيّر الصنف من جلسة أخرى، أو انتهت صلاحية التعديل. حدّث الصفحة قبل المحاولة مجددًا.'
            : 'تعذر الحفظ. راجع اتصالك وتسجيل الدخول وحاول مرة أخرى.',
          true
        );
      } finally {
        button.disabled = false;
      }
    });

    editor.append(form);
  }
}

addOpenButton.addEventListener('click', () => {
  addPanel.hidden = false;
  addPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  requestAnimationFrame(() => addForm.elements.name.focus());
});

addForm.addEventListener('submit', async event => {
  event.preventDefault();

  const button = addForm.querySelector('button[type="submit"]');
  const name = addForm.elements.name.value.trim();
  const price = Number(addForm.elements.price.value);
  const pack = Number(addForm.elements.pack.value);
  const file = addForm.elements.image.files[0];

  if (!name || name.length > 300) {
    message(addMessage, 'اكتب اسم المنتج.', true);
    return;
  }

  if (!Number.isFinite(price) || price < 0 || !Number.isInteger(pack) || pack < 1) {
    message(addMessage, 'راجع السعر والكمية.', true);
    return;
  }

  if (!validImage(file)) {
    message(addMessage, 'اختار صورة JPG أو PNG أو WebP بحجم حتى 5 MB.', true);
    return;
  }

  button.disabled = true;
  message(addMessage, 'جاري إضافة المنتج…');
  let uploadedPath = null;
  let committed = false;

  try {
    let image = '/assets/logo.png';

    if (file) {
      const uploaded = await uploadImage(file, 'new-products');
      image = uploaded.image;
      uploadedPath = uploaded.path;
    }

    const created = check(
      await client.from('catalog_products')
        .insert({ name, price, pack, image })
        .select()
        .single()
    );

    committed = true;
    addForm.reset();
    message(addMessage, 'تمت إضافة المنتج رقم ' + created.id + ' بنجاح.');
    await loadProducts();
    addPanel.hidden = true;
  } catch {
    if (uploadedPath && !committed) {
      await client.storage.from('catalog-images').remove([uploadedPath]);
    }
    message(addMessage, 'تعذر إضافة المنتج. راجع البيانات والاتصال ثم حاول مرة أخرى.', true);
  } finally {
    button.disabled = false;
  }
});

function safeImage(src) {
  try {
    const u = new URL(src, location.origin);
    return u.origin === location.origin || u.origin === cfg.url
      ? u.href
      : '/assets/logo.png';
  } catch {
    return '/assets/logo.png';
  }
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();

  const f = e.currentTarget;
  const button = f.querySelector('button');
  button.disabled = true;
  message(statusEl, 'جاري تسجيل الدخول…');

  try {
    const entered = f.elements.username.value.trim().normalize('NFKC').toLowerCase();
    const username = entered === 'نورا' ? 'noura' : entered;

    if (!/^[a-z0-9][a-z0-9._-]{2,49}$/.test(username)) {
      throw Error('invalid username');
    }

    check(await client.auth.signInWithPassword({
      email: username + '@users.noura.invalid',
      password: f.elements.password.value
    }));

    f.elements.password.value = '';
    message(statusEl, '');
    await showSession();
  } catch {
    message(statusEl, 'تعذر الدخول. راجع اسم المستخدم وكلمة السر.', true);
  } finally {
    button.disabled = false;
  }
});

async function logout() {
  try {
    check(await client.auth.signOut());
    currentUser = null;
    document.getElementById('editor').replaceChildren();
    addForm.reset();
    addPanel.hidden = true;
    message(addMessage, '');
    message(statusEl, '');
    await showSession();
  } catch {
    message(statusEl, 'تعذر تسجيل الخروج. حاول مرة أخرى.', true);
  }
}

document.getElementById('logout').onclick = logout;
document.getElementById('denied-logout').onclick = logout;

client.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT') {
    document.getElementById('workspace').hidden = true;
    adminTopbar.hidden = true;
    document.getElementById('editor').replaceChildren();
    document.getElementById('login').hidden = false;
    document.getElementById('denied').hidden = true;
  }
});

showSession();
