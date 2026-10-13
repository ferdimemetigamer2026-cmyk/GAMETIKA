const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const { Server } = require('socket.io');

const app=express(), server=http.createServer(app), io=new Server(server);
const PORT=process.env.PORT||3000, DATA=path.join(__dirname,'data');
const UPLOAD=path.join(__dirname,'public','media'), AVATARS=path.join(__dirname,'public','avatars');
fs.mkdirSync(DATA,{recursive:true});fs.mkdirSync(UPLOAD,{recursive:true});fs.mkdirSync(AVATARS,{recursive:true});
const dbPath=path.join(DATA,'database.json');
if(!fs.existsSync(dbPath))fs.writeFileSync(dbPath,JSON.stringify({users:[],videos:[],friends:[],messages:[],publicMessages:[]},null,2));
function db(){try{const d=JSON.parse(fs.readFileSync(dbPath,'utf8'));d.comments=d.comments||[];d.follows=d.follows||[];d.users=d.users||[];d.videos=d.videos||[];d.friends=d.friends||[];d.messages=d.messages||[];d.publicMessages=d.publicMessages||[];return d}catch{return {users:[],videos:[],friends:[],messages:[],publicMessages:[],comments:[],follows:[]}}}
function save(d){const tmp=dbPath+'.tmp';fs.writeFileSync(tmp,JSON.stringify(d,null,2));fs.renameSync(tmp,dbPath)}
const clean=(v,n)=>String(v||'').replace(/[<>]/g,'').trim().slice(0,n);
const publicUser=u=>({id:u.id,username:u.username,displayName:u.displayName,bio:u.bio||'',avatar:u.avatar||'',role:u.role||'member'});
const sessionMiddleware=session({store:new SQLiteStore({dir:DATA,db:'sessions.sqlite'}),secret:process.env.SESSION_SECRET||'CHANGE_THIS_LONG_RANDOM_SECRET_BEFORE_DEPLOYING',resave:false,saveUninitialized:false,cookie:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:7*24*60*60*1000}});
app.use((req, res, next) => {
  const allowedOrigin = 'https://gametikavision.netlify.app';

  if (req.headers.origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type'
    );
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, OPTIONS'
    );
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});app.use(sessionMiddleware);io.engine.use(sessionMiddleware);app.use(express.json({limit:'1mb'}));app.use(express.static(path.join(__dirname,'public')));
const videoExt=new Set(['.mp4','.webm','.mov','.zip','.7z','.png','.jpg','.jpeg']);
function storageTo(dir){return multer.diskStorage({destination:(_r,_f,cb)=>cb(null,dir),filename:(_r,f,cb)=>cb(null,crypto.randomBytes(16).toString('hex')+path.extname(f.originalname).toLowerCase())})}
const upload=multer({storage:storageTo(UPLOAD),limits:{fileSize:500*1024*1024},fileFilter:(_r,f,cb)=>videoExt.has(path.extname(f.originalname).toLowerCase())?cb(null,true):cb(new Error('Dateiformat nicht erlaubt.'))});
const avatarUpload=multer({storage:storageTo(AVATARS),limits:{fileSize:3*1024*1024},fileFilter:(_r,f,cb)=>['image/jpeg','image/png','image/webp'].includes(f.mimetype)?cb(null,true):cb(new Error('Profilbild muss JPG, PNG oder WebP sein.'))});
function auth(req,res,next){const d=db(),u=d.users.find(x=>x.id===req.session.userId);if(!u)return res.status(401).json({error:'Bitte zuerst anmelden.'});if(u.disabled)return res.status(403).json({error:'Dieses Konto ist gesperrt.'});req.user=u;next()}
function admin(req,res,next){auth(req,res,()=>req.user.role==='admin'?next():res.status(403).json({error:'Nur Administratoren dürfen diese Aktion ausführen.'}))}
function friendship(d,a,b){return d.friends.find(f=>(f.a===a&&f.b===b)||(f.a===b&&f.b===a))}
function friendStatus(d,a,b){const f=friendship(d,a,b);if(!f)return 'none';if(f.status==='accepted')return 'friends';return f.from===a?'sent':'received'}
function publicVideo(v,viewerId=null){const d=db();return {id:v.id,title:v.title,description:v.description,filename:v.filename,url:v.url,sizeLabel:v.sizeLabel,ownerId:v.ownerId,ownerName:v.ownerName,createdAt:v.createdAt,likes:(v.likedBy||[]).length,liked:!!viewerId&&(v.likedBy||[]).includes(viewerId),commentCount:d.comments.filter(c=>c.videoId===v.id).length}}
function time(){return new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'})}
app.get('/api/me',(req,res)=>{if(!req.session.userId)return res.status(401).json({error:'Nicht angemeldet.'});const u=db().users.find(x=>x.id===req.session.userId);if(!u||u.disabled){req.session.destroy(()=>{});return res.status(401).json({error:'Nicht angemeldet.'})}const d=db();res.json({user:{...publicUser(u),followersCount:(d.follows||[]).filter(f=>f.to===u.id).length,followingCount:(d.follows||[]).filter(f=>f.from===u.id).length}})});
app.post('/api/register',async(req,res)=>{try{const username=clean(req.body.username,24).toLowerCase(),displayName=clean(req.body.displayName,40),password=String(req.body.password||'');if(!/^[a-z0-9_]{3,24}$/.test(username))return res.status(400).json({error:'Benutzername: 3–24 Zeichen, nur Buchstaben, Zahlen und _.'});if(displayName.length<2)return res.status(400).json({error:'Bitte einen Anzeigenamen mit mindestens 2 Zeichen eingeben.'});if(password.length<8)return res.status(400).json({error:'Das Passwort muss mindestens 8 Zeichen lang sein.'});const d=db();if(d.users.some(u=>u.username===username))return res.status(409).json({error:'Dieser Benutzername ist bereits vergeben.'});const u={id:crypto.randomUUID(),username,displayName,passwordHash:await bcrypt.hash(password,12),bio:'',avatar:'',role:'member',disabled:false,createdAt:new Date().toISOString()};d.users.push(u);save(d);req.session.userId=u.id;res.status(201).json({user:publicUser(u)});}catch(e){res.status(500).json({error:'Registrierung fehlgeschlagen.'})}});
app.post('/api/login',async(req,res)=>{const username=clean(req.body.username,24).toLowerCase(),password=String(req.body.password||''),d=db(),u=d.users.find(x=>x.username===username);if(!u||!await bcrypt.compare(password,u.passwordHash))return res.status(401).json({error:'Benutzername oder Passwort falsch.'});if(u.disabled)return res.status(403).json({error:'Dieses Konto ist gesperrt.'});req.session.regenerate(err=>{if(err)return res.status(500).json({error:'Login fehlgeschlagen.'});req.session.userId=u.id;res.json({user:publicUser(u)})})});
app.post('/api/logout',(req,res)=>req.session.destroy(()=>{res.clearCookie('connect.sid');res.json({ok:true})}));
app.post('/api/profile',auth,(req,res)=>avatarUpload.single('avatar')(req,res,err=>{if(err)return res.status(400).json({error:err.message});const d=db(),u=d.users.find(x=>x.id===req.user.id);u.displayName=clean(req.body.displayName,40)||u.displayName;u.bio=clean(req.body.bio,300);if(req.file)u.avatar='/avatars/'+req.file.filename;save(d);res.json({user:publicUser(u)})}));
app.get('/api/members',auth,(req,res)=>{const d=db();res.json({members:d.users.filter(u=>u.id!==req.user.id&&!u.disabled).map(u=>({...publicUser(u),friendStatus:friendStatus(d,req.user.id,u.id),isFollowing:d.follows.some(f=>f.from===req.user.id&&f.to===u.id),followersCount:d.follows.filter(f=>f.to===u.id).length,followingCount:d.follows.filter(f=>f.from===u.id).length}))})});
app.post('/api/follow/:id',auth,(req,res)=>{const id=String(req.params.id),d=db(),target=d.users.find(u=>u.id===id&&!u.disabled);if(!target)return res.status(404).json({error:'Mitglied nicht gefunden.'});if(id===req.user.id)return res.status(400).json({error:'Du kannst dir nicht selbst folgen.'});d.follows=d.follows||[];const i=d.follows.findIndex(f=>f.from===req.user.id&&f.to===id);if(i>=0){d.follows.splice(i,1);save(d);return res.json({following:false,followersCount:d.follows.filter(f=>f.to===id).length})}d.follows.push({from:req.user.id,to:id,createdAt:new Date().toISOString()});save(d);res.json({following:true,followersCount:d.follows.filter(f=>f.to===id).length})});
app.post('/api/friends/request',auth,(req,res)=>{const id=String(req.body.userId||''),d=db(),other=d.users.find(u=>u.id===id&&!u.disabled);if(!other||id===req.user.id)return res.status(400).json({error:'Mitglied nicht gefunden.'});const f=friendship(d,req.user.id,id);if(f){if(f.status==='pending'&&f.from!==req.user.id){f.status='accepted';save(d);return res.json({ok:true,status:'accepted'})}return res.status(409).json({error:'Freundschaftsanfrage existiert bereits.'})}d.friends.push({a:req.user.id,b:id,from:req.user.id,status:'pending',createdAt:new Date().toISOString()});save(d);res.json({ok:true})});
app.post('/api/friends/accept',auth,(req,res)=>{const d=db(),id=String(req.body.userId||''),f=friendship(d,req.user.id,id);if(!f||f.status!=='pending'||f.from===req.user.id)return res.status(400).json({error:'Keine offene Anfrage von diesem Mitglied.'});f.status='accepted';save(d);res.json({ok:true})});
app.get('/api/friends',auth,(req,res)=>{const d=db(),ids=d.friends.filter(f=>f.status==='accepted'&&(f.a===req.user.id||f.b===req.user.id)).map(f=>f.a===req.user.id?f.b:f.a);res.json({friends:d.users.filter(u=>ids.includes(u.id)&&!u.disabled).map(publicUser)})});
app.get('/api/videos',(req,res)=>{const d=db();res.json({videos:d.videos.filter(v=>!v.deleted).map(v=>publicVideo(v,req.session.userId||null)).reverse()})});
app.post('/api/videos/:id/like',auth,(req,res)=>{const d=db(),v=d.videos.find(x=>x.id===req.params.id&&!x.deleted);if(!v)return res.status(404).json({error:'Video nicht gefunden.'});v.likedBy=v.likedBy||[];const i=v.likedBy.indexOf(req.user.id);if(i>=0)v.likedBy.splice(i,1);else v.likedBy.push(req.user.id);save(d);res.json({liked:i<0,likes:v.likedBy.length})});
app.get('/api/videos/:id/comments',(_req,res)=>{const d=db(),v=d.videos.find(x=>x.id===req.params.id&&!x.deleted);if(!v)return res.status(404).json({error:'Video nicht gefunden.'});res.json({comments:d.comments.filter(c=>c.videoId===v.id).slice(-100)})});
app.post('/api/videos/:id/comments',auth,(req,res)=>{const d=db(),v=d.videos.find(x=>x.id===req.params.id&&!x.deleted),text=clean(req.body.text,500);if(!v)return res.status(404).json({error:'Video nicht gefunden.'});if(!text)return res.status(400).json({error:'Kommentar ist leer.'});const c={id:crypto.randomUUID(),videoId:v.id,userId:req.user.id,displayName:req.user.displayName,text,time:time(),createdAt:new Date().toISOString()};d.comments.push(c);save(d);res.status(201).json({comment:c})});
app.post('/api/videos',auth,(req,res)=>upload.single('file')(req,res,err=>{if(err)return res.status(400).json({error:err.code==='LIMIT_FILE_SIZE'?'Maximal 500 MB pro Datei.':err.message});if(!req.file)return res.status(400).json({error:'Bitte Datei auswählen.'});const title=clean(req.body.title,100);if(!title){fs.unlink(req.file.path,()=>{});return res.status(400).json({error:'Bitte einen Titel eingeben.'})}const d=db(),v={id:crypto.randomUUID(),title,description:clean(req.body.description,500),filename:req.file.originalname.replace(/[<>]/g,'').slice(0,150),storedName:req.file.filename,url:'/media/'+req.file.filename,size:req.file.size,sizeLabel:req.file.size<1024*1024?Math.round(req.file.size/1024)+' KB':(req.file.size/1024/1024).toFixed(1)+' MB',ownerId:req.user.id,ownerName:req.user.displayName,createdAt:new Date().toISOString()};d.videos.push(v);save(d);res.status(201).json({video:publicVideo(v)})}));
app.delete('/api/videos/:id',admin,(req,res)=>{const d=db(),v=d.videos.find(x=>x.id===req.params.id);if(!v)return res.status(404).json({error:'Inhalt nicht gefunden.'});v.deleted=true;save(d);if(v.storedName)fs.unlink(path.join(UPLOAD,v.storedName),()=>{});res.json({ok:true})});
app.get('/api/chat/public',auth,(req,res)=>res.json({messages:db().publicMessages.slice(-100)}));
app.post('/api/messages/:id',auth,(req,res)=>{const d=db(),to=d.users.find(u=>u.id===req.params.id&&!u.disabled),text=clean(req.body.text,1000);if(!to||to.id===req.user.id)return res.status(400).json({error:'Empfänger nicht gefunden.'});if(!text)return res.status(400).json({error:'Nachricht ist leer.'});const m={id:crypto.randomUUID(),fromId:req.user.id,fromName:req.user.displayName,toId:to.id,text,time:time(),createdAt:new Date().toISOString()};d.messages.push(m);save(d);io.sockets.sockets.forEach(s=>{if(s.request.session.userId===to.id||s.request.session.userId===req.user.id)s.emit('private message',m)});res.status(201).json({message:m})});
app.get('/api/messages/:id',auth,(req,res)=>{const id=req.params.id,d=db();if(!d.users.some(u=>u.id===id))return res.status(404).json({error:'Mitglied nicht gefunden.'});res.json({messages:d.messages.filter(m=>(m.fromId===req.user.id&&m.toId===id)||(m.fromId===id&&m.toId===req.user.id)).slice(-200)})});
app.get('/api/admin',admin,(_req,res)=>{const d=db();res.json({users:d.users.map(u=>({...publicUser(u),disabled:!!u.disabled,createdAt:u.createdAt})),videos:d.videos.filter(v=>!v.deleted).map(publicVideo)})});
app.delete('/api/admin/users/:id',admin,(req,res)=>{if(req.params.id===req.user.id)return res.status(400).json({error:'Du kannst dein eigenes Admin-Konto nicht sperren.'});const d=db(),u=d.users.find(x=>x.id===req.params.id);if(!u)return res.status(404).json({error:'Mitglied nicht gefunden.'});u.disabled=true;save(d);res.json({ok:true})});
io.on('connection',socket=>{const uid=socket.request.session.userId;if(!uid)return;socket.on('public message',raw=>{const d=db(),u=d.users.find(x=>x.id===uid&&!x.disabled),text=clean(raw&&raw.text,1000);if(!u||!text)return;const m={id:crypto.randomUUID(),fromId:u.id,fromName:u.displayName,text,time:time(),createdAt:new Date().toISOString()};d.publicMessages.push(m);d.publicMessages=d.publicMessages.slice(-100);save(d);io.emit('public message',m)})});
app.use((err,_req,res,_next)=>{console.error(err);res.status(500).json({error:'Serverfehler.'})});
async function bootstrapAdmin(){const username=clean(process.env.ADMIN_USERNAME||'admin',24).toLowerCase(),password=process.env.ADMIN_PASSWORD;if(!password){console.warn('ADMIN_PASSWORD nicht gesetzt: Es wird KEIN Admin-Konto automatisch erstellt. Setze ADMIN_USERNAME und ADMIN_PASSWORD in der Hosting-Umgebung.');return}if(password.length<12){console.warn('ADMIN_PASSWORD sollte mindestens 12 Zeichen lang sein. Admin wurde nicht angelegt.');return}const d=db();if(d.users.some(u=>u.username===username))return;d.users.push({id:crypto.randomUUID(),username,displayName:'Administrator',passwordHash:await bcrypt.hash(password,12),bio:'',avatar:'',role:'admin',disabled:false,createdAt:new Date().toISOString()});save(d);console.log('Admin-Konto angelegt:',username)}
bootstrapAdmin().then(()=>server.listen(PORT,'0.0.0.0',()=>console.log('Gaming Monster Montenegro Reisen läuft auf Port '+PORT)));
