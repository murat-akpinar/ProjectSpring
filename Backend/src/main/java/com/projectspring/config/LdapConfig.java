package com.projectspring.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.ldap.core.LdapTemplate;
import org.springframework.ldap.core.support.LdapContextSource;

@Configuration
public class LdapConfig {
    
    @Value("${spring.ldap.urls}")
    private String ldapUrls;
    
    @Value("${spring.ldap.base}")
    private String ldapBase;
    
    @Value("${spring.ldap.username:}")
    private String ldapUsername;
    
    @Value("${spring.ldap.password:}")
    private String ldapPassword;
    
    @Bean
    public LdapContextSource contextSource() {
        LdapContextSource contextSource = new LdapContextSource();
        contextSource.setUrl(ldapUrls);
        contextSource.setBase(ldapBase);
        
        if (ldapUsername != null && !ldapUsername.isEmpty()) {
            contextSource.setUserDn(ldapUsername);
        }
        
        if (ldapPassword != null && !ldapPassword.isEmpty()) {
            contextSource.setPassword(ldapPassword);
        }
        
        contextSource.afterPropertiesSet();
        return contextSource;
    }
    
    @Bean
    public LdapTemplate ldapTemplate() {
        return new LdapTemplate(contextSource());
    }
}

