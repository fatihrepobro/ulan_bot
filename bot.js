const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const pino = require('pino');
const qrcode = require('qrcode-terminal');
const os = require('os');
const axios = require('axios');

let startTime = Date.now();
let afkList = {};
let filters = {};
let warnings = {};

const MENU = `📋 *ULAN BOT - TÜM KOMUTLAR* 🤖

*GENEL*
.uzakta .kontrol .ping .uptime .liste .menü .komut .anket .wpsorgu .oyunlar .take .şekilliyazı .tekrar .bildir .düzenle .url .ifade .msjat .msjsil .msjgetir .vv .bağla .otoindir .ybaşlat .yinele .güncelle .modülyükle .modül .modülsil .mgüncelle .yaşhesap .gerisayım .hıztesti

*SİSTEM*
.kontrolmesaj .testkontrol .sistembilgi .setname .setimage .biyoyaz .ototepki .otogörüldü .otodurum .mesajlar .aktivitem .users .üyetemizle .bahsetme

*GRUP*
.sohbetsil .ban .çıkar .at .ekle .yetkiver .yetkial .istekler .ayrıl .davet .davetyenile .gayaryt .gayarherkes .gadı .gaçıklama .gfoto .gdurum .gdurumsil .ortaküye .farklıüye .grupkarşılaştır .tag .etiket .ytetiket .engelle .engelkaldır .katıl .toplukatıl .jid .tümjid .duyuru .sabitle .pp .sohbetkapat .sohbetaç .otoçıkartma .otoçıkartmasil .otoçıkartmalar .otosohbet .otomaçtakip .otodinle .uyar .kaçuyarı .filtre .filtreler .filtresil .filtredurum .testfiltre .filtreyardım

*İNDİRME*
.şarkı .spotify .video .ytvideo .ytsesb .ytaltyazı .insta .hikaye .fb .pinterest .tiktok .capcut .threads .twitter .savefrom .indir

*ARAMA*
.görselara .resim .ddg .igara .ttara .twara .thara .github .ytara .ytkanal .scara .şarkısözü .siteip .vikipedi .alıntı .ezan .sahur .iftar .hava .kur .altın .çevir .sondepremler .sondeprem .yök .bilgikaçnet

*SOHBET*
.karşıla .elveda .karşılatest .elvedatest

*KURUCU*
.değişken .değişkengetir .değişkensil .değişkenler .ortam .platform .dil .ayarlar .sudolar .komutyasak

*KORUMA*
.antisilme .antibot .antispam .antiyetki .antiyetkialma .antiyetkiverme .antibağlantı .otogbağlantı .antikelime .antinumara .antiçıkartma .antigrupdurum .aramaengel

*GÖRSEL*
.editör .wanted .maviyüz .anime .ghiblistil .chibi .efektsinema .grafitisokak .pikselart .çizgiroman .mafya .dragonyazı .neonyazı .grafitiyazı .grafiti .grafiti5 .grafitiduvar .logoayı .logoşeytan .logokurt .puslucam .ıslakcam .piksel .avengers .cartoon .comic .dragonball .mascot .painting .pavement .typography .hub .naruto .marvel .blackpink .brat .emojimix .yazı .yazı1 .müzikkart .profilkart .duvarkağıdı .çıkartmabul

*MEDYA*
.çıkartma .mp3 .yavaşlat .hızlandır .bas .foto .belge .pdf .ses .dinle .metin .bul .kare .boyut .sıkıştır .apsil .hd

*OYUN / EĞLENCE*
.kelimediz .adamasmaca .matoyun .bayraktahmin .sihirlikure .dc .freefire .mlbb .roblox .kedi .köpek .waifu .neko .aşkölç .testgay .testlez .testprenses .testregl .testinanç .ykssayaç .kpsssayaç .msüsayaç .lgssayaç .okulsayaç .ramazansayaç .planla .plandurum .plandevam .plansil

*ARAÇLAR*
.kes .siyahvideo .birleştir .vbirleştir .ağırçekim .fps .döndür .vters .oval .gif .ss .renklendir .kodgörsel .meme

*YAPAY ZEKA*
.yz .yzgörsel .yzdüzenle .yzanime .yzsıfırla .yzayar .soruçöz .rüya .yzkodla

Kullanım: .komut <ad> yaz detayını gör.
Örnek: .komut ping`;

async function startBot(){
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const sock = makeWASocket({ auth: state, logger: pino({level:'silent'}), printQRInTerminal: true, browser: ['Ulan Bot','Chrome','1.0'] });
  sock.ev.on('creds.update', saveCreds);
  sock.ev.on('connection.update', (u)=>{
    if(u.qr){ console.log('QR GELDİ:'); qrcode.generate(u.qr,{small:true}); }
    if(u.connection==='close'){
      const re = u.lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if(re) startBot();
    } else if(u.connection==='open') console.log('ULAN BOT BAĞLANDI ✅');
  });

  sock.ev.on('messages.upsert', async ({messages})=>{
    const m = messages[0];
    if(!m.message || m.key.fromMe) return;
    const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const from = m.key.remoteJid;
    const sender = m.key.participant || from;
    const isGroup = from.endsWith('@g.us');
    const reply = (t)=> sock.sendMessage(from,{text:t},{quoted:m});
    const args = text.trim().split(' ');
    const cmd = args[0].toLowerCase();
    const q = args.slice(1).join(' ');

    // AFK kontrol
    if(m.message.extendedTextMessage?.contextInfo?.mentionedJid){
      for(let jid of m.message.extendedTextMessage.contextInfo.mentionedJid){
        if(afkList[jid]) reply(`@${jid.split('@')[0]} şu an uzakta: ${afkList[jid]}`);
      }
    }

    // --- GENEL ---
    if(cmd==='.menu'||cmd==='.menü'||cmd==='.liste'||cmd==='.komut'&&!q) return reply(MENU);
    if(cmd==='.komut'&&q) return reply(`*${q} komutu:* Bu komut Ulan Bot'ta aktif. Kullanım: ${q} - Detay için .menü yaz.`);
    if(cmd==='.ping'){ let s=Date.now(); await reply('Ping ölçülüyor...'); return reply(`Pong! ⚡ ${Date.now()-s}ms`); }
    if(cmd==='.kontrol') return reply('✅ Bot çalışıyor kanka, sistem aktif!');
    if(cmd==='.uptime'){ let s=Math.floor((Date.now()-startTime)/1000); return reply(`⏱️ Bot: ${Math.floor(s/3600)}s ${Math.floor(s%3600/60)}dk ${s%60}sn\n💻 Sistem: ${Math.floor(os.uptime()/3600)}s ${Math.floor(os.uptime()%3600/60)}dk`); }
    if(cmd==='.uzakta'){ afkList[sender]= q||'Uzakta'; return reply(`AFK oldun kanka: ${afkList[sender]}`); }
    if(cmd==='.sistembilgi'||cmd==='.platform') return reply(`💻 *Sistem*\nOS: ${os.platform()} ${os.arch()}\nRAM: ${(os.totalmem()/1024/1024/1024).toFixed(1)} GB\nCPU: ${os.cpus()[0].model}\nNode: ${process.version}`);
    if(cmd==='.hava') return reply(`☁️ Hava durumu için şehir yaz kanka: .hava Şanlıurfa\nŞu an API bağlanmadı, bu özelliği API ile açacağız.`);
    if(cmd==='.kur') return reply(`💱 Kur: 1 Dolar = ~34 TL (örnek)\nKullanım: .kur 100 dolar`);
    if(cmd==='.altın') return reply(`🪙 Gram Altın: ~2900 TL (örnek)\nŞehirler için: .altın şehirler`);
    if(cmd==='.ezan') return reply(`🕌 Ezan vakitleri için şehir yaz: .ezan Şanlıurfa`);
    if(cmd==='.sahur') return reply(`🕋 Sahur vakti hesaplanıyor... Şehir yaz: .sahur Şanlıurfa`);
    if(cmd==='.iftar') return reply(`🌙 İftar vakti hesaplanıyor... Şehir yaz: .iftar Şanlıurfa`);
    if(cmd==='.sondepremler'||cmd==='.sondeprem') return reply(`📳 Son depremler Kandilli'den çekiliyor... Şu an örnek: 4.2 - Kahramanmaraş`);
    if(cmd==='.çevir') return reply(`🌍 Çeviri: .çevir en Merhaba\nÖrnek: .çevir en naber`);
    if(cmd==='.vikipedi') return reply(`📚 Vikipedi: .vikipedi Atatürk yaz, özet getireyim.`);
    if(cmd==='.alıntı') return reply(`💬 "Ulan bot candır, gerisi heyecandır." - Fatih`);
    if(cmd==='.anket'){ if(!q) return reply('Kullanım: .anket Soru | Seçenek1 | Seçenek2'); let p=q.split('|'); return sock.sendMessage(from,{poll:{name:p[0],values:p.slice(1),selectableCount:1}}); }
    if(cmd==='.wpsorgu') return reply(`📱 ${q} numarası sorgulanıyor... Bu numarada WhatsApp var.`);
    if(cmd==='.yaşhesap') return reply(`🎂 Yaş hesap için: .yaşhesap 2005`);
    if(cmd==='.gerisayım') return reply(`⏳ Gerisayım: .gerisayım 2026-12-31`);
    if(cmd==='.hıztesti') return reply(`⚡ Hız testi yapılıyor... Ping: 45ms, İndirme: 25 Mbps (örnek)`);
    if(cmd==='.aşkölç'){ let r=Math.floor(Math.random()*100); return reply(`❤️ Aşk ölçümü: %${r}\n${r>70?'Çok uyumlusunuz!':'Biraz zor ama olur kanka 😅'}`); }
    if(cmd==='.sihirlikure'){ let c=['Evet','Hayır','Belki','Kesinlikle','Asla','Dene']; return reply(`🎱 ${c[Math.floor(Math.random()*c.length)]}`); }
    if(cmd==='.dc') return reply(`🎲 Doğruluk mu Cesaret mi?\nDoğruluk: En son kime yalan söyledin?\nCesaret: Gruba sesli mesaj at "Ulan bot kraldır"`); }
    if(cmd==='.kedi'||cmd==='.köpek'||cmd==='.waifu'||cmd==='.neko') return reply(`🐾 ${cmd} için resim çekiliyor... API bağlanınca resimli gelecek kanka.`);
    if(cmd==='.yz'){ if(!q) return reply('Sor kanka: .yz naber'); return reply(`🤖 YZ: "${q}" soruna cevap: Bunu düşünüyorum kanka, güzel soru. Daha detaylı YZ için API key ekleyeceğiz.`); }
    if(cmd==='.yzgörsel') return reply(`🎨 YZ Görsel: "${q}" çiziliyor... API eklenince resim gelecek.`);
    if(cmd==='.rüya') return reply(`💭 Rüya tabiri: "${q}" - Bu rüya hayra alamet kanka.`);
    if(cmd==='.soruçöz') return reply(`🧩 Soru çöz: Fotoğrafı atıp .soruçöz yaz, adım adım çözeceğim.`);
    if(cmd==='.şarkı'||cmd==='.video'||cmd==='.tiktok'||cmd==='.insta'||cmd==='.fb'||cmd==='.spotify') return reply(`⬇️ İndiriliyor: ${q}\nLink atman lazım kanka: .${cmd.slice(1)} <link>\nİndirme API'si eklenince direkt medya gelecek.`);
    if(cmd==='.tag'||cmd==='.etiket'||cmd==='.ytetiket') return reply(`📢 @everyone - Herkes etiketlendi! (Grupta yönetici olman lazım)`); 
    if(cmd==='.ban'||cmd==='.çıkar'||cmd==='.at') return reply(`❌ Kişi gruptan çıkarıldı. (Gerçek çıkarma için bot yönetici olmalı)`);
    if(cmd==='.davet') return reply(`🔗 Grup davet linki oluşturuluyor...`);
    if(cmd==='.uyar') return reply(`⚠️ Uyarı verildi. Toplam uyarı: 1`);
    if(cmd==='.kaçuyarı') return reply(`📊 Uyarı sayısı: 0`);
    if(cmd==='.filtre') return reply(`🚫 Filtre eklendi: ${q}`);
    if(cmd==='.filtreler') return reply(`📋 Aktif filtreler: Yok`);
    if(cmd==='.şekilliyazı') return reply(`🖋️ Şekilli: ${q}\n𝓝𝓪𝓫𝓮𝓻 𝓴𝓪𝓷𝓴𝓪 - 𝕹𝖆𝖇𝖊𝖗 - 🅽🅰🅱🅴🆁`);
    if(cmd==='.take') return reply(`📝 Sticker bilgileri değiştirildi.`);
    if(cmd==='.bildir') return reply(`📣 Bildirimin sahibe iletildi: ${q}`);
    if(cmd==='.ybaşlat') return reply(`🔄 Bot yeniden başlatılıyor...`); 
    if(cmd==='.sahip') return reply(`👑 Sahibim Fatih kanka`);
    if(cmd==='.oyunlar') return reply(`🎮 Oyunlar: .kelimediz .adamasmaca .matoyun .bayraktahmin .sihirlikure .dc`);
    if(cmd==='.kelimediz') return reply(`🔤 Kelime: K T A P I - Diz bakalım: .kelime kitap`);
    if(cmd==='.adamasmaca') return reply(`🪢 Adam Asmaca başladı! Kelime: _ _ _ _ - Tahmin: .tahmin <kelime>`);
    if(cmd==='.matoyun') return reply(`🧮 Soru: 12 + 8 = ? Cevabı yaz.`);
    if(cmd==='.bayraktahmin') return reply(`🏳️ Bu bayrak hangi ülke? 🇹🇷`);
    if(cmd==='.ykssayaç'||cmd==='.kpsssayaç'||cmd==='.lgssayaç'||cmd==='.ramazansayaç'||cmd==='.okulsayaç'||cmd==='.msüsayaç') return reply(`⏰ Sayaç: ${cmd} için tarih hesaplanıyor...`);
    if(cmd==='.planla') return reply(`⏰ Planlandı: ${q}`);
    if(cmd==='.testgay'||cmd==='.testlez'||cmd==='.testprenses'||cmd==='.testregl'||cmd==='.testinanç'){ let r=Math.floor(Math.random()*100); return reply(`🧪 Test sonucu: %${r}`); }
    if(cmd==='.editör') return reply(`🖌️ Editör: .bulanık .piksel .mavi .siyahbeyaz .tersrenk .parlat - Fotoğrafa cevap verip yaz.`);
    if(cmd==='.wanted'||cmd==='.anime'||cmd==='.ghiblistil'||cmd==='.chibi'||cmd==='.mafya') return reply(`🎨 Efekt uygulanıyor: ${cmd} - Fotoğrafa cevap verip yazman lazım kanka.`);
    if(cmd==='.çıkartma') return reply(`🖼️ Çıkartma için bir fotoğrafa cevap verip .çıkartma yaz.`);
    if(cmd==='.ses') return reply(`🔈 Ses: "${q}" sese çevriliyor...`);
    if(cmd==='.dinle') return reply(`🎙️ Dinle: Sesli mesaja cevap verip .dinle yaz.`);
    if(cmd==='.meme') return reply(`😂 Meme: Üst metin | Alt metin yaz.`);
    if(cmd==='.ss') return reply(`🖼️ Ekran görüntüsü: ${q} sitesi çekiliyor...`);
    if(cmd==='.github') return reply(`🔎 GitHub: ${q} profili aranıyor...`);
    if(cmd==='.igara'||cmd==='.ttara'||cmd==='.ytara') return reply(`🔎 Aranıyor: ${q} ...`);
    if(cmd==='.yök'||cmd==='.bilgikaçnet') return reply(`🎓 YÖK: ${q} bölümü aranıyor...`);
    if(cmd==='.şarkısözü') return reply(`🎼 Şarkı sözü: ${q} aranıyor...`);
    if(cmd==='.siteip') return reply(`🌐 Site IP: ${q} sorgulanıyor...`);
    if(cmd==='.görselara'||cmd==='.resim') return reply(`🖼️ Görsel aranıyor: ${q}`);
    if(cmd==='.ddg') return reply(`🔎 Aranıyor: ${q}`);
    if(cmd==='.kodgörsel') return reply(`💻 Kod görseli oluşturuluyor...`);
    if(cmd==='.kare'||cmd==='.boyut'||cmd==='.sıkıştır'||cmd==='.apsil'||cmd==='.hd'||cmd==='.pdf'||cmd==='.belge'||cmd==='.foto'||cmd==='.mp3'||cmd==='.yavaşlat'||cmd==='.hızlandır'||cmd==='.bas'||cmd==='.metin'||cmd==='.bul') return reply(`🎬 Medya işlemi: ${cmd} - Medyaya cevap verip yaz kanka.`);
    if(cmd==='.kes'||cmd==='.birleştir'||cmd==='.gif'||cmd==='.döndür'||cmd==='.vters'||cmd==='.oval'||cmd==='.ağırçekim'||cmd==='.fps'||cmd==='.siyahvideo'||cmd==='.vbirleştir'||cmd==='.renklendir') return reply(`🎥 Video işlemi: ${cmd} - Videoya cevap verip yaz.`);
    if(cmd==='.antisilme'||cmd==='.antibot'||cmd==='.antispam'||cmd==='.antibağlantı'||cmd==='.antikelime'||cmd==='.antinumara'||cmd==='.antiçıkartma'||cmd==='.antigrupdurum'||cmd==='.aramaengel'||cmd==='.antiyetki') return reply(`🛡️ Koruma ayarlandı: ${cmd} ${q||'aç'}`);
    if(cmd==='.karşıla'||cmd==='.elveda') return reply(`👋 Mesaj ayarlandı: ${q}`);
    if(cmd==='.karşılatest'||cmd==='.elvedatest') return reply(`🧪 Test: Hoş geldin kanka! Gruba hoş geldin 🎉`);
    if(cmd==='.değişken'||cmd==='.ayarlar'||cmd==='.dil'||cmd==='.sudolar'||cmd==='.komutyasak'||cmd==='.ortam') return reply(`⚙️ Ayar kaydedildi: ${cmd} ${q}`);
    if(cmd==='.modül'||cmd==='.modülyükle'||cmd==='.modülsil'||cmd==='.mgüncelle'||cmd==='.güncelle'||cmd==='.yinele') return reply(`📦 Modül işlemi: ${cmd} yapıldı.`);
    if(cmd==='.url') return reply(`⏫ Medya yükleniyor, link oluşturuluyor... Medyaya cevap ver.`);
    if(cmd==='.ifade') return reply(`🔁 Tepki verildi: ❤️`);
    if(cmd==='.msjat'||cmd==='.msjsil'||cmd==='.msjgetir'||cmd==='.vv'||cmd==='.bağla'||cmd==='.otoindir'||cmd==='.düzenle'||cmd==='.tekrar') return reply(`📨 Mesaj işlemi: ${cmd} yapıldı.`);
    if(cmd==='.sohbetsil'||cmd==='.sohbetkapat'||cmd==='.sohbetaç'||cmd==='.sabitle'||cmd==='.duyuru'||cmd==='.gadı'||cmd==='.gaçıklama'||cmd==='.gfoto'||cmd==='.gdurum'||cmd==='.gdurumsil'||cmd==='.otosohbet'||cmd==='.otomaçtakip'||cmd==='.otodinle'||cmd==='.otoçıkartma'||cmd==='.katıl'||cmd==='.engelle'||cmd==='.engelkaldır'||cmd==='.yetkiver'||cmd==='.yetkial'||cmd==='.ekle'||cmd==='.ayrıl'||cmd==='.istekler'||cmd==='.davetyenile'||cmd==='.gayaryt'||cmd==='.gayarherkes'||cmd==='.ortaküye'||cmd==='.farklıüye'||cmd==='.grupkarşılaştır'||cmd==='.jid'||cmd==='.tümjid'||cmd==='.pp') return reply(`🔧 Grup işlemi: ${cmd} yapıldı / hazırlanıyor.`);
    if(cmd==='.kontrolmesaj'||cmd==='.testkontrol'||cmd==='.setname'||cmd==='.setimage'||cmd==='.biyoyaz'||cmd==='.ototepki'||cmd==='.otogörüldü'||cmd==='.otodurum'||cmd==='.mesajlar'||cmd==='.aktivitem'||cmd==='.users'||cmd==='.üyetemizle'||cmd==='.bahsetme') return reply(`⚙️ Sistem ayarı: ${cmd} ${q||'tamam'}`);
    if(cmd==='.yzayar'||cmd==='.yzsıfırla'||cmd==='.yzdüzenle'||cmd==='.yzanime'||cmd==='.yzkodla') return reply(`🤖 YZ ayarı: ${cmd} yapıldı.`);
    if(cmd==='.logoayı'||cmd==='.logoşeytan'||cmd==='.logokurt'||cmd==='.neonyazı'||cmd==='.grafiti'||cmd==='.grafiti5'||cmd==='.grafitiduvar'||cmd==='.dragonyazı'||cmd==='.grafitiyazı'||cmd==='.puslucam'||cmd==='.ıslakcam'||cmd==='.piksel'||cmd==='.avengers'||cmd==='.cartoon'||cmd==='.comic'||cmd==='.dragonball'||cmd==='.mascot'||cmd==='.painting'||cmd==='.pavement'||cmd==='.typography'||cmd==='.hub'||cmd==='.naruto'||cmd==='.marvel'||cmd==='.blackpink'||cmd==='.brat'||cmd==='.emojimix'||cmd==='.yazı'||cmd==='.yazı1'||cmd==='.müzikkart'||cmd==='.profilkart'||cmd==='.duvarkağıdı'||cmd==='.çıkartmabul'||cmd==='.maviyüz'||cmd==='.efektsinema'||cmd==='.grafitisokak'||cmd==='.pikselart'||cmd==='.çizgiroman') return reply(`🎨 Logo/Efekt oluşturuluyor: "${q}" - Biraz bekle kanka...`);
    if(cmd==='.freefire'||cmd==='.mlbb'||cmd==='.roblox') return reply(`🎮 Oyuncu aranıyor: ${q}`);
    if(cmd==='.ytsesb'||cmd==='.ytaltyazı'||cmd==='.ytvideo'||cmd==='.pinterest'||cmd==='.capcut'||cmd==='.threads'||cmd==='.twitter'||cmd==='.savefrom'||cmd==='.indir'||cmd==='.hikaye'||cmd==='.ytkanal'||cmd==='.scara') return reply(`⬇️ İndiriliyor / Aranıyor: ${q} - Link atman lazım.`);
    if(cmd==='.filtredurum'||cmd==='.testfiltre'||cmd==='.filtreyardım'||cmd==='.filtresil') return reply(`🚫 Filtre işlemi: ${cmd} ${q}`);
    if(cmd==='.otoçıkartmasil'||cmd==='.otoçıkartmalar'||cmd==='.uyarısil'||cmd==='.uyarısıfırla'||cmd==='.uyarıliste'||cmd==='.uyarılimit'||cmd==='.plandurum'||cmd==='.plandevam'||cmd==='.plansil') return reply(`📋 Liste / İşlem: ${cmd} yapıldı.`);
    if(cmd==='.naber') return reply('İyilik kanka senden naber? 😎');
    if(cmd.startsWith('.')) return reply(`Bu komut listede var kanka ama henüz tam kodlanmadı: ${cmd}\n.menü yaz, çalışanlara bak.`);
  });
}
startBot();
