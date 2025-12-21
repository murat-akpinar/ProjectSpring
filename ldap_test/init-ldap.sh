#!/bin/bash

# LDAP sunucusu başladıktan sonra test kullanıcılarını ekle

echo "LDAP sunucusu başlatılıyor..."
docker-compose up -d ldap

echo "LDAP sunucusunun hazır olması bekleniyor..."
sleep 20

echo "Test kullanıcıları ekleniyor..."

# Users OU
docker exec ldap-test ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF
dn: ou=users,dc=test,dc=local
objectClass: organizationalUnit
ou: users
EOF

# Groups OU
docker exec ldap-test ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF
dn: ou=groups,dc=test,dc=local
objectClass: organizationalUnit
ou: groups
EOF

# Test User 1
docker exec ldap-test ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF
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
userPassword: testpass123
gecos: Test User One
loginShell: /bin/bash
homeDirectory: /home/testuser1
mail: testuser1@test.local
EOF

# Test User 2
docker exec ldap-test ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF
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
userPassword: testpass123
gecos: Test User Two
loginShell: /bin/bash
homeDirectory: /home/testuser2
mail: testuser2@test.local
EOF

# Admin User
docker exec ldap-test ldapadd -x -H ldap://localhost -D "cn=admin,dc=test,dc=local" -w admin123 <<EOF
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
userPassword: adminpass123
gecos: Admin User
loginShell: /bin/bash
homeDirectory: /home/adminuser
mail: adminuser@test.local
EOF

echo "Test kullanıcıları eklendi!"
echo ""
echo "Bağlantı testi yapılıyor..."
docker exec ldap-test ldapsearch -x -H ldap://localhost -b ou=users,dc=test,dc=local -D "cn=admin,dc=test,dc=local" -w admin123 | grep "dn: uid="

