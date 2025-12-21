#!/bin/bash

# LDAP Bağlantı Test Scripti

echo "=== LDAP Bağlantı Testi ==="
echo ""

# LDAP sunucusunun çalışıp çalışmadığını kontrol et
echo "1. LDAP sunucusu durumu kontrol ediliyor..."
if docker ps | grep -q ldap-test; then
    echo "✓ LDAP sunucusu çalışıyor"
else
    echo "✗ LDAP sunucusu çalışmıyor. 'docker-compose up -d' komutu ile başlatın."
    exit 1
fi

echo ""
echo "2. LDAP bağlantısı test ediliyor..."
docker exec ldap-test ldapsearch -x -H ldap://localhost -b dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ LDAP bağlantısı başarılı"
else
    echo "✗ LDAP bağlantısı başarısız"
    exit 1
fi

echo ""
echo "3. Test kullanıcıları listeleniyor..."
docker exec ldap-test ldapsearch -x -H ldap://localhost -b ou=users,dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123 | grep "dn: uid="

echo ""
echo "4. Test kullanıcı kimlik doğrulaması..."
docker exec ldap-test ldapsearch -x -H ldap://localhost -b ou=users,dc=test,dc=local -D "uid=testuser1,ou=users,dc=test,dc=local" -w testpass123 > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✓ Test kullanıcı kimlik doğrulaması başarılı (testuser1)"
else
    echo "✗ Test kullanıcı kimlik doğrulaması başarısız"
fi

echo ""
echo "=== Test Tamamlandı ==="
echo ""
echo "phpLDAPadmin: http://localhost:8082"
echo "Login DN: cn=admin,dc=test,dc=local"
echo "Password: admin123"

