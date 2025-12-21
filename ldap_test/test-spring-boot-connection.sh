#!/bin/bash

# Spring Boot uygulamasından LDAP bağlantısını test et

echo "=== Spring Boot LDAP Bağlantı Testi ==="
echo ""

# LDAP sunucusunun çalışıp çalışmadığını kontrol et
if ! docker ps | grep -q ldap-test; then
    echo "✗ LDAP sunucusu çalışmıyor. 'docker-compose up -d' komutu ile başlatın."
    exit 1
fi

echo "✓ LDAP sunucusu çalışıyor"
echo ""

# Test kullanıcısı ile kimlik doğrulama testi
echo "Test kullanıcısı ile kimlik doğrulama testi..."
docker exec ldap-test ldapsearch -x -H ldap://localhost -b ou=users,dc=test,dc=local -D "uid=testuser1,ou=users,dc=test,dc=local" -w testpass123 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Test kullanıcı kimlik doğrulaması başarılı (testuser1 / testpass123)"
else
    echo "✗ Test kullanıcı kimlik doğrulaması başarısız"
    echo "Test kullanıcıları eklenmemiş olabilir. './init-ldap.sh' komutunu çalıştırın."
    exit 1
fi

echo ""
echo "=== Spring Boot Yapılandırması ==="
echo ""
echo "application.yml veya environment variables:"
echo "  spring.ldap.urls: ldap://localhost:389"
echo "  spring.ldap.base: dc=test,dc=local"
echo "  spring.ldap.username: cn=admin,dc=test,dc=local"
echo "  spring.ldap.password: admin123"
echo "  spring.ldap.user-search-base: ou=users"
echo "  spring.ldap.user-search-filter: (uid={0})"
echo ""
echo "Test kullanıcıları:"
echo "  - testuser1 / testpass123"
echo "  - testuser2 / testpass123"
echo "  - adminuser / adminpass123"
echo ""
echo "=== Test Tamamlandı ==="

