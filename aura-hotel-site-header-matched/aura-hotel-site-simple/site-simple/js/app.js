const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const peso=n=>'₱'+Number(n).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
const ymd=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const addDays=(d,n)=>{const x=new Date(d+'T00:00');x.setDate(x.getDate()+n);return ymd(x)};
const today=()=>ymd(new Date());
const PAGE=document.body.dataset.page||'book';
function toast(m,ms=6000){const t=$('#toast');t.textContent=m;t.style.display='block';clearTimeout(toast.h);toast.h=setTimeout(()=>t.style.display='none',ms)}
function price(S){
  const t=TYPES.find(x=>x.id===S.room),n=S.q.days,g=S.q.guests;
  let sub=t.price*n;
  const lines=[[`${t.name} × ${n} night(s)`,t.price*n]];
  S.addons.forEach(id=>{const a=ADDONS.find(x=>x.id===id),c=a.per==='gn'?a.price*g*n:a.price;sub+=c;lines.push([a.name,c])});
  const tax=sub*VAT;return{lines,sub,tax,total:sub+tax};
}

let view='book';
let S={step:1,q:{loc:LOCS[0],date:addDays(today(),1),time:'14:00',days:1,guests:2},room:null,addons:[],err:'',acct:'ask',pending:null,code:null,pay:'card',ref:null,tries:0};
const STEPS=['Search','Rooms','Review','Payment','Done'];

function logout(){setSession(null);render()}
function render(){PAGE==='office'?(isAdmin()?renderOffice():renderAdminLogin()):renderBook()}
function isAdmin(){return sessionStorage.getItem('aura_admin_auth')==='yes'}
function adminLogin(){const email=($('#admin_email')||{}).value||'',pw=($('#admin_pw')||{}).value||'';if(email.trim().toLowerCase()==='admin@aura.local'&&pw==='AuraAdmin2026!'){sessionStorage.setItem('aura_admin_auth','yes');renderOffice()}else{const e=$('#admin_error');if(e)e.textContent='Invalid admin email or password.'}}
function adminLogout(){sessionStorage.removeItem('aura_admin_auth');renderAdminLogin()}
function renderAdminLogin(){$('#app').innerHTML=`<div class="card admin-login"><h2>Administrator Login</h2><p class="mute">This area is reserved for hotel administrators.</p><label for="admin_email">Admin email</label><input id="admin_email" type="email" autocomplete="username" placeholder="Admin email"><label for="admin_pw">Password</label><input id="admin_pw" type="password" autocomplete="current-password" placeholder="Password"><p id="admin_error" class="err"></p><div class="row" style="margin-top:12px"><button onclick="adminLogin()">Sign in</button><a class="btn ghost" href="index.html">Back to website</a></div><p class="mute" style="margin-top:16px">Administrator access only.</p></div>`}
function renderBook(){
  const bar=`<div class="steps">${STEPS.map((n,i)=>`<div class="${i+1===S.step?'on':i+1<S.step?'done':''}">${i+1}. ${n}</div>`).join('')}</div>`;
  const err=S.err?`<div class="err">${esc(S.err)}</div>`:'';
  const u=currentUser();
  const who=u?`<p class="mute who">Signed in as ${esc(u.name)} · <a href="#" onclick="logout();return false">Log out</a></p>`:'';
  $('#app').innerHTML=who+bar+[,step1,step2,step4,step5,step6][S.step]()+'';
  if(S.err){const c=document.querySelector('.card');if(c)c.insertAdjacentHTML('beforeend',err)}
}
const setStep=n=>{S.step=n;S.err='';render();scrollTo(0,0)};
const val=id=>$('#'+id).value;

function step1(){const q=S.q;return `<div class="card"><h2>Find your stay</h2>
 <div class="grid">
 <div><label>Hotel location</label><select id="loc">${LOCS.map(l=>`<option ${l===q.loc?'selected':''}>${l}</option>`).join('')}</select></div>
 <div><label>Check-in date</label><input type="date" id="date" min="${today()}" value="${q.date}"></div>
 <div><label>Check-in time</label><input type="time" id="time" value="${q.time}"></div>
 <div><label>Days of stay</label><input type="number" id="days" min="1" max="30" value="${q.days}"></div>
 <div><label>Number of guests</label><input type="number" id="guests" min="1" value="${q.guests}"></div></div>
 <p class="mute">Maximum occupancy per room is ${MAXOCC} guests.</p>
 <button onclick="search()">Search rooms</button></div>`}
function search(){
  const q={loc:val('loc'),date:val('date'),time:val('time'),days:+val('days'),guests:+val('guests')};
  S.q=q;
  if(!q.date||q.date<today()){S.err='Pick a valid check-in date.';return render()}
  if(!q.time){S.err='Pick a check-in time.';return render()}
  if(!(q.days>=1)){S.err='Enter days of stay (at least 1).';return render()}
  if(!(q.guests>=1)||q.guests>MAXOCC){S.err=`Number of guests must be between 1 and ${MAXOCC} (max occupancy). Please re-enter.`;return render()}
  const to=addDays(q.date,q.days);
  const ok=TYPES.some(t=>t.max>=q.guests&&free(q.loc,t.id,q.date,to)>0);
  if(!ok){S.err='No rooms available for those dates. Try different days of stay or another date.';return render()}
  S.room=null;S.addons=[];setStep(2);
}

function step2(){const q=S.q,to=addDays(q.date,q.days);
 const list=TYPES.filter(t=>t.max>=q.guests).map(t=>{const f=free(q.loc,t.id,q.date,to);
  return `<div class="room ${S.room===t.id?'sel':''}"><div><strong>${t.name}</strong><div class="mute">Up to ${t.max} guests · ${f} left</div></div>
  <div class="row" style="gap:14px"><strong>${peso(t.price)}<span class="mute"> /night</span></strong>
  <button ${f<1?'disabled':''} onclick="S.room='${t.id}';render()">${S.room===t.id?'Selected':f<1?'Sold out':'Select'}</button></div></div>`}).join('');
 return `<div class="card"><h2>${esc(q.loc)} · ${q.date} to ${to}</h2>${list}
 <h2 style="margin-top:18px">Add-ons</h2>${ADDONS.map(a=>`<label class="chk"><input type="checkbox" ${S.addons.includes(a.id)?'checked':''} onchange="toggleAdd('${a.id}')">${a.name}. ${peso(a.price)}</label>`).join('')}
 <div class="row" style="margin-top:14px"><button class="ghost" onclick="setStep(1)">Back</button><button ${S.room?'':'disabled'} onclick="setStep(3)">Continue</button></div></div>`}
function toggleAdd(id){S.addons=S.addons.includes(id)?S.addons.filter(x=>x!==id):[...S.addons,id]}
function toAccount(){
  S.acct='ask';S.pending=null;S.code=null;setStep(currentUser()?4:3)}

function step3(){
  if(S.code)return `<div class="card"><h2>Verify your account</h2><p class="mute">We sent a 6-digit code to ${esc(S.pending.email)} (demo: shown on screen).</p>
   <label>Verification code</label><input id="code" inputmode="numeric" maxlength="6"><div class="row" style="margin-top:12px"><button class="ghost" onclick="S.code=null;render()">Cancel</button><button onclick="verify()">Verify</button></div></div>`;
  if(S.acct==='ask')return `<div class="card"><h2>Do you have an account?</h2><div class="row"><button onclick="S.acct='login';render()">Yes, log in</button><button class="ghost" onclick="S.acct='reg';render()">No, register</button></div></div>`;
  if(S.acct==='login')return `<div class="card"><h2>Log in</h2><label>Email</label><input id="em" type="email"><label>Password</label><input id="pw" type="password">
   <div class="row" style="margin-top:12px"><button class="ghost" onclick="S.acct='ask';render()">Back</button><button onclick="login()">Log in</button></div></div>`;
  return `<div class="card"><h2>Register new account</h2><label>Full name</label><input id="nm"><label>Email</label><input id="em" type="email"><label>Phone</label><input id="ph" type="tel"><label>Password (min 6)</label><input id="pw" type="password">
   <div class="row" style="margin-top:12px"><button class="ghost" onclick="S.acct='ask';render()">Back</button><button onclick="register()">Register</button></div></div>`}
function sendCode(u){S.pending=u;S.code=String(Math.floor(100000+Math.random()*900000));S.err='';render();toast('Demo email: your verification code is '+S.code,12000)}
function login(){
  const u=findUser(val('em').trim().toLowerCase());
  if(!u||u.pw!==hash(val('pw'))){S.err='Wrong email or password.';return render()}
  u.verified?(setSession(u.email),setStep(4)):sendCode(u)}
function register(){
  const u={name:val('nm').trim(),email:val('em').trim().toLowerCase(),phone:val('ph').trim(),pw:hash(val('pw')),verified:false};
  if(!u.name||!/^\S+@\S+\.\S+$/.test(u.email)||u.phone.length<7||val('pw').length<6){S.err='Fill in all fields correctly (valid email, phone, 6+ char password).';return render()}
  if(findUser(u.email)){S.err='That email already has an account, choose "Yes, log in".';return render()}
  addUser(u);sendCode(u)}
function verify(){
  if(val('code')!==S.code){S.err='Incorrect code.';S.acct='ask';S.code=null;return render()}
  verifyUser(S.pending.email);setSession(S.pending.email);$('#toast').style.display='none';setStep(4)}

function step4(){const u=currentUser()||{name:'',phone:''},p=price(S),q=S.q;
 return `<div class="card"><h2>Confirm guest details</h2><div class="grid">
 <div><label>Lead guest</label><input id="gn" value="${esc(u.name)}"></div><div><label>Phone</label><input id="gp" value="${esc(u.phone)}"></div></div>
 <p class="mute">${esc(q.loc)} · check-in ${q.date} ${q.time} · ${q.days} night(s) · ${q.guests} guest(s)</p></div>
 <div class="card"><h2>Price, taxes &amp; terms</h2><table class="tot">${p.lines.map(l=>`<tr><td>${esc(l[0])}</td><td style="text-align:right">${peso(l[1])}</td></tr>`).join('')}
 <tr><td>Subtotal</td><td style="text-align:right">${peso(p.sub)}</td></tr><tr><td>VAT (12%)</td><td style="text-align:right">${peso(p.tax)}</td></tr><tr><td>Total</td><td style="text-align:right">${peso(p.total)}</td></tr></table>
 <label class="chk"><input type="checkbox" id="terms">I accept the booking terms: free cancellation up to 48 hours before check-in; no-show is charged the first night.</label>
 <div class="row" style="margin-top:12px"><button class="ghost" onclick="setStep(2)">Back</button><button onclick="toPay()">Proceed to payment</button></div></div>`}
function toPay(){
  if(!val('gn').trim()||val('gp').trim().length<7){S.err='Guest name and phone are required.';return render()}
  if(!$('#terms').checked){S.err='Please accept the terms to continue.';return render()}
  S.guest={name:val('gn').trim(),phone:val('gp').trim()};setStep(4)}

function step5(){const p=price(S);
 return `<div class="card"><h2>Processing area · Pay ${peso(p.total)}</h2>
 <label>Payment method</label><select id="pm" onchange="S.pay=this.value;render()"><option value="card" ${S.pay==='card'?'selected':''}>Credit / debit card</option><option value="gcash" ${S.pay==='gcash'?'selected':''}>GCash</option></select>
 ${S.pay==='card'?`<label>Card number</label><input id="cn" inputmode="numeric" placeholder="4242 4242 4242 4242"><div class="grid"><div><label>Expiry (MM/YY)</label><input id="ex" placeholder="08/29"></div><div><label>CVV</label><input id="cv" inputmode="numeric" maxlength="4"></div></div>`
  :`<label>GCash mobile number</label><input id="gc" inputmode="numeric" placeholder="09XXXXXXXXX">`}
 <p class="mute">Demo only: no real payment is made, so do not enter real card details. A card or GCash number ending in 0000 is declined.</p>
 <div class="row" style="margin-top:12px"><button class="ghost" onclick="setStep(3)">Back</button><button id="paybtn" onclick="pay()">Pay now</button></div></div>`}
function validPay(){
  if(S.pay==='card'){
    const n=val('cn').replace(/\s/g,''),m=val('ex').match(/^(\d\d)\/(\d\d)$/),c=val('cv');
    if(!/^\d{16}$/.test(n))return'Card number must be 16 digits.';
    if(!m||+m[1]<1||+m[1]>12||new Date(2000+ +m[2],+m[1],0)<new Date())return'Card expiry is invalid or past.';
    if(!/^\d{3,4}$/.test(c))return'CVV must be 3 or 4 digits.';
    S.last=n.slice(-4);return''}
  const g=val('gc');if(!/^09\d{9}$/.test(g))return'Enter a valid 11-digit GCash number starting with 09.';
  S.last=g.slice(-4);return''}
function pay(){
  const e=validPay();if(e){S.err=e;return render()}
  const b=$('#paybtn');b.disabled=true;b.textContent='Contacting payment gateway...';
  setTimeout(()=>{
    if(S.last==='0000'){S.err='Payment declined. Choose a payment method and try again.';return render()}
    finish()},1400)}

function finish(){
  const p=price(S),q=S.q,u=currentUser()||{email:S.guest.email||'guest'};
  const ref='AB-'+Date.now().toString(36).toUpperCase().slice(-6);
  addBooking({ref,email:u.email,guest:S.guest.name,phone:S.guest.phone,loc:q.loc,type:S.room,from:q.date,to:addDays(q.date,q.days),time:q.time,guests:q.guests,addons:S.addons,total:p.total,pay:S.pay,status:'received',roomNo:null,created:new Date().toISOString()});
  S.ref=ref;S.total=p.total;setStep(5);
  toast(`Booking ${ref} confirmed.`,8000)}
function step6(){return `<div class="card"><h2 class="ok">Booking confirmed</h2><p>Reference: <strong>${esc(S.ref)}</strong></p><p>Total paid: ${peso(S.total)}</p>
 <p class="mute">A confirmation email was sent. The hotel team has received your booking.</p>
 <div class="row"><button onclick="reset()">Make another booking</button></div></div>`}
function reset(){S={...S,step:1,room:null,addons:[],err:'',ref:null};render()}

const NEXT={received:['Assign room','assigned'],assigned:['Guest check-in','checked-in'],'checked-in':['Check-out, close','closed']};
function renderOffice(){
  const rows=[...getBookings()].reverse().map(b=>{const t=TYPES.find(x=>x.id===b.type),n=NEXT[b.status];
   return `<tr><td>${esc(b.ref)}</td><td>${esc(b.guest)}</td><td>${esc(b.loc)}<br><span class="mute">${t.name}${b.roomNo?' · Room '+b.roomNo:''}</span></td><td>${b.from} to ${b.to}</td><td><span class="badge">${b.status}</span></td>
   <td>${n?`<button onclick="advance('${b.ref}')">${n[0]}</button>`:'<span class="mute">Closed</span>'}</td></tr>`}).join('');
  const inv=LOCS.map(l=>`<tr><td>${l}</td>${TYPES.map(t=>`<td>${free(l,t.id,today(),addDays(today(),1))} / ${t.stock}</td>`).join('')}</tr>`).join('');
  $('#app').innerHTML=`<div class="admin-toolbar"><span>Signed in as administrator</span><button class="ghost" onclick="adminLogout()">Log out</button></div><div class="card"><h2>Bookings received</h2><div class="wrap"><table><tr><th>Ref</th><th>Guest</th><th>Room</th><th>Stay</th><th>Status</th><th></th></tr>${rows||'<tr><td colspan="6" class="mute">No bookings yet.</td></tr>'}</table></div></div>
  <div class="card"><h2>Room availability tonight</h2><div class="wrap"><table><tr><th>Location</th>${TYPES.map(t=>`<th>${t.name}</th>`).join('')}</tr>${inv}</table></div></div>`}
function advance(ref){
  const b=getBookings().find(x=>x.ref===ref);
  if(b.status==='received'){
    const taken=getBookings().filter(x=>x!==b&&x.loc===b.loc&&x.type===b.type&&x.roomNo&&x.status!=='closed'&&x.from<b.to&&b.from<x.to).map(x=>x.roomNo);
    const base={std:100,dlx:200,fam:300}[b.type];
    for(let i=1;i<=TYPES.find(t=>t.id===b.type).stock;i++)if(!taken.includes(base+i)){b.roomNo=base+i;break}
  }
  b.status=NEXT[b.status][1];updateBooking(ref,{status:b.status,roomNo:b.roomNo});renderOffice()}
render();
