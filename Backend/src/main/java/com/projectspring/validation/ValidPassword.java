package com.projectspring.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.*;

@Target({ElementType.FIELD, ElementType.PARAMETER})
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = PasswordValidator.class)
@Documented
public @interface ValidPassword {
    String message() default "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one digit";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

