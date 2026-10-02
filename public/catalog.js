(async()=>{
 const grid=document.querySelector('.grid');
 const status=document.getElementById('catalog-status');
 try {
 const c=window.CATALOG_CONFIG;
 const r=await fetch(c.url+'/rest/v1/catalog_products?select=id,name,pack,price,image&order=id',{headers:{apikey:c.key},cache:'no-store'});
 if(!r.ok)throw Error();
 const rows=await r.json();
 const frag=document.createDocumentFragment();
 for(const p of rows){
 const article=document.createElement('article');article.className='product';
 article.innerHTML='<div class="photo"><span class="number"></span><img width="300" height="300" loading="lazy"></div><div class="details"><h2></h2><div class="pricing"><div><span class="label">السعر</span><strong></strong></div><div class="pack"><span class="label">عدد العبوة</span><b></b></div></div></div>';
 article.querySelector('.number').textContent=String(p.id).padStart(2,'0');
 article.querySelector('h2').textContent=p.name;
 article.querySelector('strong').textContent=Number(p.price).toLocaleString('en-US',{maximumFractionDigits:2});
 article.querySelector('b').textContent=p.pack;
 const img=article.querySelector('img');img.alt=p.name;
 img.src=safeImage(p.image);img.onerror=()=>{img.onerror=null;img.src='/assets/product-'+p.id+'.png';};
 frag.append(article);
 }
 grid.replaceChildren(frag);document.querySelector('.count').textContent=rows.length+' صنف';
 status.textContent='';
 }catch{status.textContent='تعذر تحميل آخر تحديث للأسعار. المعروض حاليًا هو قائمة سبتمبر 2026؛ حاول تحديث الصفحة.';}
 function safeImage(src){try{const u=new URL(src,location.origin);return u.origin===location.origin||u.origin===window.CATALOG_CONFIG.url?u.href:'/assets/logo.png';}catch{return '/assets/logo.png';}}
})();
