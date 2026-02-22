package com.projectspring.model.enums;

public enum TaskStatus {
    OPEN,           // Açık - Sarı
    IN_PROGRESS,    // Yapılıyor - Mavi
    TESTING,        // Test Aşamasında - Mor
    COMPLETED,      // Tamamlandı - Yeşil
    POSTPONED,      // Ertelendi - Turuncu
    CANCELLED,      // İptal Edildi - Gri
    OVERDUE         // Yetişmedi - Kırmızı
}
