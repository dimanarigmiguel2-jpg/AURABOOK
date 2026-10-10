// data functions: replace the bodies below with calls to your database

const LOCS=['Manila','Cebu','Tagaytay'];
const TYPES=[{id:'std',name:'Standard Room',max:2,price:2500,stock:5},{id:'dlx',name:'Deluxe Room',max:3,price:4200,stock:3},{id:'fam',name:'Family Suite',max:5,price:7000,stock:2}];
const ADDONS=[{id:'bf',name:'Breakfast (per guest / night)',price:350,per:'gn'},{id:'ap',name:'Airport pickup',price:800,per:'once'},{id:'spa',name:'Spa session',price:1200,per:'once'}];
const MAXOCC=Math.max(...TYPES.map(t=>t.max)), VAT=.12;

const mem={users:[],bookings:[],session:null};
const load=()=>{try{const d=JSON.parse(localStorage.getItem('aura')||'null');if(d)Object.assign(mem,d)}catch(e){}};
const save=()=>{try{localStorage.setItem('aura',JSON.stringify(mem))}catch(e){}};
load();

const hash=s=>{let h=5381;for(const c of s)h=(h*33)^c.charCodeAt(0);return (h>>>0).toString(36)};

const currentUser=()=>mem.users.find(u=>u.email===mem.session)||null;
const findUser=email=>mem.users.find(u=>u.email===email)||null;
const addUser=u=>{mem.users.push(u);save()};
const verifyUser=email=>{findUser(email).verified=true;save()};
const setSession=email=>{mem.session=email;save()};

const getBookings=()=>mem.bookings;
const addBooking=b=>{mem.bookings.push(b);save()};
const updateBooking=(ref,changes)=>{Object.assign(mem.bookings.find(b=>b.ref===ref),changes);save()};

function free(loc,type,from,to){
  const used=mem.bookings.filter(b=>b.loc===loc&&b.type===type&&b.status!=='closed'&&b.from<to&&from<b.to).length;
  return TYPES.find(t=>t.id===type).stock-used;
}
const ready=Promise.resolve();
