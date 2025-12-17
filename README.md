# ProjectSpring

ProjectSpring — Takımlar için takvim odaklı proje ve görev yönetim platformu.

## Özellikler

- **Çok Seviyeli Yetkilendirme**: Yönetici, Takım Lideri ve Personel rolleri
- **Hibrit Authentication**: Hem LDAP hem de Local User desteği (LDAP önce denenir, başarısız olursa local user kontrol edilir)
- **JWT Authentication**: Stateless authentication (session problemi yok, yatay ölçeklendirme için uygun)
- **Otomatik Database Migration**: Liquibase ile veritabanı şeması otomatik oluşturulur
- **Takvim Görünümü**: Yıl/Ay/Hafta bazlı iş takibi
- **Ekip Dashboard**: Gerçek zamanlı istatistikler
- **İş Kartları**: Detaylı iş takibi, alt işler, durum yönetimi
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
- `teams` - Ekipler
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

Manuel bir şey yapmanıza gerek yok, uygulama ilk çalıştığında tüm tablolar otomatik oluşturulur.

## İş Durumları

- **OPEN** (Açık) - Sarı
- **IN_PROGRESS** (Yapılıyor) - Mavi
- **COMPLETED** (Tamamlandı) - Yeşil
- **POSTPONED** (Ertelendi) - Turuncu (yeni tarih bilgisi ile)
- **CANCELLED** (İptal Edildi) - Gri
- **OVERDUE** (Yetişmedi) - Kırmızı

## Lisans

GNU General Public License v3.0
