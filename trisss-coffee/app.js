/*********************** السلة (تخزين محلي) ************************/
const CART_KEY = "trisss_cart_v1";
const loadCart  = () => JSON.parse(localStorage.getItem(CART_KEY) || "[]");
const saveCart  = (c) => localStorage.setItem(CART_KEY, JSON.stringify(c));

function updateCartBadge(){
  const count = loadCart().reduce((n,i)=> n + (i.qty||1), 0);
  document.querySelectorAll("[data-cart-badge]").forEach(b => b.textContent = count);
}

function toast(msg="أُضيف للسلّة"){
  const el = document.getElementById("toast");
  if(!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(()=> el.classList.remove("show"), 1000);
}

function addToCart(id){
  const p = (window.PRODUCTS || []).find(x => x.id === id);
  if(!p) return alert("المنتج غير موجود");
  const cart = loadCart();
  const found = cart.find(i => i.id === id);
  found ? found.qty++ : cart.push({ id:p.id, name:p.name, price:p.price, qty:1 });
  saveCart(cart);
  updateCartBadge();
  toast(`أُضيف: ${p.name}`);
}

/******************** بطاقة المنتج ********************/
function productCard(p){
  const img = p.img || "https://picsum.photos/500/400?random=1";
  const badge = p.best ? `<span class="pill-badge">الأكثر مبيعًا ⭐</span>` : "";
  return `
    <article class="product-card">
      ${badge}
      <img src="${img}" alt="${p.name}" onerror="this.src='https://picsum.photos/500/400?random=2'">
      <div class="content">
        <div class="name">${p.name}</div>
        <div class="price">${p.price} ريال</div>
        <button class="btn" onclick="addToCart('${p.id}')">أضف للسلة</button>
      </div>
    </article>`;
}

/********************* رسم الشبكات + الفلترة *********************/
function renderListToGrid(list, idGrid){
  const grid = document.getElementById(idGrid);
  if(!grid) return;
  grid.innerHTML = list.map(productCard).join("");
}

/* استثني best من الشبكة الرئيسية فقط */
function renderProducts(filterCat="all", excludeBest=true){
  const title = document.getElementById("productsTitle");
  let list = (window.PRODUCTS || []);

  if (filterCat !== "all") {
    list = list.filter(p => p.cat === filterCat);
    excludeBest = false; // داخل تصنيف معين نعرض الكل
  } else if (excludeBest) {
    list = list.filter(p => !p.best);
  }

  if (title) title.textContent = (filterCat==="all") ? "كل المنتجات" : `منتجات ${filterCat}`;
  renderListToGrid(list, "productGrid");
}

function renderByCategory(cat, containerId){
  const data = (window.PRODUCTS || []).filter(p => p.cat === cat);
  renderListToGrid(data, containerId);
}

/* صف "الأكثر مبيعًا" المصغّر */
function renderPopular(){
  const row = document.getElementById("popularRow");
  if(!row) return;
  const popular = (window.PRODUCTS || []).filter(p => p.best);
  if (!popular.length){
    row.previousElementSibling?.remove();
    row.remove();
    return;
  }
  row.innerHTML = popular.map(productCard).join("");
}

/**************** بطاقات التصنيف الكبيرة ****************/
function setupCategoryCards(){
  const cards = document.querySelectorAll(".cat-card");
  if(!cards.length) return;

  function activate(cat, clickedBtn){
    cards.forEach(c => c.classList.toggle("active", c === clickedBtn));
    const url = new URL(window.location);
    url.hash = `cat=${encodeURIComponent(cat)}`;
    history.replaceState(null, "", url);
    renderProducts(cat, false); // لا نستثني best داخل التصنيف
    document.getElementById('productGrid')?.scrollIntoView({behavior:'smooth', block:'start'});
  }

  cards.forEach(btn => btn.addEventListener("click", () =>
    activate(btn.dataset.cat || "all", btn)
  ));

  // طبّق الهاش إن وُجد
  const hash = location.hash.slice(1);
  const initial = (hash.startsWith("cat=")) ? decodeURIComponent(hash.split("=")[1]) : "all";
  const target = [...cards].find(c => (c.dataset.cat||"all") === initial);
  target ? target.click() : renderProducts("all", true);
}

/********************** إنستغرام (اختياري) ***********************/
function openInstagram(){
  const username = "trisss_sa"; // عدّليه لو اسم مختلف
  const appUrl = `instagram://user?username=${username}`;
  const webUrl = `https://instagram.com/${username}`;
  const t = Date.now();
  window.location = appUrl;
  setTimeout(()=>{ if(Date.now()-t < 1500) window.location = webUrl; }, 800);
}
window.openInstagram = openInstagram;

/********************* أدوات السلة ************************/
function cartTotal(){
  return loadCart().reduce((sum,i)=> sum + (i.price * (i.qty||1)), 0);
}
function sar(n){ return `${n.toLocaleString('ar-SA')} ريال`; }

/************* فتح/إغلاق *************/
function openCart(){
  document.getElementById('cartOverlay').hidden = false;
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartDrawer').setAttribute('aria-hidden','false');
  renderCart();
}
function closeCart(){
  document.getElementById('cartOverlay').hidden = true;
  document.getElementById('cartDrawer').classList.remove('open');
  document.getElementById('cartDrawer').setAttribute('aria-hidden','true');
}
window.openCart = openCart;
window.closeCart = closeCart;

/************* تعديل الكمية/الحذف *************/
function changeQty(id, delta){
  const cart = loadCart();
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty = Math.max(1, (item.qty||1) + delta);
  saveCart(cart); updateCartBadge(); renderCart();
}
function removeItem(id){
  let cart = loadCart();
  cart = cart.filter(i => i.id !== id);
  saveCart(cart); updateCartBadge(); renderCart();
}

/************* عرض السلة *************/
function renderCart(){
  const listEl = document.getElementById('cartList');
  const totalEl = document.getElementById('cartTotal');
  const cart = loadCart();

  if(!cart.length){
    listEl.innerHTML = `<div class="cart-empty">السلة فارغة 🌸</div>`;
    totalEl.textContent = sar(0);
    return;
  }

  listEl.innerHTML = cart.map(i => {
    const p = (window.PRODUCTS || []).find(x => x.id === i.id) || {};
    const img = p.img || "https://picsum.photos/100/100?random=3";
    const qty = i.qty || 1;
    return `
      <div class="cart-item">
        <img src="${img}" alt="${i.name}">
        <div>
          <div class="name">${i.name}</div>
          <div class="price">${sar(i.price)}</div>
        </div>
        <div class="qty">
          <button onclick="changeQty('${i.id}', -1)">−</button>
          <span class="num">${qty}</span>
          <button onclick="changeQty('${i.id}', 1)">+</button>
          <button class="remove-btn" onclick="removeItem('${i.id}')">🗑️</button>
        </div>
      </div>
    `;
  }).join("");

  totalEl.textContent = sar(cartTotal());
}

/*********************** تهيئة الصفحة ********************/
document.addEventListener("DOMContentLoaded", ()=>{
  // زر تصفّح إلى التصنيفات
  document.getElementById("browseBtn")?.addEventListener("click", ()=>{
    document.getElementById("categories")?.scrollIntoView({behavior:'smooth'});
  });

  // المنتجات + الأكثر مبيعًا + التصنيفات
  if (document.getElementById("productGrid")) {
    renderProducts("all", true);  // استثني best من الشبكة الرئيسية
    renderPopular();               // صف أفقي مصغّر للأكثر مبيعًا
    setupCategoryCards();
  }

  updateCartBadge();

  // فتح/إغلاق السلة (وفي الـ HTML مسويين onclick كـ fallback)
  const cartBtn = document.getElementById("cartBtn");
  cartBtn?.addEventListener("click", (e)=>{ e.preventDefault(); openCart(); });
  document.getElementById("cartCloseBtn")?.addEventListener("click", closeCart);
  document.getElementById("cartOverlay")?.addEventListener("click", closeCart);

  // زر إتمام الطلب بالواتساب
  document.getElementById("checkoutBtn")?.addEventListener("click", ()=>{
    const phone = "966534245696";
    const cart = loadCart();
    if(!cart.length){ alert("السلة فارغة"); return; }
    const lines = cart.map(i => `• ${i.name} × ${i.qty||1} = ${i.price*(i.qty||1)} ريال`);
    const msg =
`مرحبًا TRISS 🌸
أرغب بتأكيد هذا الطلب:
${lines.join('\n')}
— — —
الإجمالي: ${cartTotal()} ريال
الاسم:
الموقع/الحي:
ملاحظات:`;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
  });

  // Esc لإغلاق السلة
  document.addEventListener("keydown", (e)=>{ if(e.key === "Escape") closeCart(); });
});
