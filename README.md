# ProjectSpring

ProjectSpring — Takımlar için takvim odaklı proje ve görev yönetim platformu.

## Özellikler

- **Çok Seviyeli Yetkilendirme**: Yönetici, Takım Lideri ve Personel rolleri
- **Hibrit Authentication**: Hem LDAP hem de Local User desteği (LDAP önce denenir, başarısız olursa local user kontrol edilir)
- **JWT Authentication**: Stateless authentication (session problemi yok, yatay ölçeklendirme için uygun)
- **Otomatik Database Migration**: Liquibase ile veritabanı şeması otomatik oluşturulur
- **Yönetim Paneli**: 
  - Kullanıcı yönetimi (oluşturma, düzenleme, silme, admin rolü atama)
  - Takım yönetimi (oluşturma, düzenleme, silme, renk/ikon ayarlama)
  - Rol yönetimi (genel rol havuzu)
  - LDAP ayarları yönetimi (UI'dan bağlantı ayarları, şifreli saklama, test butonu)
  - LDAP kullanıcı import (arama ve import)
  - Sistem sağlığı kontrolü (Backend, Database, Frontend API)
- **Kullanıcı Profil Sistemi**: 
  - Profil bilgileri görüntüleme
  - Atanan işler listesi
  - İsim değiştirme
  - Şifre değiştirme
- **Çoklu Görünüm Modları**: 
  - Takvim Görünümü: Günlük takvim görünümü, hafta sonu günleri soluk
  - Gantt Chart: Timeline bazlı Gantt chart, hafta seçimi, hiyerarşik subtask desteği
  - Kanban Board: Status bazlı Kanban board, her takım için ayrı
- **Aylık Görünüm**: 12 ay grid görünümü, mevsim renkleri ile
- **Proje Yönetimi**: Proje oluşturma, düzenleme, silme. Projelere ekip atama ve iş ekleme
- **Proje Detay Görünümü**: Durum dağılımı grafiği, görev listesi ve Gantt chart ile detaylı proje takibi
- **Proje Uyarı Sistemi**: Bitim tarihine 1 gün kalan projeler otomatik yanıp söner
- **Ekip Renkleri ve İkonları**: Her ekibin kendine özel belirleyici rengi ve ikonu var, toplu görünümde ekipleri ayırmak kolay
- **Ekip Dashboard**: Gerçek zamanlı istatistikler
- **İş Kartları**: Detaylı iş takibi, alt işler, durum yönetimi, önem seviyesi icon'ları
- **İş Türleri ve Öncelikler**: Görev (TASK), Özellik (FEATURE), Hata (BUG) / Normal, Yüksek, Acil
- **Ertelendi Takibi**: Ertelenen işlerin yeni tarih bilgisi ile takibi
- **Yetişmedi Hesaplama**: Otomatik yetişmedi iş tespiti
- **Örnek Veri Ekleme**: `.env` dosyasında `SEED_SAMPLE_DATA=1` yaparak otomatik örnek veri ekleme (her ekibe 5 kullanıcı, 2025 yılı için işler ve projeler)
- **Docker Desteği**: Tam containerized yapı, yatay ölçeklendirme için hazır

## Teknoloji Stack

### Backend
- Spring Boot 3.2
- PostgreSQL 15
- Spring Security + LDAP + JWT
- Liquibase (Database Migrations)
- Java 17

### Frontend
- React 18
- TypeScript
- Vite
- React Router
- Axios
- date-fns (tarih işlemleri)
- Cascadia Mono (font)

### Infrastructure
- Docker & Docker Compose
- Nginx (Load Balancer)
- PostgreSQL

## Kurulum

### Gereksinimler
- Docker & Docker Compose
- Java 17+ (local development için)
- Node.js 20+ (local development için)

### Docker ile Çalıştırma

1. Repository'yi klonlayın:
```bash
git clone <repository-url>
cd ProjectSpring
```

2. Environment değişkenlerini ayarlayın (`.env` dosyası oluşturun):
```env
# LDAP ayarları (LDAP_ENABLED=false yaparsanız sadece local user kullanılır)
LDAP_ENABLED=true
LDAP_URLS=ldap://your-ldap-server:389
LDAP_BASE=dc=example,dc=com
LDAP_USER_SEARCH_BASE=ou=users
LDAP_USER_SEARCH_FILTER=(uid={0})
JWT_SECRET=your-secret-key-min-256-bits
```

**Not:** Database tabloları Spring Boot başlarken otomatik olarak Liquibase migration'ları ile oluşturulur. Manuel bir şey yapmanıza gerek yok.

3. Docker Compose ile başlatın:
```bash
docker-compose up -d
```

4. Uygulamaya erişin:
- Frontend: http://localhost:8000
- Backend API: http://localhost:8080

### Yatay Ölçeklendirme

Backend container'larını ölçeklendirmek için:
```bash
docker-compose up -d --scale backend=3
```

JWT kullanıldığı için session problemi olmaz. Her request stateless'tir.

### Local Development

#### Backend
```bash
cd Backend
mvn spring-boot:run
```

#### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## Veritabanı Yapısı

- `users` - Kullanıcılar (soft delete desteği ile isActive alanı)
- `roles` - Roller (ADMIN, TAKIM_LIDERI, YAZILIMCI, DEVOPS, IS_ANALISTI, TESTCI)
- `teams` - Ekipler (her ekibin kendine özel rengi ve ikonu var, soft delete desteği ile isActive alanı)
- `ldap_settings` - LDAP bağlantı ayarları (şifreli saklama)
- `projects` - Projeler (başlangıç/bitiş tarihi, durum, ekip atamaları)
- `project_teams` - Proje-Ekip ilişkisi (many-to-many)
- `tasks` - İş kartları (projeye bağlı olabilir)
- `subtasks` - Alt işler
- `task_status_history` - İş durum geçmişi
- `user_teams` - Kullanıcı-Ekip ilişkisi
- `user_roles` - Kullanıcı-Rol ilişkisi

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login (LDAP veya Local User)
- `POST /api/auth/register` - Local user oluştur
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

### Teams
- `GET /api/teams` - Ekipler listesi
- `GET /api/teams/{id}` - Ekip detayı
- `GET /api/teams/{id}/dashboard` - Ekip dashboard istatistikleri

### Tasks
- `GET /api/tasks` - İşler listesi (filtreleme: teamId, year, month)
- `GET /api/tasks/{id}` - İş detayı
- `POST /api/tasks` - Yeni iş oluştur
- `PUT /api/tasks/{id}` - İş güncelle
- `DELETE /api/tasks/{id}` - İş sil
- `PUT /api/tasks/{id}/status` - İş durumu güncelle

### Projects
- `GET /api/projects` - Projeler listesi
- `GET /api/projects/{id}` - Proje detayı
- `POST /api/projects` - Yeni proje oluştur
- `PUT /api/projects/{id}` - Proje güncelle
- `DELETE /api/projects/{id}` - Proje sil

### Calendar
- `GET /api/calendar/{year}` - Yıl bazlı takvim verisi
- `GET /api/calendar/{year}/{month}` - Ay bazlı takvim verisi

## Yetkilendirme

### Yönetici
- Tüm ekipleri görüntüleyebilir
- Tüm işleri görebilir/düzenleyebilir
- Tüm dashboard'ları görebilir

### Takım Lideri
- Sadece kendi ekibini görüntüleyebilir
- Kendi ekibinin işlerini yönetebilir
- Kendi ekibinin dashboard'unu görebilir

### Personel
- Sadece kendi ekibini görüntüleyebilir
- Kendisine atanan işleri görebilir
- Sadece kendi işlerini düzenleyebilir

## Authentication

### Varsayılan Admin Kullanıcı

Uygulama ilk başlatıldığında otomatik olarak bir admin kullanıcı oluşturulur:
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin`
- **Rol:** Yönetici (ADMIN)
- **Erişim:** Tüm ekiplere ve işlere erişim

**Önemli:** İlk girişten sonra şifrenizi değiştirmeniz önerilir.

### LDAP + Local User Hibrit Sistemi

Sistem önce LDAP'de kullanıcıyı arar, başarısız olursa database'deki local user'ları kontrol eder:

1. **LDAP Authentication** (eğer `LDAP_ENABLED=true`):
   - Kullanıcı LDAP sunucusunda aranır
   - Başarılı olursa kullanıcı database'e senkronize edilir
   - LDAP kullanıcılarının password'ü database'de saklanmaz

2. **Local User Authentication**:
   - LDAP başarısız olursa veya `LDAP_ENABLED=false` ise
   - Database'deki kullanıcılar kontrol edilir
   - Password BCrypt ile hash'lenmiş olarak saklanır

### Local User Oluşturma

```bash
POST /api/auth/register
{
  "username": "testuser",
  "email": "test@example.com",
  "fullName": "Test User",
  "password": "password123",
  "role": "YAZILIMCI"  // Optional
}
```

## Database Migration

**Otomatik Migration:** Spring Boot başlarken Liquibase migration dosyaları otomatik çalışır:
- `V1__initial_schema.xml` - Tüm tablolar oluşturulur
- `V2__seed_data.xml` - İlk roller ve ekipler eklenir
- `V3__add_password_to_users.xml` - Password kolonu eklenir
- `V4__create_admin_user.xml` - Admin kullanıcı oluşturulur
- `V5__add_subtask_fields.xml` - Alt işlere tarih ve atanan kişi alanları eklenir
- `V6__add_task_type_and_priority.xml` - İşlere tür ve öncelik alanları eklenir
- `V7__add_team_color_and_icon.xml` - Ekiplere renk ve ikon kolonları eklenir
- `V8__add_projects.xml` - Projeler tablosu ve ilişkileri oluşturulur
- `V9__add_soft_delete.xml` - Kullanıcı ve takımlara soft delete desteği (isActive alanı)
- `V10__rename_daire_baskani_to_admin.xml` - DAIRE_BASKANI rolü ADMIN olarak yeniden adlandırılır
- `V11__create_ldap_settings.xml` - LDAP ayarları tablosu oluşturulur (şifreli saklama)

Manuel bir şey yapmanıza gerek yok, uygulama ilk çalıştığında tüm tablolar otomatik oluşturulur.

## İş Durumları

- **OPEN** (Açık) - Sleuthe Yellow (#feb300)
- **IN_PROGRESS** (Yapılıyor) - Coral Pink (#ff5e6c)
- **COMPLETED** (Tamamlandı) - Teal (#94e2d5)
- **POSTPONED** (Ertelendi) - Pink Leaf (#ffaaab) (yeni tarih bilgisi ile)
- **CANCELLED** (İptal Edildi) - Gri
- **OVERDUE** (Yetişmedi) - Coral Pink (#ff5e6c)

## İş Türleri ve Öncelikler

### İş Türleri
- **TASK** (Görev) - Pink Leaf (#ffaaab)
- **FEATURE** (Özellik) - Teal (#94e2d5)
- **BUG** (Hata) - Coral Pink (#ff5e6c)

### Öncelik Seviyeleri
- **NORMAL** (Normal) - Gri, ⚪ icon
- **HIGH** (Yüksek) - Sleuthe Yellow (#feb300), 🟠 icon
- **URGENT** (Acil) - Coral Pink (#ff5e6c), 🔴 icon

## Renk Paleti

Uygulama, Catppuccin Mocha renk paletini kullanmaktadır.

- **Arka Plan**: `--ctp-base` (koyu morumsu gri)
- **Yüzeyler**: `--ctp-surface0`, `--ctp-surface1`, `--ctp-crust` (daha açık gri tonları)
- **Metin**: `--ctp-text`, `--ctp-subtext0`, `--ctp-subtext1` (açık beyaz tonları)
- **Vurgu Renkleri**: `--ctp-blue`, `--ctp-green`, `--ctp-yellow`, `--ctp-peach`, `--ctp-red` vb.

## Ekip Renkleri ve İkonları

Her ekibin kendine özel belirleyici rengi ve ikonu vardır. Bu özellik sayesinde:
- Toplu görünümlerde (Gantt Chart, Kanban Board, Takvim) ekipleri hızlıca ayırt edebilirsiniz
- Ekip seçim menüsünde görsel olarak ekipleri tanımlayabilirsiniz
- İş kartlarında hangi ekibe ait olduğunu renk ve ikon ile görebilirsiniz

`teams` tablosunda `color` (VARCHAR(7)) ve `icon` (VARCHAR(50)) kolonları bulunur. Her ekip için özel renk kodu (hex, örn: #89b4fa) ve ikon (emoji veya icon identifier) tanımlanabilir.

## Örnek Veri Ekleme

Uygulamayı test etmek için otomatik örnek veri ekleme özelliği bulunmaktadır:

1. `.env` dosyasında `SEED_SAMPLE_DATA=1` yapın
2. Backend'i yeniden başlatın: `docker-compose restart backend`

Bu özellik şunları ekler:
- Her ekibe 5 kullanıcı (1 takım lideri + 4 üye)
- 2025 yılı için her ay 15-35 arası iş
- 5 örnek proje
- İşlerin %30'unda alt görevler

**Not:** Örnek veriler sadece ilk çalıştırmada eklenir. Mevcut kullanıcılar/işler varsa tekrar eklenmez.

## Yönetim Paneli Özellikleri

### Kullanıcı Yönetimi
- Local kullanıcı oluşturma (isim, email, username, şifre)
- Kullanıcı düzenleme (roller, takımlar, admin checkbox)
- Kullanıcı silme/deaktive etme (soft delete)
- Admin rolü atama/revoke (checkbox ile)

### Takım Yönetimi
- Takım oluşturma (isim, açıklama, renk, ikon, lider)
- Takım düzenleme
- Takım silme/deaktive etme (soft delete)

### Rol Yönetimi
- Genel rol havuzu (takıma özel değil)
- Rol oluşturma, düzenleme, silme

### LDAP Yönetimi
- LDAP bağlantı ayarları (URLs, Base DN, Username, Password, User Search Base, User Search Filter)
- Ayarların şifreli saklanması (AES-256 encryption)
- Test butonu ile bağlantı kontrolü
- LDAP kullanıcı arama ve import

### Sistem Sağlığı
- Backend durumu kontrolü
- Database bağlantı kontrolü
- Frontend API erişilebilirlik kontrolü
- Otomatik yenileme (30 saniye)

## Kullanıcı Profil Sistemi

- Profil bilgileri görüntüleme (isim, email, username, roller)
- Atanan işler listesi
- İsim değiştirme
- Şifre değiştirme (eski şifre doğrulaması ile)

## UI/UX İyileştirmeleri

- **Tutarlı Checkbox Tasarımı**: Tüm checkbox'lar için genel stil (20x20px, özel checkmark, hover efektleri)
- **Görünüm Seçimi**: Dropdown yerine yan yana butonlar
- **Hafta Sonu Görünümü**: Takvim görünümünde hafta sonu günleri soluk
- **Proje Uyarı Sistemi**: Bitim tarihine 1 gün kalan projeler yanıp söner

## Lisans

GNU General Public License v3.0
