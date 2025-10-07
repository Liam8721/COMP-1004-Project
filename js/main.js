// Main application entry point
var user_manager = new User_Manager();

// Initialize application and UI
window.onload = function () {
  user_manager.load_accounts();
  AuthenticationUI.display_login_screen();
  
  // Register event handlers
  ModalManager.setupModal("add_password_modal", "add_password_button");
  PasswordUI.setupEventHandlers();
  SettingsUI.setupEventHandlers();
  
  // Register modal close buttons
  ModalManager.setupModal("saved_passwords_modal", null, "close");
  ModalManager.setupModal("master_password_modal", null, "close");
  ModalManager.setupModal("security_questions_modal", null, "close");
  ModalManager.setupModal("recovery_key_modal", null, "close");
  ModalManager.setupModal("reset_password_modal", null, "close");
  ModalManager.setupModal("forgot_both_modal", null, "close");
  
  // Handle user logout
  ui.get("sign_out_button").onclick = function () {
    user_manager.logout();
    AuthenticationUI.display_login_screen();
    reset_ui();
  };
};