// Fills the room-rate cards on the home and rooms pages from the database (js/data.js), so prices are edited in one place.
(function(){
  const el=document.querySelectorAll('[data-rooms]');
  if(!el.length||typeof TYPES==='undefined')return;
  const peso=n=>'₱'+Number(n).toLocaleString('en-PH');
  const blurb={std:['Queen bed, air-conditioning, Wi-Fi','Private bathroom with hot shower'],dlx:['King bed with city or garden view','Seating area and work desk'],fam:['Two bedrooms with a shared living area','Best for families and small groups']};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  ready.then(()=>{
    const html=TYPES.map(t=>`<div class="col-md-4"><div class="pricing_box room_box">
      <div class="pricing_box_ti"><h3>${peso(t.price)}<strong>/ night</strong></h3></div>
      <div class="our_pricing"><span>${esc(t.name)}</span><p>Up to ${t.max} guests</p><ul>${(blurb[t.id]||[]).map(x=>`<li>${x}</li>`).join('')}</ul></div></div>
      <a class="read_more mar_top" href="book.html">Book Now</a></div>`).join('');
    el.forEach(e=>e.innerHTML=html);
    document.querySelectorAll('[data-locs]').forEach(e=>e.textContent=LOCS.join(', '));
  });
})();
