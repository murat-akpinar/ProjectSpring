# ProjectSpring

ProjectSpring — Takımlar için takvim odaklı proje ve görev yönetim platformu.

## Özellikler

- **Çok Seviyeli Yetkilendirme**: Yönetici, Takım Lideri ve Personel rolleri
- **Hibrit Authentication**: Hem LDAP hem de Local User desteği (LDAP önce denenir, başarısız olursa local user kontrol edilir)
- **JWT Authentication**: Stateless authentication (session problemi yok, yatay ölçeklendirme için uygun)
- **Otomatik Database Migration**: Liquibase ile veritabanı şeması otomatik oluşturulur
- **Çoklu Görünüm Modları**: 
  - Takvim Görünümü: Günlük takvim görünümü, hafta sonu günleri soluk
  - Gantt Chart: Timeline bazlı Gantt chart, hafta seçimi, hiyerarşik subtask desteği
  - Kanban Board: Status bazlı Kanban board, her takım için ayrı
- **Aylık Görünüm**: 12 ay grid görünümü, mevsim renkleri ile
- **Ekip Renkleri ve İkonları**: Her ekibin kendine özel belirleyici rengi ve ikonu var, toplu görünümde ekipleri ayırmak kolay
- **Ekip Dashboard**: Gerçek zamanlı istatistikler
- **İş Kartları**: Detaylı iş takibi, alt işler, durum yönetimi, önem seviyesi icon'ları
- **İş Türleri ve Öncelikler**: Görev (TASK), Özellik (FEATURE), Hata (BUG) / Normal, Yüksek, Acil
- **Ertelendi Takibi**: Ertelenen işlerin yeni tarih bilgisi ile takibi
- **Yetişmedi Hesaplama**: Otomatik yetişmedi iş tespiti
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

- `users` - Kullanıcılar
- `roles` - Roller (DAIRE_BASKANI, TAKIM_LIDERI, YAZILIMCI, DEVOPS, IS_ANALISTI, TESTCI)
- `teams` - Ekipler (her ekibin kendine özel rengi ve ikonu var)
- `tasks` - İş kartları
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
- **Rol:** Yönetici (DAIRE_BASKANI)
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
- `V7__add_team_color_and_icon.xml` - Ekiplere renk ve ikon kolonları eklenir (planlanan)

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

**Planlanan Özellik:** `teams` tablosuna `color` (VARCHAR) ve `icon` (VARCHAR) kolonları eklenecek. Her ekip için özel renk kodu (hex) ve ikon (emoji veya icon identifier) tanımlanabilecek.

## Lisans

GNU General Public License v3.0
