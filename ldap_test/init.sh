#!/bin/bash

# LDAP test kullanıcılarını ekleme scripti
# LDAP container başladıktan sonra manuel olarak çalıştırılır:
# docker exec ldap-test bash /init-users.sh

set -e

echo "=== LDAP Test Kullanıcıları Ekleme Scripti ==="
echo ""

# LDAP'ın hazır olup olmadığını kontrol et
echo "LDAP bağlantısı kontrol ediliyor..."
if ! ldapsearch -x -H ldap://localhost -b dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123 > /dev/null 2>&1; then
    echo "HATA: LDAP sunucusuna bağlanılamıyor. Lütfen LDAP container'ının çalıştığından emin olun."
    exit 1
fi

echo "LDAP bağlantısı başarılı!"
echo ""

# Users OU oluştur (eğer yoksa)
echo "ou=users OU oluşturuluyor..."
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: ou=users,dc=test,dc=local
objectClass: organizationalUnit
ou: users
EOF

# Groups OU oluştur (eğer yoksa)
echo "ou=groups OU oluşturuluyor..."
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: ou=groups,dc=test,dc=local
objectClass: organizationalUnit
ou: groups
EOF

echo ""

# ldap_user1 ekle
echo "ldap_user1 ekleniyor..."
ldapdelete -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 "uid=ldap_user1,ou=users,dc=test,dc=local" 2>/dev/null || true
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: uid=ldap_user1,ou=users,dc=test,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: ldap_user1
sn: User
givenName: LDAP
cn: LDAP User One
displayName: LDAP User One
uidNumber: 10010
gidNumber: 10010
gecos: LDAP User One
loginShell: /bin/bash
homeDirectory: /home/ldap_user1
mail: ldap_user1@test.local
EOF
ldappasswd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 -s ldappass123 "uid=ldap_user1,ou=users,dc=test,dc=local" 2>/dev/null || true

# ldap_user2 ekle
echo "ldap_user2 ekleniyor..."
ldapdelete -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 "uid=ldap_user2,ou=users,dc=test,dc=local" 2>/dev/null || true
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: uid=ldap_user2,ou=users,dc=test,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: ldap_user2
sn: User
givenName: LDAP
cn: LDAP User Two
displayName: LDAP User Two
uidNumber: 10011
gidNumber: 10011
gecos: LDAP User Two
loginShell: /bin/bash
homeDirectory: /home/ldap_user2
mail: ldap_user2@test.local
EOF
ldappasswd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 -s ldappass123 "uid=ldap_user2,ou=users,dc=test,dc=local" 2>/dev/null || true

# testuser1 ekle
echo "testuser1 ekleniyor..."
ldapdelete -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 "uid=testuser1,ou=users,dc=test,dc=local" 2>/dev/null || true
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: uid=testuser1,ou=users,dc=test,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: testuser1
sn: Test
givenName: User
cn: Test User One
displayName: Test User One
uidNumber: 10000
gidNumber: 10000
gecos: Test User One
loginShell: /bin/bash
homeDirectory: /home/testuser1
mail: testuser1@test.local
EOF
ldappasswd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 -s testpass123 "uid=testuser1,ou=users,dc=test,dc=local" 2>/dev/null || true

# testuser2 ekle
echo "testuser2 ekleniyor..."
ldapdelete -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 "uid=testuser2,ou=users,dc=test,dc=local" 2>/dev/null || true
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: uid=testuser2,ou=users,dc=test,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: testuser2
sn: Test
givenName: User
cn: Test User Two
displayName: Test User Two
uidNumber: 10001
gidNumber: 10001
gecos: Test User Two
loginShell: /bin/bash
homeDirectory: /home/testuser2
mail: testuser2@test.local
EOF
ldappasswd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 -s testpass123 "uid=testuser2,ou=users,dc=test,dc=local" 2>/dev/null || true

# adminuser ekle
echo "adminuser ekleniyor..."
ldapdelete -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 "uid=adminuser,ou=users,dc=test,dc=local" 2>/dev/null || true
ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF 2>/dev/null || true
dn: uid=adminuser,ou=users,dc=test,dc=local
objectClass: inetOrgPerson
objectClass: posixAccount
objectClass: shadowAccount
uid: adminuser
sn: Admin
givenName: User
cn: Admin User
displayName: Admin User
uidNumber: 10002
gidNumber: 10002
gecos: Admin User
loginShell: /bin/bash
homeDirectory: /home/adminuser
mail: adminuser@test.local
EOF
ldappasswd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 -s adminpass123 "uid=adminuser,ou=users,dc=test,dc=local" 2>/dev/null || true

echo ""
echo "=== Test Kullanıcıları Başarıyla Eklendi ==="
echo ""
echo "Oluşturulan kullanıcılar:"
echo "  - ldap_user1 / Password: ldappass123"
echo "  - ldap_user2 / Password: ldappass123"
echo "  - testuser1 / Password: testpass123"
echo "  - testuser2 / Password: testpass123"
echo "  - adminuser / Password: adminpass123"
echo ""
