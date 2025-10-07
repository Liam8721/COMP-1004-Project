// Handles UI events and manages authentication screens

class AuthenticationUI {
  static display_login_screen() {
    const login_screen = ui.get("login_modal");
    const create_new_account_button = ui.get("create_new_account");
    const login_button = ui.get("login_button");
    const forgot_credential_button = ui.get("forgot_credentials_button");
    const login_form = ui.get("login_form");

    login_screen.style.display = "flex";

    create_new_account_button.onclick = function () {
      ModalManager.hide("login_modal");
      FormUtils.clearForm("login_form");
      AuthenticationUI.display_create_new_account_screen();
    };

    login_button.onclick = async function () {
      const values = FormUtils.getValues(["login_username", "login_password"]);
      
      if (!FormUtils.validateRequired(values)) {
        NotificationManager.error("Please enter a username and password");
        return;
      }

      await user_manager.login(values.login_username, values.login_password);

      if (user_manager.current_user) {
        ModalManager.hide("login_modal");
        FormUtils.clearForm("login_form");
        AuthenticationUI.initialise_user_environment();
      } else {
        NotificationManager.error("Invalid username or password.");
      }
    };

    forgot_credential_button.onclick = function () {
      ModalManager.hide("login_modal");
      FormUtils.clearForm("login_form");
      AuthenticationUI.display_forgot_credentials_screen();
    };
  }

  static display_create_new_account_screen() {
    const sign_up_button = ui.get("sign_up_button");
    const back_button = ui.get("create_account_back_button");
    const create_new_account_screen = ui.get("create_new_account_modal");

    ModalManager.show("create_new_account_modal");

    back_button.onclick = function () {
      ModalManager.hide("create_new_account_modal");
      FormUtils.clearForm("create_account_form");
      AuthenticationUI.display_login_screen();
    };

    sign_up_button.onclick = function () {
      const values = FormUtils.getValues(["create_account_username", "create_account_password"]);
      
      if (!FormUtils.validateRequired(values) || 
          !FormUtils.validatePasswordLength(values.create_account_password)) {
        NotificationManager.error("Please enter a valid username and password");
        return;
      }

      const password_requirements = User_Manager.check_password_requirements(values.create_account_password);
      const check_username = User_Manager.check_username_requirements(values.create_account_username);
      const isPasswordValid = Object.values(password_requirements).every(req => req);

      if (isPasswordValid && check_username) {
        ModalManager.hide("create_new_account_modal");
        FormUtils.clearForm("create_account_form");
        AuthenticationUI.display_create_security_questions_screen(
          values.create_account_username, 
          values.create_account_password
        );
      } else if (check_username) {
        NotificationManager.error("Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character.");
      }
    };
  }

  static display_create_security_questions_screen(username, password) {
    const back_button = ui.get("create_security_questions_back_button");
    const submit_button = ui.get("submit_new_security_questions");

    ModalManager.show("create_security_questions_modal");

    back_button.onclick = function () {
      ModalManager.hide("create_security_questions_modal");
      FormUtils.clearForm("create_security_questions_form");
      AuthenticationUI.display_login_screen();
    };

    submit_button.onclick = async function () {
      const values = FormUtils.getValues([
        "new_question_1", "new_question_2", "new_answer_1", "new_answer_2"
      ]);

      const isValidSecurityData = FormUtils.validateRequired(values) &&
                                  FormUtils.validateAnswerLength(values.new_answer_1) &&
                                  FormUtils.validateAnswerLength(values.new_answer_2) &&
                                  FormUtils.validateQuestionLength(values.new_question_1) &&
                                  FormUtils.validateQuestionLength(values.new_question_2);

      if (isValidSecurityData) {
        await user_manager.create_user(
          username, password, 
          values.new_question_1, values.new_question_2, 
          values.new_answer_1, values.new_answer_2
        );

        ModalManager.hide("create_security_questions_modal");
        FormUtils.clearForm("create_security_questions_form");
        AuthenticationUI.display_login_screen();
        user_manager.current_user = null;
      } else {
        NotificationManager.error("Please enter valid security questions and answers");
      }
    };
  }

  static display_forgot_credentials_screen() {
    ModalManager.show("forgot_credentials_modal");
    
    const back_button = ui.get("forgot_credentials_back_button");
    const forgot_password_button = ui.get("forgot_password_button");
    const forgot_username_button = ui.get("forgot_username_button");
    const forgot_both_button = ui.get("forgot_both_button");

    back_button.onclick = function () {
      ModalManager.hide("forgot_credentials_modal");
      AuthenticationUI.display_login_screen();
    };

    forgot_password_button.onclick = function () {
      ModalManager.hide("forgot_credentials_modal");
      AuthenticationUI.display_forgot_password_screen();
    };

    forgot_username_button.onclick = function () {
      ModalManager.hide("forgot_credentials_modal");
      AuthenticationUI.display_forgot_username_screen();
    };

    forgot_both_button.onclick = function () {
      ModalManager.hide("forgot_credentials_modal");
      AuthenticationUI.display_forgot_both_screen();
    };
  }

  static display_forgot_password_screen() {
    ModalManager.show("forgot_password_modal");
    
    const submit_button = ui.get("forgot_password_submit_username");
    const back_button = ui.get("back_button_forgot_password");

    back_button.onclick = function () {
      ModalManager.hide("forgot_password_modal");
      FormUtils.clearForm("forgot_password_form");
      AuthenticationUI.display_forgot_credentials_screen();
    };

    submit_button.onclick = function () {
      const username = ui.get("forgot_password_username").value;
      
      if (user_manager.check_username(username)) {
        ModalManager.hide("forgot_password_modal");
        FormUtils.clearForm("forgot_password_form");
        AuthenticationUI.display_security_questions_screen("forgot_password");
      }
    };
  }

  static display_forgot_username_screen() {
    ModalManager.show("forgot_username_modal");
    
    const submit_button = ui.get("forgot_username_submit_password");
    const back_button = ui.get("back_button_forgot_username");

    back_button.onclick = function () {
      ModalManager.hide("forgot_username_modal");
      FormUtils.clearForm("forgot_username_form");
      AuthenticationUI.display_forgot_credentials_screen();
    };

    submit_button.onclick = async function () {
      const recovery_key = ui.get("forgot_username_password").value;
      
      if (!recovery_key) {
        NotificationManager.error("Please enter your recovery key");
        return;
      }

      const success = await User_Manager.retrieve_username_by_recovery_key(recovery_key);
      if (success) {
        ModalManager.hide("forgot_username_modal");
        FormUtils.clearForm("forgot_username_form");
        AuthenticationUI.display_login_screen();
      }
    };
  }

  static display_forgot_both_screen() {
    ModalManager.show("forgot_both_modal");
    
    const submit_button = ui.get("forgot_both_submit_button");
    const back_button = ui.get("forgot_both_back_button");

    back_button.onclick = function () {
      ModalManager.hide("forgot_both_modal");
      FormUtils.clearForm("forgot_both_form");
      AuthenticationUI.display_forgot_credentials_screen();
    };

    submit_button.onclick = async function () {
      const recovery_key = ui.get("forgot_both_recovery_key").value;
      
      if (!recovery_key) {
        NotificationManager.error("Please enter your recovery key");
        return;
      }

      const user = await User_Manager.find_user_by_recovery_key(recovery_key);
      if (user) {
  // Save user for security questions verification
        user_manager.current_user = user;
        
        ModalManager.hide("forgot_both_modal");
        FormUtils.clearForm("forgot_both_form");
        
  // Display username and continue to password reset
        NotificationManager.success(`Your username is ${user.username}`);
        
  // Pause briefly before showing security questions
        setTimeout(() => {
          AuthenticationUI.display_security_questions_screen("forgot_both");
        }, 2000);
      }
    };
  }

  static display_security_questions_screen(previous_screen) {
    ModalManager.show("security_questions_modal");
    
    const submit_button = ui.get("submit_security_answers_button");
    const back_button = ui.get("security_questions_back_button");
    const question_1_label = document.querySelector('label[for="question_1_security_questions"]');
    const question_2_label = document.querySelector('label[for="question_2_security_questions"]');

    if (user_manager.current_user) {
      question_1_label.textContent = user_manager.current_user.security_question1;
      question_2_label.textContent = user_manager.current_user.security_question2;
    }

    back_button.onclick = function () {
      ModalManager.hide("security_questions_modal");
      FormUtils.clearForm("security_questions_form");
      AuthenticationUI.display_login_screen();
      user_manager.current_user = null;
    };

    submit_button.onclick = async function () {
      const values = FormUtils.getValues(["question_1_security_questions", "question_2_security_questions"]);
      
      if (!FormUtils.validateRequired(values)) {
        NotificationManager.error("Please enter both security answers");
        return;
      }

      const correct = await user_manager.check_security_answers(
        values.question_1_security_questions, 
        values.question_2_security_questions
      );
      
      if (correct) {
        ModalManager.hide("security_questions_modal");
        FormUtils.clearForm("security_questions_form");
        NotificationManager.success("Security answers correct!");
        
        if (previous_screen === "forgot_username") {
          AuthenticationUI.display_recovery_key_screen();
        } else if (previous_screen === "forgot_password") {
          AuthenticationUI.display_reset_password_screen();
        } else if (previous_screen === "forgot_both") {
          AuthenticationUI.display_reset_password_screen();
        }
      } else {
        NotificationManager.error("Incorrect security answers.");
      }
    };
  }

  static display_recovery_key_screen() {
    ModalManager.show("recovery_key_modal");
    
    const submit_button = ui.get("recovery_key_submit_button");
    const back_button = ui.get("recovery_key_back_button");

    back_button.onclick = function () {
      ModalManager.hide("recovery_key_modal");
      AuthenticationUI.display_login_screen();
    };

    submit_button.onclick = async function () {
      const recovery_key_input = ui.get("recovery_key_input").value;
      const correct_recovery_key = sessionStorage.getItem("recovery_key");

      if (recovery_key_input === correct_recovery_key) {
        sessionStorage.removeItem("recovery_key");
        
  // Find and show username for recovery
        const all_users = JSON.parse(localStorage.getItem("accounts"));
        for (const user of all_users) {
          try {
            const user_recovery_key = await Crypto_Web_API.decrypt_recovery_key(
              user.encrypted_recovery_data, 
              user.combined_answers_hash
            );
            if (user_recovery_key === recovery_key_input) {
              NotificationManager.success(`Your username is ${user.username}`);
              break;
            }
          } catch (error) {
            continue;
          }
        }
        
        ModalManager.hide("recovery_key_modal");
        FormUtils.clearForm("recovery_key_form");
        AuthenticationUI.display_login_screen();
      } else {
        NotificationManager.error("Incorrect recovery key. Please try again.");
      }
    };
  }

  static display_reset_password_screen() {
    ModalManager.show("reset_password_modal");
    
    const submit_button = ui.get("reset_password_submit_button");
    const back_button = ui.get("reset_password_back_button");

    back_button.onclick = function () {
      ModalManager.hide("reset_password_modal");
      AuthenticationUI.display_login_screen();
    };

    submit_button.onclick = async function () {
      const values = FormUtils.getValues(["new_password", "confirm_new_password"]);
      
      if (!FormUtils.validateRequired(values)) {
        NotificationManager.error("Please enter and confirm your new password");
        return;
      }

  // Check password length
      if (!FormUtils.validatePasswordLength(values.new_password)) {
        NotificationManager.error(`Password must be between ${CONSTANTS.MIN_PASSWORD_LENGTH} and ${CONSTANTS.MAX_PASSWORD_LENGTH} characters long`);
        return;
      }

  // Check password requirements
      const password_requirements = User_Manager.check_password_requirements(values.new_password);
      const isPasswordValid = Object.values(password_requirements).every(req => req);

      if (!isPasswordValid) {
        NotificationManager.error("Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character");
        return;
      }

      const validated = await user_manager.current_user.validate_password_match(
        values.new_password, 
        values.confirm_new_password
      );

      if (validated) {
        ModalManager.hide("reset_password_modal");
        FormUtils.clearForm("reset_password_form");
        location.reload();
      }
    };
  }

  static initialise_user_environment() {
    user_manager.current_user.load_passwords();
    user_manager.current_user.settings.load_settings();
    const saved_passwords = user_manager.current_user.saved_passwords;

    if (saved_passwords.length > 0) {
      let all_password_buttons = [];
      for (let index = 0; index < saved_passwords.length; index++) {
        const new_password_button = document.createElement('button');
        new_password_button.classList.add('btn', 'w-100', 'btn-block', 'password_button');
        new_password_button.textContent = saved_passwords[index].name;
        all_password_buttons.push(new_password_button);
      }
      all_password_buttons.forEach(button => ui.get("password_button_container").appendChild(button));
    }
  }
}

class PasswordUI {
  static setupEventHandlers() {
    ui.get("password_submit_button").onclick = function () {
      const values = FormUtils.getValues([
        'password_name', 'website', 'username', 'password', 'description'
      ]);

      user_manager.add_password_to_current_user(
        values.password_name, values.website, values.username, 
        values.password, values.description
      );

      const new_password_button = document.createElement('button');
      new_password_button.classList.add('btn', 'w-100', 'btn-block', 'password_button');
      new_password_button.textContent = values.password_name;
      ui.get("password_button_container").appendChild(new_password_button);

      FormUtils.clearForm("password_form");
      ModalManager.hide("add_password_modal");
    };

    ui.get("saved_passwords").addEventListener("click", function (event) {
      if (event.target.tagName === "BUTTON") {
        ModalManager.show("master_password_modal");
        PasswordUI.display_master_password_screen(event);
      }
    });

    ui.get("password_strength").onclick = () => PasswordUtils.showStrength("password");
    ui.get("saved_passwords_strength").onclick = () => PasswordUtils.showStrength("saved_passwords_modal_passwords");
    
  // Enable password strength checker for reset password if present
    const resetPasswordStrengthBtn = ui.get("reset_password_strength");
    if (resetPasswordStrengthBtn) {
      resetPasswordStrengthBtn.onclick = () => PasswordUtils.showStrength("new_password");
    }
  }

  static display_master_password_screen(event) {
    const submit_button = ui.get("master_password_submit_button");
    const back_button = ui.get("master_password_back_button");

    back_button.onclick = function () {
      ModalManager.hide("master_password_modal");
      FormUtils.clearForm("master_password_form");
    };

    submit_button.onclick = async function () {
      const master_password = ui.get("master_password").value;
      let hashed_password_input = new Uint8Array(
        await crypto.subtle.digest("SHA-256", new TextEncoder().encode(master_password))
      );
      
      if (Crypto_Web_API.compare_hashes(user_manager.current_user.passwordHash, hashed_password_input)) {
        ModalManager.hide("master_password_modal");
        FormUtils.clearForm("master_password_form");
        await PasswordUI.showPasswordDetails(event);
      } else {
        NotificationManager.error("Incorrect master password");
      }
    };
  }

  static async showPasswordDetails(event) {
    for (let index = 0; index < user_manager.current_user.saved_passwords.length; index++) {
      if (user_manager.current_user.saved_passwords[index].name == event.target.textContent) {
        let selected_password = user_manager.current_user.saved_passwords[index];
        const decrypted = await user_manager.current_user.decryptPassword(selected_password.enc_data);

        ui.get("saved_passwords_modal_name").value = selected_password.name;
        ui.get("saved_passwords_modal_username").value = selected_password.username;
        ui.get("saved_passwords_modal_passwords").value = decrypted;
        ui.get("saved_passwords_modal_website").value = selected_password.website;
        ui.get("saved_passwords_modal_description").value = selected_password.description;

        ModalManager.show("saved_passwords_modal");
        PasswordUI.setupPasswordModalHandlers(event, index);
        break;
      }
    }
  }

  static setupPasswordModalHandlers(event, index) {
    const save_button = ui.get("save_changes_button");
    const delete_password_button = ui.get("delete_password_button");

    save_button.onclick = async function () {
      const values = FormUtils.getValues([
        "saved_passwords_modal_name", "saved_passwords_modal_username",
        "saved_passwords_modal_passwords", "saved_passwords_modal_website",
        "saved_passwords_modal_description"
      ]);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const salt = crypto.getRandomValues(new Uint8Array(16));

      const baseKey = await crypto.subtle.importKey(
        "raw",
        new Uint8Array(user_manager.current_user.passwordHash),
        { name: "PBKDF2" },
        false,
        ["deriveKey"]
      );

      const encryptionKey = await crypto.subtle.deriveKey(
        {
          name: "PBKDF2",
          salt: salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        baseKey,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt"]
      );

      const encryptedPassword = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        encryptionKey,
        new TextEncoder().encode(values.saved_passwords_modal_passwords)
      );

      user_manager.current_user.saved_passwords[index] = {
        name: values.saved_passwords_modal_name,
        username: values.saved_passwords_modal_username,
        enc_data: {
          ciphertext: Array.from(new Uint8Array(encryptedPassword)),
          iv: Array.from(iv),
          salt: Array.from(salt)
        },
        website: values.saved_passwords_modal_website,
        description: values.saved_passwords_modal_description
      };

      user_manager.current_user.save_passwords();
      event.target.textContent = values.saved_passwords_modal_name;
      ModalManager.hide("saved_passwords_modal");
    };

    delete_password_button.onclick = function () {
      const buttons = document.querySelectorAll('#password_button_container button');
      user_manager.current_user.delete_password(index);

      for (let i = 0; i < buttons.length; i++) {
        if (buttons[i].textContent == event.target.textContent) {
          buttons[i].remove();
          break;
        }
      }

      ModalManager.hide("saved_passwords_modal");
    };
  }
}

class SettingsUI {
  static setupEventHandlers() {
    function setupDropdownHandler(dropdownId, settingsMethod) {
      document.getElementById(dropdownId).onclick = function (event) {
        if (event.target.tagName === 'A') {
          const colour = event.target.textContent;
          user_manager.current_user.settings[settingsMethod](colour);
        }
      };
    }

    ui.get("restore_default_button").onclick = () => {
      user_manager.current_user.settings.restore_defaults();
    };

    setupDropdownHandler("title_colour_dropdown", "set_title_colour");
    setupDropdownHandler("background_colour_dropdown", "set_background_colour");
  }
}

function open_tab(evt, tab_name) {
  let i, tab_content, tab_link;

  tab_content = document.getElementsByClassName("tab_content");
  for (i = 0; i < tab_content.length; i++) {
    tab_content[i].style.display = "none";
  }

  tab_link = document.getElementsByClassName("tab_link");
  for (i = 0; i < tab_link.length; i++) {
    tab_link[i].className = tab_link[i].className.replace(" active", "");
  }

  document.getElementById(tab_name).style.display = "block";
  evt.currentTarget.className += " active";
}

function reset_ui() {
  const container = ui.get("password_button_container");
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
}