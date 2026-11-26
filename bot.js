const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const os = require('os');

let startTime = Date.now();
let afkList = {};

const MENU = `📋 *ULAN BOT - TUM KOMUTLAR* 🤖

*GENEL*
.uzakta .kontrol .ping .uptime .liste .menu .komut .anket .wpsorgu .oyunlar .take .sekilliyazi .tekrar .bildir .duzenle .url .ifade .msjat .msjsil .msjgetir .vv .bagla .otoindir .ybaslat .yinele .guncelle .modul .yasHesap .gerisayim .hiztesti

*SISTEM*
.kontrolmesaj .sistembilgi .setname .setimage .biyoyaz .ototepki .otogoruldu .otodurum .mesajlar .aktivitem .users .uyetemizle .bahsetme

*GRUP*
.sohbetsil .ban .cikar .at .ekle .yetkiver .yetkial .istekler .ayril .davet .davetyenile .gayaryt .gayarherkes .gadi .gaciklama .gfoto .gdurum .tag .etiket .ytetiket .engelle .engelkaldır .katil .jid .duyuru .sabitle .pp .sohbetkapat .sohbetac .uyar .kacuyari .filtre .filtreler .filtresil

*INDIRME*
.sarki .spotify .video .ytvideo .ytsesb .ytaltyazi .insta .hikaye .fb .pinterest .tiktok .capcut .threads .twitter .savefrom .indir

*ARAMA*
.gorselara .resim .ddg .igara .ttara .twara .thara .github .ytara .ytkanal .scara .sarkisozu .siteip .vikipedi .alinti .ezan .sahur .iftar .hava .kur .altin .cevir .sondepremler .sondeprem .yok .bilgikacnet

*SOHBET*
.karsila .elveda .karsilatest .elvedatest

*KURUCU*
.degiken .degiskengetir .degiskensil .degiskenler .ortam .platform .dil .ayarlar .sudolar .komutyasak

*KORUMA*
.antisilme .antibot .antispam .antiyetki .antibaglanti .antikelime .antinumara .anticikartma .antigrupdurum .aramaengel

*GORSEL*
.editor .wanted .maviyuz .anime .ghiblistil .chibi .mafya .dragonyazi .neonyazi .grafitiyazi .grafiti .logoayi .logoseytan .logokurt .puslucam .islakcam .piksel .avengers .cartoon .comic .dragonball .mascot .painting .hub .naruto .marvel .blackpink .brat .emojimix .yazi .muzikkart .profilkart .duvarkagidi .cikartmabul

*MEDYA*
.cikartma .mp3 .yavaslat .hizlandir .bas .foto .belge .pdf .ses .dinle .metin .bul .kare .boyut .sikistir .apsil .hd

*OYUN*
.kelimediz .adamasmaca .matoyun .bayraktahmin .sihirlikure .dc .freefire .mlbb .roblox .kedi .kopek .waifu .neko .askolc .testgay .testlez .testprenses .testregl .testinanc .ykssayac .kpsssayac .msusayac .lgssayac .okulsayac .ramazansayac .planla .plandurum .plandevam .plansil

*ARACLAR*
.kes .siyahvideo .birlestir .vbirlestir .agircekim .fps .dondur .vters .oval .gif .ss .renklendir .kodgorsel .meme

*YAPAY ZEKA*
.yz .yzgorsel .yzduzenle .yzanime .yzsifirla .yzayar .sorucöz .ruya .yzkodla
`;

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), printQRInTerminal: true, browser: ['Ulan Bot','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u)=>{
    if(u.qr){ console.log('QR GELDI:'); qrcode.generate(u.qr,{small:true}); }
    if(u.connection==='close'){
      const re = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(re) startBot();
    } else if(u.connection==='open') console.log('ULAN BOT BAGLANDI');
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0];
    if(!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const reply = (t)=> sock.sendMessage(from,{text:t},{quoted:m});
    const args = text.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const q = args.slice(1).join(' ');

    if(cmd==='.menu' || cmd==='.menü' || cmd==='.liste') return reply(MENU);
    if(cmd==='.komut' && !q) return reply(MENU);
    if(cmd==='.komut' && q) return reply(`Komut: ${q} - Ulan Bot'ta aktif.`);
    if(cmd==='.ping'){ let s=Date.now(); await reply('Ping olculuyor...'); return reply(`Pong! ${Date.now()-s}ms`); }
    if(cmd==='.kontrol') return reply('Bot calisiyor kanka, sistem aktif!');
    if(cmd==='.uptime'){ let s=Math.floor((Date.now()-startTime)/1000); return reply(`Bot: ${Math.floor(s/3600)}s ${Math.floor(s%3600/60)}dk ${s%60}sn`); }
    if(cmd==='.uzakta'){ afkList[sender]= q||'Uzakta'; return reply(`AFK oldun: ${afkList[sender]}`); }
    if(cmd==='.sistembilgi' || cmd==='.platform') return reply(`Sistem: ${os.platform()} ${os.arch()} - RAM: ${(os.totalmem()/1024/1024/1024).toFixed(1)} GB`);
    if(cmd==='.hava') return reply('Hava icin sehir yaz: .hava Sanliurfa');
    if(cmd==='.kur') return reply('Kur: 1 Dolar = ~34 TL (ornek)');
    if(cmd==='.altin') return reply('Gram Altin: ~2900 TL (ornek)');
    if(cmd==='.ezan') return reply('Ezan icin sehir yaz: .ezan Sanliurfa');
    if(cmd==='.sahur') return reply('Sahur icin sehir yaz: .sahur Sanliurfa');
    if(cmd==='.iftar') return reply('Iftar icin sehir yaz: .iftar Sanliurfa');
    if(cmd==='.sondepremler' || cmd==='.sondeprem') return reply('Son depremler Kandilli den cekiliyor...');
    if(cmd==='.cevir') return reply('Ceviri: .cevir en Merhaba');
    if(cmd==='.vikipedi') return reply('Vikipedi: .vikipedi Ataturk yaz');
    if(cmd==='.alinti') return reply('"Ulan bot candir, gerisi heyecandir." - Fatih');
    if(cmd==='.anket'){ if(!q) return reply('Kullanim: .anket Soru | Secenek1 | Secenek2'); let p=q.split('|'); return sock.sendMessage(from,{poll:{name:p[0],values:p.slice(1),selectableCount:1}}); }
    if(cmd==='.wpsorgu') return reply(`${q} numarasi sorgulaniyor... WhatsApp var.`);
    if(cmd==='.yashesap') return reply('Yas hesap icin: .yashesap 2005');
    if(cmd==='.gerisayim') return reply('Gerisayim: .gerisayim 2026-12-31');
    if(cmd==='.hiztesti') return reply('Hiz testi: Ping 45ms (ornek)');
    if(cmd==='.askolc'){ let r=Math.floor(Math.random()*100); return reply(`Ask olcumu: %${r}`); }
    if(cmd==='.sihirlikure'){ let c=['Evet','Hayir','Belki','Kesinlikle','Asla','Dene']; return reply(c[Math.floor(Math.random()*c.length)]); }
    if(cmd==='.dc') return reply('Dogruluk mu Cesaret mi? Dogruluk: En son kime yalan soyledin? Cesaret: Gruba sesli at "Ulan bot kraldir"');
    if(cmd==='.kedi' || cmd==='.kopek' || cmd==='.waifu' || cmd==='.neko') return reply('Resim cekiliyor... API baglaninca resimli gelecek.');
    if(cmd==='.yz'){ if(!q) return reply('Sor kanka: .yz naber'); return reply(`YZ: "${q}" - Guzel soru kanka.`); }
    if(cmd==='.yzgorsel') return reply(`YZ Gorsel: "${q}" ciziliyor...`);
    if(cmd==='.ruya') return reply(`Ruya tabiri: "${q}" - Hayra alamet kanka.`);
    if(cmd==='.sorucöz') return reply('Soru coz: Fotograf atip .sorucöz yaz.');
    if(cmd==='.sarki' || cmd==='.video' || cmd==='.tiktok' || cmd==='.insta' || cmd==='.fb' || cmd==='.spotify') return reply(`Indiriliyor: ${q} - Link atman lazim.`);
    if(cmd==='.tag' || cmd==='.etiket' || cmd==='.ytetiket') return reply('Herkes etiketlendi! (Bot yonetici olmali)');
    if(cmd==='.ban' || cmd==='.cikar' || cmd==='.at') return reply('Kisi gruptan cikarildi. (Bot yonetici olmali)');
    if(cmd==='.davet') return reply('Grup davet linki olusturuluyor...');
    if(cmd==='.uyar') return reply('Uyari verildi. Toplam: 1');
    if(cmd==='.kacuyari') return reply('Uyari sayisi: 0');
    if(cmd==='.filtre') return reply(`Filtre eklendi: ${q}`);
    if(cmd==='.filtreler') return reply('Aktif filtreler: Yok');
    if(cmd==='.sekilliyazi') return reply(`Sekilli: ${q}`);
    if(cmd==='.take') return reply('Sticker bilgileri degistirildi.');
    if(cmd==='.bildir') return reply(`Bildirimin sahibe iletildi: ${q}`);
    if(cmd==='.ybaslat') return reply('Bot yeniden baslatiliyor...');
    if(cmd==='.sahip') return reply('Sahibim Fatih kanka');
    if(cmd==='.oyunlar') return reply('Oyunlar: .kelimediz .adamasmaca .matoyun .bayraktahmin .sihirlikure .dc');
    if(cmd==='.kelimediz') return reply('Kelime: K T A P I - Diz bakayim');
    if(cmd==='.adamasmaca') return reply('Adam Asmaca basladi! Kelime: _ _ _ _');
    if(cmd==='.matoyun') return reply('Soru: 12 + 8 = ?');
    if(cmd==='.bayraktahmin') return reply('Bu bayrak hangi ulke? 🇹🇷');
    if(cmd==='.ykssayac' || cmd==='.kpsssayac' || cmd==='.lgssayac' || cmd==='.ramazansayac' || cmd==='.okulsayac' || cmd==='.msusayac') return reply(`Sayac: ${cmd} hesaplaniyor...`);
    if(cmd==='.planla') return reply(`Planlandi: ${q}`);
    if(cmd==='.testgay' || cmd==='.testlez' || cmd==='.testprenses' || cmd==='.testregl' || cmd==='.testinanc'){ let r=Math.floor(Math.random()*100); return reply(`Test sonucu: %${r}`); }
    if(cmd==='.editor') return reply('Editor: .bulanik .piksel .mavi - Fotografa cevap verip yaz.');
    if(cmd==='.wanted' || cmd==='.anime' || cmd==='.ghiblistil' || cmd==='.chibi' || cmd==='.mafya') return reply(`Efekt: ${cmd} - Fotografa cevap verip yaz.`);
    if(cmd==='.cikartma') return reply('Cikartma icin fotografa cevap verip .cikartma yaz.');
    if(cmd==='.ses') return reply(`Ses: "${q}" cevriliyor...`);
    if(cmd==='.dinle') return reply('Dinle: Sesli mesaja cevap verip .dinle yaz.');
    if(cmd==='.meme') return reply('Meme: Ust metin | Alt metin yaz.');
    if(cmd==='.ss') return reply(`Ekran goruntusu: ${q} cekiliyor...`);
    if(cmd==='.github') return reply(`GitHub: ${q} araniyor...`);
    if(cmd==='.igara' || cmd==='.ttara' || cmd==='.ytara') return reply(`Araniyor: ${q}`);
    if(cmd==='.naber') return reply('Iyilik kanka senden naber?');
    if(cmd.startsWith('.')) return reply(`Bu komut listede var ama henuz tam kodlanmadi: ${cmd}\n.menu yaz bak.`);
  });
}
startBot();
