# LDAP Test Environment

Bu dizin, `test.local` domain'i için bir LDAP test ortamı içerir. LDAP sunucusu ana projenin Docker network'üne bağlıdır.

## Yapılandırma

- **Domain**: test.local
- **Base DN**: dc=test,dc=local
- **Admin DN**: cn=admin,dc=test,dc=local
- **Admin Password**: admin123
- **Network**: `projectspring_projectspring-network` (ana proje ile aynı network)

## Servisler

1. **OpenLDAP** (Port 389, 636)
   - LDAP sunucusu
   - Hostname: ldap.test.local
   - Container adı: `ldap-test`
   - Host'tan erişim: localhost:389
   - Docker network içinden: `ldap-test:389`

2. **phpLDAPadmin** (Port 8082)
   - Web tabanlı LDAP yönetim arayüzü
   - URL: http://localhost:8082

## Kullanım

### 1. LDAP Sunucusunu Başlatma

**Önce ana projeyi başlatın:**
```bash
cd /home/shyuuhei/GIT/ProjectSpring
docker-compose up -d
```

**Sonra LDAP test sunucusunu başlatın:**
```bash
cd ldap_test
docker-compose up -d
```

### 2. Test Kullanıcılarını Ekleme

```bash
./init-ldap.sh
```

Bu script LDAP sunucusunu başlatır ve test kullanıcılarını ekler.

### 3. phpLDAPadmin ile Bağlanma

1. Tarayıcıda http://localhost:8082 adresine gidin
2. Login:
   - Server: ldap
   - Login DN: cn=admin,dc=test,dc=local
   - Password: admin123

### 4. Test Kullanıcıları

Aşağıdaki test kullanıcıları otomatik olarak oluşturulur:

- **testuser1**
  - Password: testpass123
  - DN: uid=testuser1,ou=users,dc=test,dc=local

- **testuser2**
  - Password: testpass123
  - DN: uid=testuser2,ou=users,dc=test,dc=local

- **adminuser**
  - Password: adminpass123
  - DN: uid=adminuser,ou=users,dc=test,dc=local

### 5. LDAP Bağlantı Testi (ldapsearch)

```bash
# Container içinden test
docker exec -it ldap-test ldapsearch -x -H ldap://localhost -b dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123

# Backend container'ından test
docker exec projectspring-backend sh -c "apk add --no-cache openldap-clients && ldapsearch -x -H ldap://ldap-test:389 -b dc=test,dc=local -D 'cn=admin,dc=test,dc=local' -w admin123"

# Dışarıdan test (eğer ldapsearch yüklüyse)
ldapsearch -x -H ldap://localhost:389 -b dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123
```

### 6. Spring Boot Uygulamasından Bağlanma

**Önemli:** LDAP test sunucusu ana projenin Docker network'üne (`projectspring_projectspring-network`) bağlıdır. Bu sayede backend container'ı doğrudan `ldap-test:389` adresini kullanarak bağlanabilir.

**Docker Compose ile çalışırken:**

Ana projenin `docker-compose.yml` dosyasında backend servisi için aşağıdaki environment variable'ları kullanın (varsayılan değerler zaten ayarlanmış):

```yaml
LDAP_ENABLED: "true"
LDAP_URLS: "ldap://ldap-test:389"  # Container adı ile bağlanma
LDAP_BASE: "dc=test,dc=local"
LDAP_USERNAME: "cn=admin,dc=test,dc=local"
LDAP_PASSWORD: "admin123"
LDAP_USER_SEARCH_BASE: "ou=users"
LDAP_USER_SEARCH_FILTER: "(uid={0})"
```

**Admin Panel'den Test:**

1. Admin panel → LDAP Ayarları
2. Aşağıdaki bilgileri girin:
   - **URLs**: `ldap://ldap-test:389` (Docker içinden) veya `ldap://localhost:389` (host'tan test için)
   - **Base**: `dc=test,dc=local`
   - **Username**: `cn=admin,dc=test,dc=local`
   - **Password**: `admin123`
   - **User Search Base**: `ou=users`
   - **User Search Filter**: `(uid={0})`
3. "Bağlantıyı Test Et" butonuna tıklayın

**Not:** Admin panel'den test ederken, eğer backend container içinden bağlanıyorsa `ldap://ldap-test:389` kullanın. Host makineden test ediyorsanız `ldap://localhost:389` kullanabilirsiniz.

**Local olarak çalışırken (application.yml):**

```yaml
spring:
  ldap:
    urls: ldap://localhost:389
    base: dc=test,dc=local
    username: cn=admin,dc=test,dc=local
    password: admin123
    user-search-base: ou=users
    user-search-filter: (uid={0})
```

### 7. Bağlantı Testi

```bash
# Test scripti çalıştır
./test-connection.sh

# Spring Boot bağlantı testi
./test-spring-boot-connection.sh
```

## Durdurma

```bash
docker-compose down
```

## Verileri Temizleme

```bash
docker-compose down -v
```

## Notlar

- LDAP verileri Docker volume'lerinde saklanır (`ldap_data`, `ldap_config`)
- Yeni kullanıcılar için `init-ldap.sh` scriptini düzenleyebilir veya phpLDAPadmin üzerinden ekleyebilirsiniz
- LDAP test sunucusu `projectspring_projectspring-network` network'üne bağlıdır, bu yüzden backend container'ı doğrudan `ldap-test:389` adresini kullanarak bağlanabilir
- Ana projeyi başlatmadan önce LDAP test sunucusunu başlatmanız önerilir
