# ProjectSpring - Geliştirme Planı

## Mevcut Yapı
Yönetici > Birim Amiri > Birim Personeli  
5 Birim: Sistem, Network, Some, Yazılım, Test

---

## 🔜 Kısa Vadeli (Öncelikli)

### Bildirim Sistemi
- [ ] Görev atandığında kullanıcıya bildirim
- [ ] Görev durumu değiştiğinde ilgili kişilere bildirim
- [ ] Header'da bildirim zili ve okunmamış sayısı
- [ ] Bildirim tercihleri (e-posta / uygulama içi)

### Kullanıcı Yönetimi Paneli (Admin)
- [ ] Kullanıcı ekleme / düzenleme / silme
- [ ] Kullanıcıyı birime atama
- [ ] Rol değiştirme
- [ ] Toplu kullanıcı import (CSV/LDAP)

### Birim Yönetimi
- [ ] Birim amiri atama ekranı
- [ ] Birim üyelerini yönetme (ekleme/çıkarma)
- [ ] Birim bazlı raporlama

### Görev İyileştirmeleri
- [ ] Görevlere yorum ekleme
- [ ] Görev geçmişi / aktivite log
- [ ] Dosya eki yükleme
- [ ] Görev şablonları
- [ ] Tekrarlayan görevler (haftalık, aylık)

---

## 🔮 Orta Vadeli

### Raporlama & Analitik
- [ ] Haftalık/aylık performans raporları
- [ ] Birim karşılaştırma grafikleri
- [ ] Kişisel verimlilik metrikleri
- [ ] PDF/Excel export
- [ ] Süreç süresi analizi (görev açılış → kapanış)

### Takvim Geliştirmeleri
- [ ] Sürükle-bırak görev taşıma (takvimde)
- [ ] Haftalık/günlük görünüm
- [ ] Google Calendar / Outlook entegrasyonu
- [ ] Tatil ve izin günleri görünümü

### Proje Yönetimi
- [ ] Kanban board görünümü
- [ ] Sprint / milestone desteği
- [ ] Gantt chart (zaman çizelgesi)
- [ ] Proje ilerleme yüzdesi widget'ı

### Arama & Filtreleme
- [ ] Global arama (görev, proje, kullanıcı)
- [ ] Gelişmiş filtreler (tarih aralığı, öncelik, durum kombinasyonları)
- [ ] Kaydedilmiş filtreler / favoriler

---

## 🚀 Uzun Vadeli

### Mobil Uygulama
- [ ] React Native veya Flutter ile mobil versiyon
- [ ] Push notification desteği
- [ ] Offline çalışma modu

### Otomasyon & Entegrasyon
- [ ] Webhook desteği
- [ ] Slack / Teams entegrasyonu
- [ ] E-posta ile görev oluşturma
- [ ] Otomatik görev atama kuralları
- [ ] SLA (hizmet seviyesi) takibi

### Güvenlik & Altyapı
- [ ] İki faktörlü kimlik doğrulama (2FA)
- [ ] Denetim / audit log
- [ ] Veri yedekleme ve geri yükleme
- [ ] Rate limiting ve API güvenliği
- [ ] Dark/Light tema tercihi (kullanıcı bazlı)

### Yapay Zeka Özellikleri
- [ ] Görev önceliklendirme önerisi
- [ ] Otomatik görev süre tahmini
- [ ] Akıllı görev atama (iş yükü dengesi)
- [ ] Duplike görev tespiti

---

## 🐛 Bilinen Eksiklikler / İyileştirmeler
- [ ] Hata mesajları daha kullanıcı dostu olmalı
- [ ] Loading state'lerin tutarlılığı
- [ ] Form validasyonları güçlendirilmeli
- [ ] Responsive tasarım (tablet/mobil) iyileştirmesi
- [ ] Accessibility (erişilebilirlik) desteği
- [ ] Uygulama içi Türkçe/İngilizce dil desteği (i18n)
- [ ] Unit test ve integration test coverage