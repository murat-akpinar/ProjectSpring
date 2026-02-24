# ProjectSpring - Geliştirme Planı

## Mevcut Yapı
Yönetici > Birim Amiri > Birim Personeli  
5 Birim: Sistem, Network, Some, Yazılım, Test

---

## ✅ Tamamlananlar

### Kullanıcı Yönetimi Paneli (Admin)
- [x] Kullanıcı ekleme / düzenleme / silme
- [x] Kullanıcıyı birime atama
- [x] Rol değiştirme
- [x] LDAP kullanıcı import (arama ve import)

### Birim Yönetimi
- [x] Birim amiri atama ekranı
- [x] Birim üyelerini yönetme (ekleme/çıkarma)
- [x] Birim renk ve ikon ayarlama

### Görev Yönetimi
- [x] Görev geçmişi / aktivite log (TaskLog sistemi)
- [x] Kanban board görünümü
- [x] Gantt chart (zaman çizelgesi)
- [x] İş türleri ve öncelik seviyeleri
- [x] Alt görev (subtask) desteği
- [x] Ertelendi takibi ve yetişmedi hesaplama

### Güvenlik
- [x] Rate limiting (IP bazlı, Bucket4j)
- [x] Account lockout (başarısız giriş takibi)
- [x] LDAP + Local User hibrit authentication
- [x] JWT stateless authentication
- [x] AES-256 şifreleme (LDAP şifreleri)

### Altyapı
- [x] Sistem logları (backend + frontend)
- [x] Görev logları (tüm CRUD işlemleri)
- [x] Sistem sağlığı kontrolü (backend, DB, frontend)
- [x] Docker containerization
- [x] Liquibase database migration

---

## 🔜 Kısa Vadeli (Öncelikli)

### Bildirim Sistemi
- [ ] Görev atandığında kullanıcıya bildirim
- [ ] Görev durumu değiştiğinde ilgili kişilere bildirim
- [ ] Görev bitiş tarihi yaklaşınca uyarı (1 gün önce)
- [ ] Header'da bildirim zili ve okunmamış sayısı
- [ ] Bildirim dropdown/panel
- [ ] Opsiyonel: WebSocket (STOMP) ile gerçek zamanlı bildirim
- [ ] Opsiyonel: e-posta bildirim tercihleri (kullanıcı bazlı)

### Görevlere Yorum Ekleme
- [ ] Yorum tablosu (task_comments)
- [ ] Yorum CRUD endpoint'leri
- [ ] TaskModal içinde yorum bölümü
- [ ] @mention desteği (kullanıcı otomatik tamamlama)
- [ ] Yeni yorumlarda bildirim tetikleme

### Dosya Eki Yükleme
- [ ] Dosya eki tablosu (task_attachments)
- [ ] Dosya depolama servisi (local filesystem veya S3)
- [ ] Upload/download/silme endpoint'leri
- [ ] TaskModal içinde dosya yükleme alanı
- [ ] Dosya boyutu limiti ve izin verilen türler ayarı

### Görev Şablonları
- [ ] Şablon tablosu (task_templates)
- [ ] Şablon CRUD endpoint'leri
- [ ] "Şablondan oluştur" seçeneği
- [ ] Birime özel ve genel şablonlar

### Tekrarlayan Görevler
- [ ] Tekrar kuralları tablosu (recurring_task_rules)
- [ ] Zamanlanmış iş ile otomatik görev oluşturma
- [ ] Tekrar türleri: GÜNLÜK, HAFTALIK, İKİ HAFTALIK, AYLIK
- [ ] Görev oluşturma modal'ında tekrar ayarları

### Toplu Kullanıcı Import
- [ ] CSV dosyasından toplu kullanıcı import

---

## 🔮 Orta Vadeli

### Raporlama & Analitik
- [ ] Haftalık/aylık performans raporları
- [ ] Birim karşılaştırma grafikleri
- [ ] Kişisel verimlilik metrikleri
- [ ] PDF/Excel export
- [ ] Süreç süresi analizi (görev açılış → kapanış)
- [ ] Birim bazlı raporlama

### Takvim Geliştirmeleri
- [ ] Sürükle-bırak görev taşıma (takvimde)
- [ ] Günlük detay görünümü
- [ ] Google Calendar / Outlook entegrasyonu (iCal export)
- [ ] Tatil ve izin günleri görünümü
- [ ] Yazdırma dostu takvim görünümü

### Sprint / Milestone Desteği
- [ ] Milestone tablosu (milestones)
- [ ] Sprint tablosu (sprints)
- [ ] Görevleri sprint/milestone'a bağlama
- [ ] Sprint board görünümü
- [ ] Burndown chart
- [ ] Proje ilerleme yüzdesi widget'ı

### Arama & Filtreleme
- [ ] Global arama (görev, proje, kullanıcı)
- [ ] PostgreSQL full-text search (tsvector/tsquery)
- [ ] Header'da anlık sonuçlu arama çubuğu
- [ ] Arama sonuçlarını varlık türüne göre gruplama
- [ ] Gelişmiş filtreler (tarih aralığı, öncelik, durum kombinasyonları)
- [ ] Kaydedilmiş filtreler / favoriler

---

## 🚀 Uzun Vadeli

### Mobil Uygulama
- [ ] React Native veya Flutter ile mobil versiyon
- [ ] Push notification desteği
- [ ] Offline çalışma modu
- [ ] Kamera ile dosya eki yükleme

### Otomasyon & Entegrasyon
- [ ] Webhook desteği
- [ ] Slack / Teams entegrasyonu
- [ ] E-posta ile görev oluşturma
- [ ] Otomatik görev atama kuralları (round-robin, yetenek bazlı)
- [ ] SLA (hizmet seviyesi) takibi (yapılandırılabilir eşikler)

### Güvenlik & Altyapı
- [ ] İki faktörlü kimlik doğrulama (2FA) — TOTP
- [ ] Kapsamlı denetim logu (tüm varlık değişiklikleri)
- [ ] Veri yedekleme ve geri yükleme (UI)
- [ ] Harici entegrasyonlar için API key authentication
- [ ] Admin paneli için IP whitelist

### Yapay Zeka Özellikleri
- [ ] Görev önceliklendirme önerisi (geçmiş verilere dayalı)
- [ ] Otomatik görev süre tahmini
- [ ] Akıllı görev atama (iş yükü dengesi)
- [ ] Duplike görev tespiti
- [ ] Doğal dil ile görev oluşturma

### Çoklu Dil Desteği (i18n)
- [ ] Tüm UI string'lerini çeviri dosyalarına çıkarma
- [ ] Türkçe ve İngilizce dil desteği
- [ ] Kullanıcı bazlı dil tercihi
- [ ] Tarih/saat format lokalizasyonu

### Tema Desteği
- [ ] Dark/Light tema geçişi
- [ ] Kullanıcı bazlı tema tercihi
- [ ] Ek Catppuccin temaları (Latte, Frappe, Macchiato)

---

## 🐛 Bilinen Eksiklikler / İyileştirmeler

### Kod Kalitesi
- [ ] Unit test ve integration test coverage artırılmalı
- [ ] API endpoint'leri için integration test yazılmalı
- [ ] E2E testler eklenmeli (Cypress veya Playwright)

### UX İyileştirmeleri
- [ ] Hata mesajları daha kullanıcı dostu olmalı
- [ ] Loading state'lerin tutarlılığı
- [ ] Form validasyonları güçlendirilmeli (inline feedback)
- [ ] Responsive tasarım (tablet/mobil) iyileştirmesi
- [ ] Accessibility (erişilebilirlik / WCAG) desteği
- [ ] Sık kullanılan işlemler için klavye kısayolları

### Performans
- [ ] Görev listesi görünümlerinde pagination
- [ ] Dashboard istatistikleri için cache katmanı (Redis)
- [ ] Veritabanı sorgularını index incelemesi ile optimize etme
- [ ] Ağır bileşenler için lazy loading (Gantt chart)
- [ ] Görsel/asset optimizasyonu

### DevOps
- [ ] CI/CD pipeline (GitHub Actions / GitLab CI)
- [ ] Pipeline'da otomatik test çalıştırma
- [ ] Staging ortamı yapılandırması
- [ ] Sağlık kontrolü alerting (Prometheus + Grafana)
- [ ] Log toplama (ELK stack veya benzeri)
- [ ] Otomatik veritabanı yedekleme