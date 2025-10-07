// Manages cached UI elements for efficient access
class UIElements {
  constructor() {
    this.cache = {};
  }
  
  get(id) {
    if (!this.cache[id]) {
      this.cache[id] = document.getElementById(id);
      if (!this.cache[id]) {
        console.warn(`Element with ID '${id}' not found`);
      }
    }
    return this.cache[id];
  }
  
  getByClass(className) {
    const key = `class_${className}`;
    if (!this.cache[key]) {
      this.cache[key] = document.getElementsByClassName(className);
    }
    return this.cache[key];
  }
}

// Application-wide constants
const CONSTANTS = {
  RECOVERY_TIMEOUT: 900000,
  MIN_PASSWORD_LENGTH: 8,
  MAX_PASSWORD_LENGTH: 12,
  MIN_ANSWER_LENGTH: 5,
  MAX_ANSWER_LENGTH: 20,
  MIN_QUESTION_LENGTH: 10,
  MIN_STRENGTH_SCORE: 6
};

// Displays notifications and alerts to the user
class NotificationManager {
  static show(message, type = 'info') {
    alert(message);
  }
  
  static error(message) {
    this.show(message, 'error');
  }
  
  static success(message) {
    this.show(message, 'success');
  }
  
  static warning(message) {
    this.show(message, 'warning');
  }
}

// Utility functions for form handling and validation
class FormUtils {
  static getValues(fieldIds) {
    return fieldIds.reduce((values, id) => {
      values[id] = ui.get(id).value;
      return values;
    }, {});
  }
  
  static clearForm(formId) {
    ui.get(formId).reset();
  }
  
  static validateRequired(values) {
    return Object.values(values).every(value => value && value.trim());
  }
  
  static validatePasswordLength(password) {
    return password.length >= CONSTANTS.MIN_PASSWORD_LENGTH && 
           password.length <= CONSTANTS.MAX_PASSWORD_LENGTH;
  }
  
  static validateAnswerLength(answer) {
    return answer.length >= CONSTANTS.MIN_ANSWER_LENGTH && 
           answer.length <= CONSTANTS.MAX_ANSWER_LENGTH;
  }
  
  static validateQuestionLength(question) {
    return question.length >= CONSTANTS.MIN_QUESTION_LENGTH;
  }
}

// Utility for showing and hiding modals
class ModalManager {
  static show(modalId) {
    ui.get(modalId).style.display = "flex";
  }
  
  static hide(modalId) {
    ui.get(modalId).style.display = "none";
  }
  
  static setupModal(modalId, openButtonId, closeButtonClass = "close") {
    const modal = ui.get(modalId);
  if (!modal) return; // Modal not found, skip setup
    
    const openButton = openButtonId ? ui.get(openButtonId) : null;
    const closeButtons = ui.getByClass(closeButtonClass);
    
    if (openButton) {
      openButton.onclick = () => this.show(modalId);
    }
    
    if (closeButtons && closeButtons.length > 0) {
      Array.from(closeButtons).forEach(btn => {
        btn.onclick = () => this.hide(modalId);
      });
    }
    
    window.onclick = (event) => {
      if (event.target === modal) {
        this.hide(modalId);
      }
    };
  }
}

// Password validation and strength calculation utilities
class PasswordUtils {
  static checkRequirements(password) {
    return {
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special_character: /[^a-zA-Z0-9]/.test(password)
    };
  }
  
  static calculateStrength(password) {
    const checks = [
      /\d/.test(password),
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\W/.test(password)
    ];
    
    const strength = checks.filter(Boolean).length;
    
    if (checks.every(Boolean)) {
      return strength + Math.floor((password.length / 4) ** 2);
    }
    
    return "weak";
  }
  
  static showStrength(elementId) {
    const password = ui.get(elementId).value;
    const strength = this.calculateStrength(password);
    const message = (strength === "weak" || strength < CONSTANTS.MIN_STRENGTH_SCORE) 
                    ? "Password is weak" 
                    : "Password is strong";
    NotificationManager.show(message);
  }
}

const ui = new UIElements();